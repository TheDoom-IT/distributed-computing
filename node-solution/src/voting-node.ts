import {v4 as uuidv4} from 'uuid';
import {Logger} from "winston";
import {HelloMessage} from "./models/hello-message.js";
import {HelloReply} from "./models/hello-reply.js";
import {StartVoting} from "./models/start-voting.js";
import {VotingResultsSchema} from "./models/voting-results.js";
import {SendVote} from "./models/send-vote.js";


interface ExternalNode {
    id: string;
    port: number;
    ip: string;
}

interface Vote {
    nodeId: string;
    voteOptionIndex: number;
}

interface InternalVoting {
    id: string;
    question: string;
    voteOptions: string[];
    endTime: number;
    votes: Record<string, Vote>;
}

interface ExternalVoting {
    id: string;
    nodeId: string;
    question: string;
    voteOptions: string[];
    endTime: number;
}

export class VotingNode {
    private readonly id: string;
    private readonly knownNodes: Record<string, ExternalNode>;
    private readonly votings: Record<string, InternalVoting>;
    private readonly externalVotings: Record<string, ExternalVoting>;

    constructor(private readonly ip: string, private readonly port: number, private logger: Logger) {
        this.id = uuidv4();
        this.port = port;
        this.logger = logger;
        this.knownNodes = {};
        this.votings = {}
        this.externalVotings = {}
    }

    getKnownNodes() {
        return this.knownNodes;
    }

    getExternalVotings() {
        return this.externalVotings;
    }

    getVotingResults(votingId: string): InternalVoting | null {
        return this.votings[votingId];
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

        if (result === null || !result.ok) {
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
        return {
            nodeId: this.id,
            port: this.port,
            ip: this.ip
        };
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

        await this.sendHelloReply(this.knownNodes[message.nodeId]);
    }

    handleHelloReply(message: HelloReply) {
        this.addNode({
            id: message.nodeId,
            port: message.port,
            ip: message.ip
        });

        if (message.activeVotings === undefined) {
            return;
        }
        for (const activeVoting of message.activeVotings) {
            this.externalVotings[activeVoting.votingId] = {
                id: activeVoting.votingId,
                nodeId: message.nodeId,
                question: activeVoting.question,
                voteOptions: activeVoting.voteOptions,
                endTime: activeVoting.endTime
            }
        }
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
            return await fetch(url, params)
        } catch (error) {
            this.logger.error(`Failed to send message to ${url}`);
        }
        return null;
    }

    async sendHelloReply(node: ExternalNode) {
        const activeVotings = Object.values(this.votings).map((voting) => ({
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
        const endTime = new Date().getTime() + timeLimit;
        const id = uuidv4();
        this.votings[id] = {id, question, voteOptions, endTime, votes: {}};

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

    handleSendVote(message: SendVote) {
        const knownNode = this.knownNodes[message.nodeId];
        if (!knownNode) {
            throw new Error(`Unknown node ${message.nodeId} tried to send vote`);
        }

        const voting = this.votings[message.votingId];
        if (!voting) {
            throw new Error(`Voting ${message.votingId} not found`);
        }

        const previousVote = voting.votes[message.nodeId];
        if (previousVote) {
            this.logger.info(`Node ${message.nodeId} already voted in voting ${message.votingId}. Changing the vote.`);
        }

        voting.votes[message.nodeId] = {
            nodeId: message.nodeId,
            voteOptionIndex: message.voteOptionIndex
        }
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

        if (result === null || !result.ok) {
            this.logger.error(`Failed to send vote to node ${voting.nodeId}`);
        }
    }
}
