import {VotingNode} from "./voting-node.js";
import {SocketService} from "./socket-service.js";
import {Server} from "./server.js";
import {getLogger} from "./utils/get-logger.js";
import {UI} from "./ui.js";


async function main() {
    const logger = getLogger();
    const server = new Server(logger);

    const socketService = new SocketService(logger);
    await socketService.initialize();

    // TODO: set up a node from file after crash
    const node = new VotingNode(server.serverPort);

    socketService.startListening(node);
    await socketService.sendHelloBroadcast(node.prepareHelloMessage());

    server.startListening(node);

    // TODO: start the application loop
    const ui = new UI(logger);
    await ui.start(node);


    server.close()
    socketService.close()
}

main();
