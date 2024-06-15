import {v4 as uuidv4} from 'uuid';
import {Logger} from "winston";
import {HelloMessage} from "./models/hello-message.js";
import {HelloReply} from "./models/hello-reply.js";
import {StartVoting} from "./models/start-voting.js";
import {VotingResultsSchema} from "./models/voting-results.js";
import {SendVote} from "./models/send-vote.js";
import {Database, InternalVoting, SentVote} from "./database.js";
import {
    ElectionMessage,
    ElectionMessageResponse,
    ElectionMessageResponseSchema,
    ElectionResult, ElectionResultResponse, ElectionResultResponseSchema
} from "./models/election.js";
import {tryJsonParse} from "./utils/try-json-parse.js";


interface ExternalNode {
    id: string;
    port: number;
    ip: string;
}

interface ExternalVoting {
    id: string;
    nodeId: string;
    question: string;
    voteOptions: string[];
    endTime: number;
}

interface Election {
    failedHostId: string;
    timestamp: number;
    finished: boolean;
}

export class VotingNode {
    private readonly knownNodes: Record<string, ExternalNode>;
    private readonly elections: Record<string, Election>;
    private readonly externalVotings: Record<string, ExternalVoting>;
    private readonly database: Database;

    constructor(private readonly id: string, private readonly ip: string, private readonly port: number, private readonly logger: Logger) {
        this.port = port;
        this.logger = logger;
        this.knownNodes = {};
        this.externalVotings = {};
        this.elections = {};

        this.database = new Database(id, this.logger);
    }

    getId() {
        return this.id;
    }

    getKnownNodes() {
        return this.knownNodes;
    }

    getExternalVotings() {
        return this.externalVotings;
    }

    getSentVote(votingId: string): SentVote | null {
        return this.database.getSentVote(votingId);
    }

    getInternalVoting(votingId: string): InternalVoting | null {
        return this.database.getVoting(votingId);
    }

    getInternalVotings() {
        return this.database.getAllVotings();
    }

    private async startSingleElection(election: Election) {
        const message: ElectionMessage = {
            nodeId: this.id,
            oldHostId: election.failedHostId,
            timestamp: election.timestamp
        };

        const requests = Object.values(this.knownNodes).map(async (knownNode) => {
            return this.sendMessage(`http://${knownNode.ip}:${knownNode.port}/election`, {
                method: 'POST',
                body: JSON.stringify(message),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        });

        const responses = await Promise.all(requests);
        const responsesAsText = await Promise.all(responses.map((r) => r?.text()));
        const messages = responsesAsText.filter((r): r is string => !!r)
            .map((r) => ElectionMessageResponseSchema.safeParse(tryJsonParse(r)))
            .filter((r) => r.success)
            .map((r) => r.data as ElectionMessageResponse);

        const anyFalse = messages.some((m) => !m.ok);
        if (anyFalse) {
            this.logger.error(`Election for node ${election.failedHostId} failed. One of the nodes returned false.`);
            this.elections[election.failedHostId].finished = true;
            return;
        }

        this.logger.info(`Election for node ${election.failedHostId} succeeded. Starting votings transfer.`);

        for (const eVoting of Object.values(this.externalVotings)) {
            if (eVoting.nodeId === election.failedHostId) {
                const newVoting: InternalVoting = {
                    id: eVoting.id,
                    question: eVoting.question,
                    voteOptions: eVoting.voteOptions,
                    endTime: eVoting.endTime,
                    votes: {}
                };

                // add vote sent by this node to the known votes
                const voting = this.database.getSentVote(eVoting.id);
                if(voting) {
                    newVoting.votes[this.id] = {
                        nodeId: this.id,
                        voteOptionIndex: voting.voteOptionIndex
                    }
                }

                delete this.externalVotings[eVoting.id];

                this.database.addNewVoting(newVoting);
            }
        }

        // announce election result
        const electionResult: ElectionResult = {
            oldHostId: election.failedHostId,
            nodeId: this.id
        }

        const electionResultMessage = JSON.stringify(electionResult);
        const electionResultsRequests = Object.values(this.knownNodes).map(async (knownNode) => {
            const response = await this.sendMessage(`http://${knownNode.ip}:${knownNode.port}/election-results`, {
                method: 'POST',
                body: electionResultMessage,
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            return {response, id: knownNode.id}
        });
        const electionResultResponses = await Promise.all(electionResultsRequests);
        const electionResultResponsesAsText = await Promise.all(electionResultResponses.map(async (r) => ({id: r.id, text: await r.response?.text()})));
        const eResultMessages = electionResultResponsesAsText.filter((r): r is {id: string, text: string} => !!r.text)
            .map((r) => ({id: r.id, data: ElectionResultResponseSchema.safeParse(tryJsonParse(r.text))}))
            .filter((r) => r.data.success)
            .map((r) => ({id: r.id, data: r.data.data as ElectionResultResponse}));

        // save received votes
        for (const message of eResultMessages) {
            for (const [votingId, voteOptionIndex] of message.data.votes) {
                if (voteOptionIndex !== null) {
                    this.database.addVote(votingId, {nodeId: message.id, voteOptionIndex});
                }
            }
        }

        // save votings
        this.elections[election.failedHostId].finished = true;
        this.logger.info(`Election for node ${election.failedHostId} finished.`);
    }

    async startElectionForNode(nodeId: string) {
        this.logger.info(`Starting election for node ${nodeId}`);

        const election: Election = {
            failedHostId: nodeId,
            timestamp: new Date().getTime(),
            finished: false
        };

        this.elections[nodeId] = election;

        await this.startSingleElection(election);
    }

    async getExternalVotingResults(votingId: string) {
        const voting = this.externalVotings[votingId];
        if (!voting) {
            throw new Error(`Voting ${votingId} not found`);
        }

        const externalNode = this.knownNodes[voting.nodeId];
        if (!externalNode) {
            throw new Error(`Node ${voting.nodeId} not found`);
        }

        const result = await this.sendMessage(`http://${externalNode.ip}:${externalNode.port}/get-voting-results/${votingId}`, {
            method: 'GET',
        });

        if (result === null) {
            await this.startElectionForNode(externalNode.id);
            return null;
        }

        if (!result.ok) {
            this.logger.error(`Failed to get voting results for voting ${votingId}`);
            return null;
        }

        const results = VotingResultsSchema.safeParse(await result.json());

        if (!results.success) {
            this.logger.error(`Failed to parse voting results for voting ${votingId}`);
            return null;
        }

        return results.data;
    }

    prepareHelloMessage(): HelloMessage {
        const allVotings = this.database.getAllVotings();
        const activeVotings = Object.values(allVotings).map((voting) => ({
            votingId: voting.id,
            endTime: voting.endTime,
            question: voting.question,
            voteOptions: voting.voteOptions
        }));

        return {
            nodeId: this.id,
            port: this.port,
            ip: this.ip,
            activeVotings
        };
    }

    handleElectionResultMessage(message: ElectionResult): ElectionResultResponse {
        const result: ElectionResultResponse['votes'] = [];

        // change known votings owner
        Object.values(this.externalVotings).forEach((voting) => {
            if (voting.nodeId === message.oldHostId) {
                voting.nodeId = message.nodeId;

                const voteOptionIndex = this.database.getSentVote(voting.id)?.voteOptionIndex ?? null;
                result.push([voting.id, voteOptionIndex]);
            }
        });

        // change internal votings to external
        if (this.id === message.oldHostId) {
            const internalVotings = this.database.getAllVotings();
            this.database.removeAllVotings();
            for (const iVoting of Object.values(internalVotings)) {
                this.externalVotings[iVoting.id] = {
                    id: iVoting.id,
                    nodeId: message.nodeId,
                    question: iVoting.question,
                    voteOptions: iVoting.voteOptions,
                    endTime: iVoting.endTime
                }

                const voteOptionIndex = iVoting.votes[this.id]?.voteOptionIndex ?? null
                result.push([iVoting.id, voteOptionIndex]);
            }
        }

        return {
            votes: result
        }
    }

    handleElectionMessage(election: ElectionMessage): ElectionMessageResponse {
        const oldElection = this.elections[election.oldHostId];
        if (oldElection && !oldElection.finished && oldElection.timestamp < election.timestamp) {
            return {
                ok: false
            }
        }

        return {
            ok: true
        }
    }

    async handleHelloMessage(message: HelloMessage) {
        if (message.nodeId === this.id) {
            return;
        }

        this.addNode({
            id: message.nodeId,
            port: message.port,
            ip: message.ip
        })


        message.activeVotings?.forEach((activeVoting) => {
            const iVoting = this.database.getVoting(activeVoting.votingId)
            if (!iVoting) {
                this.externalVotings[activeVoting.votingId] = {
                    id: activeVoting.votingId,
                    nodeId: message.nodeId,
                    question: activeVoting.question,
                    voteOptions: activeVoting.voteOptions,
                    endTime: activeVoting.endTime
                }
            }
        })
        await this.sendHelloReply(this.knownNodes[message.nodeId]);
    }

    handleHelloReply(message: HelloReply) {
        this.addNode({
            id: message.nodeId,
            port: message.port,
            ip: message.ip
        });

        message.activeVotings?.forEach((activeVoting) => {
            this.externalVotings[activeVoting.votingId] = {
                id: activeVoting.votingId,
                nodeId: message.nodeId,
                question: activeVoting.question,
                voteOptions: activeVoting.voteOptions,
                endTime: activeVoting.endTime
            }

            this.database.removeVoting(activeVoting.votingId);
        })
    }

    addNode(node: ExternalNode) {
        if (this.knownNodes[node.id]) {
            this.logger.info(`Node ${node.id} connected again. Updating the address.`);
        } else {
            this.logger.info(`New node discovered: ${node.id}`)
        }

        this.knownNodes[node.id] = node;
    }

    private async sendMessage(url: string, params: Record<string, any>): Promise<Response | null> {
        try {
            this.logger.info(`Sending message to ${url}`);
            const result = await fetch(url, params)
            if (!result.ok) {
                this.logger.error(`Failed to send message to ${url}. Invalid response: ${result.status}`);
            }

            return result;
        } catch (error) {
            this.logger.error(`Failed to send message to ${url}: ${error}`);
        }
        return null;
    }

    async sendHelloReply(node: ExternalNode) {
        const allVotings = this.database.getAllVotings();
        const activeVotings = Object.values(allVotings).map((voting) => ({
            votingId: voting.id,
            endTime: voting.endTime,
            question: voting.question,
            voteOptions: voting.voteOptions
        }));

        const message: HelloReply = {
            nodeId: this.id,
            port: this.port,
            ip: this.ip,
            activeVotings
        };

        const result = await this.sendMessage(`http://${node.ip}:${node.port}/hello-reply`, {
            method: 'POST',
            body: JSON.stringify(message),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (result === null || !result.ok) {
            this.logger.error(`Failed to send hello reply to node ${node.id}`);
        }
    }

    async startNewVoting(question: string, voteOptions: string[], timeLimit: number) {
        // getTime uses milliseconds, change timeLimit to milliseconds
        const endTime = new Date().getTime() + timeLimit * 1000;
        const id = uuidv4();
        this.database.addNewVoting({id, question, voteOptions, endTime, votes: {}});

        const startVoting: StartVoting = {
            nodeId: this.id,
            votingId: id,
            question,
            voteOptions,
            endTime
        };

        const startVotingMessage = JSON.stringify(startVoting)

        for (const nodeId in this.knownNodes) {
            await this.sendStartVotingToNode(this.knownNodes[nodeId], startVotingMessage);
        }
    }

    async sendStartVotingToNode(node: ExternalNode, message: string) {
        const result = await this.sendMessage(`http://${node.ip}:${node.port}/start-voting`, {
            method: 'POST',
            body: message,
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (result === null || !result.ok) {
            this.logger.error(`Failed to send start voting message to node ${node.id}`);
        }
    }

    handleStartVoting(message: StartVoting) {
        if (!this.knownNodes[message.nodeId]) {
            throw new Error(`Unknown node ${message.nodeId} tried to start voting ${message.votingId}`);
        }

        if (this.externalVotings[message.votingId]) {
            this.logger.info(`Voting ${message.votingId} already exists`);
            return;
        }

        this.externalVotings[message.votingId] = {
            id: message.votingId,
            nodeId: message.nodeId,
            question: message.question,
            voteOptions: message.voteOptions,
            endTime: message.endTime
        }
    }

    handleSendVote(voting: InternalVoting, message: SendVote) {
        const knownNode = this.knownNodes[message.nodeId];
        if (!knownNode) {
            throw new Error(`Unknown node ${message.nodeId} tried to send vote`);
        }

        const previousVote = voting.votes[message.nodeId];
        if (previousVote) {
            this.logger.info(`Node ${message.nodeId} already voted in voting ${message.votingId}. Changing the vote.`);
        }

        const vote = {
            nodeId: message.nodeId,
            voteOptionIndex: message.voteOptionIndex
        }

        this.database.addVote(message.votingId, vote);
    }

    addVoteToInternalVoting(votingId: string, voteOptionIndex: number) {
        const voting = this.getInternalVoting(votingId);
        if (!voting) {
            throw new Error(`Voting ${votingId} not found`);
        }

        const vote = {
            nodeId: this.id,
            voteOptionIndex: voteOptionIndex
        }

        this.database.addVote(votingId, vote);
        this.database.addSentVote({votingId, voteOptionIndex});
    }

    async sendVote(votingId: string, voteOptionIndex: number) {
        const voting = this.externalVotings[votingId];
        if (!voting) {
            throw new Error(`Voting ${votingId} not found`);
        }

        const externalNode = this.knownNodes[voting.nodeId];
        if (!externalNode) {
            throw new Error(`Node ${voting.nodeId} not found`);
        }

        const vote: SendVote = {
            nodeId: this.id,
            votingId,
            voteOptionIndex,
        }

        const result = await this.sendMessage(`http://${externalNode.ip}:${externalNode.port}/send-vote`, {
            method: 'POST',
            body: JSON.stringify(vote),
            headers: {
                'Content-Type': 'application/json'
            }
        })

        if (result === null) {
            await this.startElectionForNode(externalNode.id);
            return;
        }

        if (!result.ok) {
            this.logger.error(`Failed to send vote to node ${voting.nodeId}`);
        }

        this.database.addSentVote({votingId, voteOptionIndex});
    }
}
