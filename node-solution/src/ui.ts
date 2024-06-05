import {input, select} from "@inquirer/prompts";
import {VotingNode} from "./voting-node.js";
import {Logger} from "winston";

export class UI {
    constructor(private logger: Logger) {
    }

    ACTIONS = {
        START_VOTING: 'Start voting',
        SEND_VOTE: 'Send vote',
        GET_RESULTS: 'Get voting results',
        GET_LIST_OF_NODES: 'Get list of nodes',
        EXIT: 'Exit'
    };

    MAX_VOTE_OPTIONS = 8;

    async start(node: VotingNode) {
        this.logger.info("UI started");

        whileLoop: while (true) {
            const menuAction = await select({
                message: 'What do you want to do?',
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
                        value: this.ACTIONS.GET_RESULTS,
                        description: 'Get voting results',
                    },
                    {
                        value: this.ACTIONS.GET_LIST_OF_NODES,
                        description: 'Get list of nodes',
                    },
                    {
                        value: this.ACTIONS.EXIT,
                        description: 'Exit the application',
                    }
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
                case this.ACTIONS.GET_LIST_OF_NODES:
                    this.handleGetListOfNodes(node);
                    break;
                case this.ACTIONS.EXIT:
                    break whileLoop;
            }
        }
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

            if (voteOptions.length === this.MAX_VOTE_OPTIONS) {
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
        const choices = Object.values(externalVotings).map((voting) => ({
            value: voting.id,
            description: voting.question
        }))

        if (choices.length === 0) {
            console.log("There are no active votings")
            return;
        }

        const votingId = await select({
            message: 'Which voting do you want to vote in?',
            choices
        });

        const voting = externalVotings[votingId];
        const voteOptions = voting.voteOptions.map((option, index) => ({
            name: option,
            value: index
        }))

        const voteOptionIndex = await select({
            message: 'Choose your vote option',
            choices: voteOptions
        });

        await node.sendVote(votingId, voteOptionIndex);
    }

    async handleGetResults(node: VotingNode) {
        const externalVotings = node.getExternalVotings();
        const choices = Object.values(externalVotings).map((voting) => ({
            value: voting.id,
            description: voting.question
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
