import {VotingNode} from "./voting-node.js";
import {SocketService} from "./socket-service.js";
import {HttpServer} from "./http-server.js";
import {getLogger} from "./utils/get-logger.js";
import {UI} from "./ui.js";
import {getAddresses} from "./utils/get-addresses.js";


async function main() {
    const logger = getLogger();
    const httpServer = new HttpServer(logger);
    const addresses = getAddresses();

    const socketService = new SocketService(addresses.broadcastAddress, logger);
    await socketService.initialize();

    // TODO: set up a node from file after crash
    const node = new VotingNode(addresses.address, httpServer.getServerPort(), logger);

    socketService.startListening(node);
    await socketService.sendHelloBroadcast(node.prepareHelloMessage());

    httpServer.startListening(node);

    const ui = new UI(logger);
    await ui.start(node);


    httpServer.close()
    socketService.close()
}

main();
