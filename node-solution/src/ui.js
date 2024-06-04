import {input, select} from "@inquirer/prompts";

export class UI {
    constructor(logger) {
        this.logger = logger;
    }

    ACTIONS = {
        START_VOTING: 'Start voting',
        SEND_VOTE: 'Send vote',
        GET_RESULTS: 'Get voting results',
        GET_LIST_OF_NODES: 'Get list of nodes',
        EXIT: 'Exit'
    };

    async start(node) {
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
                    this.handleStartVoting(node);
                    break;
                case this.ACTIONS.SEND_VOTE:
                    this.handleSendVote(node);
                    break;
                case this.ACTIONS.GET_RESULTS:
                    this.handleGetResults(node);
                    break;
                case this.ACTIONS.GET_LIST_OF_NODES:
                    this.handleGetListOfNodes(node);
                    break;
                case this.ACTIONS.EXIT:
                    break whileLoop;
            }
        }
    }

    handleStartVoting(node) {
        console.log("Start voting")
    }

    handleSendVote(node) {

    }

    handleGetResults(node) {

    }

    handleGetListOfNodes(node) {
        const knownNodes = node.getKnownNodes();
        console.log(knownNodes)
    }
}
