import {input, select} from "@inquirer/prompts";
import {VotingNode} from "./voting-node.js";
import {v4 as uuidv4} from 'uuid';
import {MAX_VOTE_OPTIONS} from "./constants/max-vote-options.js";
import * as util from "node:util";
import {InternalVoting} from "./database.js";
import {SocketService} from "./socket-service.js";

export class UI {
    ACTIONS = {
        START_VOTING: 'Start voting',
        SEND_VOTE: 'Send vote',
        GET_RESULTS: 'Get external voting results',
        GET_LIST_OF_NODES: 'Get list of nodes',
        GET_STARTED_VOTINGS: 'Get internal votings',
        RESEND_BROADCAST: 'Resend broadcast',
        EXIT: 'Exit'
    };

    async getNodeId() {
        const nodeId = await input({
            message: "What node ID do you want to use? (Leave empty for random)",
        });

        if (nodeId === '') {
            return uuidv4();
        }

        return nodeId;
    }

    async start(node: VotingNode, socketService: SocketService) {
        whileLoop: while (true) {
            const menuAction = await select({
                message: `${node.getId()}: What do you want to do?`,
                choices: [
                    {
                        value: this.ACTIONS.START_VOTING,
                        description: 'Start new voting',
                    },
                    {
                        value: this.ACTIONS.SEND_VOTE,
                        description: 'Send vote to active voting',
                    },
                    {
                        value: this.ACTIONS.GET_LIST_OF_NODES,
                        description: 'Get list of nodes',
                    },
                    {
                        value: this.ACTIONS.GET_RESULTS,
                        description: 'Get voting results',
                    },
                    {
                        value: this.ACTIONS.RESEND_BROADCAST,
                        description: 'Resend broadcast',
                    },
                    {
                        value: this.ACTIONS.GET_STARTED_VOTINGS,
                        description: 'Get started votes',
                    },
                    {
                        value: this.ACTIONS.EXIT,
                        description: 'Exit the application',
                    },
                ],
            });

            switch (menuAction) {
                case this.ACTIONS.START_VOTING:
                    await this.handleStartVoting(node);
                    break;
                case this.ACTIONS.SEND_VOTE:
                    await this.handleSendVote(node);
                    break;
                case this.ACTIONS.GET_RESULTS:
                    await this.handleGetResults(node);
                    break;
                case this.ACTIONS.GET_STARTED_VOTINGS:
                    this.handleGetStartedVotings(node);
                    break;
                case this.ACTIONS.GET_LIST_OF_NODES:
                    this.handleGetListOfNodes(node);
                    break;
                case this.ACTIONS.RESEND_BROADCAST:
                    await this.handleResendBroadcast(node, socketService);
                    break;
                case this.ACTIONS.EXIT:
                    break whileLoop;
            }
        }
    }

    async handleResendBroadcast(node: VotingNode, socketService: SocketService) {
        await socketService.sendHelloBroadcast(node.prepareHelloMessage());
    }

    handleGetStartedVotings(node: VotingNode) {
        const votings = node.getInternalVotings()
        const toShow = Object.values(votings)
        console.log(util.inspect(toShow, {depth: null, colors: true}))
    }

    async handleStartVoting(node: VotingNode) {
        const question = await input({
            message: "Enter voting question"
        });
        const voteOptions = [];
        console.log("Enter possible voting answers. Type '' to finish");

        while (true) {
            const answer = await input({
                message: `${voteOptions.length + 1}. Answer:`,
            });
            if (answer === '') {
                if (voteOptions.length === 0) {
                    console.log("You need to enter at least one answer")
                    continue;
                }
                break;
            }

            voteOptions.push(answer);

            if (voteOptions.length === MAX_VOTE_OPTIONS) {
                console.log("You have reached the maximum number of vote options")
                break;
            }
        }

        const timeLimit = await input({
            message: "Enter voting time limit in seconds",
            validate: (input) => {
                const asNumber = Number(input);
                if (isNaN(asNumber) || asNumber <= 0) {
                    return "Please enter a valid number";
                }
                return true;
            }
        });

        await node.startNewVoting(question, voteOptions, Number(timeLimit))
    }

    async handleSendVote(node: VotingNode) {
        const externalVotings = node.getExternalVotings();
        const expiredExternal = Object.values(externalVotings).filter((voting) => voting.endTime < new Date().getTime());
        const validExternal = Object.values(externalVotings).filter((voting) => voting.endTime >= new Date().getTime());

        const internalVotings = node.getInternalVotings();
        const expiredInternal = Object.values(internalVotings).filter((voting) => voting.endTime < new Date().getTime());
        const validInternal = Object.values(internalVotings).filter((voting) => voting.endTime >= new Date().getTime());

        if (validInternal.length === 0 && validExternal.length === 0) {
            console.log("There are no active votings")
            return;
        }

        const validExternalChoices = validExternal.map((voting) => ({
            name: voting.nodeId + ": " + voting.question,
            value: voting,
        }));
        const validInternalChoices = validInternal.map((voting) => ({
            name: node.getId() + ": " + voting.question,
            value: {...voting, nodeId: node.getId()},
        }));

        const expiredExternalChoices = expiredExternal.map((voting) => ({
            name: voting.nodeId + ": " + voting.question + " (expired)",
            value: voting,
            disabled: true
        }));
        const expiredInternalChoices = expiredInternal.map((voting) => ({
            name: node.getId() + ": " + voting.question + " (expired)",
            value: {...voting, nodeId: node.getId()},
            disabled: true
        }));

        const choices = [...validExternalChoices, ...validInternalChoices, ...expiredExternalChoices, ...expiredInternalChoices]

        const selectedVoting = await select({
            message: 'Which voting do you want to vote in?',
            choices
        });

        const voteOptions = selectedVoting.voteOptions.map((option, index) => ({
            name: option,
            value: index
        }))

        const voteOptionIndex = await select({
            message: 'Choose your vote option',
            choices: voteOptions
        });

        if (selectedVoting.nodeId === node.getId()) {
            node.addVoteToInternalVoting(selectedVoting.id, voteOptionIndex)
        } else {
            await node.sendVote(selectedVoting.id, voteOptionIndex);
        }
    }

    async handleGetResults(node: VotingNode) {
        const externalVotings = node.getExternalVotings();
        const choices = Object.values(externalVotings).map((voting) => ({
            name: voting.nodeId + ": " + voting.question,
            value: voting.id
        }))
        if (choices.length === 0) {
            console.log("There are no active votings")
            return;
        }
        const votingId = await select({
            message: 'Which voting results do you want to see?',
            choices
        });
        const results = await node.getExternalVotingResults(votingId);
        if (results === null) {
            console.log("Failed to get voting results")
            return;
        }

        console.log(results);
    }

    handleGetListOfNodes(node: VotingNode) {
        const knownNodes = node.getKnownNodes();
        console.log(knownNodes)
    }
}
