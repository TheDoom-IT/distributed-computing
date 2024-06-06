import {VotingNode} from "./voting-node.js";
import {SocketService} from "./socket-service.js";
import {HttpServer} from "./http-server.js";
import {getLogger} from "./utils/get-logger.js";
import {UI} from "./ui.js";
import {getAddresses} from "./utils/get-addresses.js";


async function main() {
    const ui = new UI()
    const nodeId = await ui.getNodeId();

    const logger = getLogger(nodeId);
    logger.info(`==== Starting node with ID ${nodeId} ====`)
    const httpServer = new HttpServer(logger);
    const addresses = getAddresses();

    const socketService = new SocketService(addresses.broadcastAddress, logger);
    await socketService.initialize();

    const node = new VotingNode(nodeId, addresses.address, httpServer.getServerPort(), logger);

    socketService.startListening(node);
    await socketService.sendHelloBroadcast(node.prepareHelloMessage());

    httpServer.startListening(node);

    await ui.start(node);


    httpServer.close()
    socketService.close()
}

main();
