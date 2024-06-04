import {v4 as uuidv4} from 'uuid';

export class VotingNode {
    constructor(port) {
        this.id = uuidv4();
        this.port = port;
        this.knownNodes = {};
    }

    getKnownNodes() {
        return this.knownNodes;
    }

    prepareHelloMessage() {
        return {
            nodeId: this.id,
            port: this.port
        };
    }

    handleHelloMessage(message, address) {
        if (message.nodeId === this.id) {
            return;
        }

        console.log("New node discovered: ", message);

        this.knownNodes[message.nodeId] = {
            port: message.port,
            address
        };
    }
}
