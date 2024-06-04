import {getBroadcastAddress} from "./utils/get-broadcast-address.js";
import dgram from "node:dgram";
import {tryJsonParse} from "./utils/try-json-parse.js";
import {HelloMessageSchema} from "./models/hello-message.js";
import {bindSocketForBroadcast} from "./utils/bind-socket-for-broadcast.js";
import {SUPPORTED_PORTS} from "./constants/supported-ports.js";

export class SocketService {
    constructor(logger) {
        this.logger = logger;
    }

    async initialize() {
        this.broadcastAddress = getBroadcastAddress();
        this.logger.info(`Using broadcast address: ${this.broadcastAddress}`);

        this.socket = dgram.createSocket('udp4');

        this.broadcastPort = await bindSocketForBroadcast(this.socket, this.logger);

        // TODO: how to handle the error event
        this.socket.on('error', (err) => {
            this.logger.error(`Unexpected error occurred: ${err}. Closing application...`);
            process.exit(1);
            this.socket.close();
        });
    }

    /**
     * Start listening for broadcast messages
     * @param {VotingNode} node - Voting node.
     */
    startListening(node) {
        this.socket.setBroadcast(true);

        this.socket.on('message', (msg, rinfo) => {
            let data = tryJsonParse(msg.toString());
            if (data === null) {
                this.logger.warn("Unsupported broadcast message received");
                return;
            }
            const message = HelloMessageSchema.safeParse(data);
            if (message.success === false) {
                this.logger.warn("Unsupported broadcast message received");
                return;
            }

            const helloMessage = message.data;
            node.handleHelloMessage(helloMessage, rinfo.address)
        });
        this.logger.info(`Listening for broadcast on port ${this.broadcastPort}`)
    }

    async sendHelloBroadcast(helloMessage) {
        this.logger.info("Sending hello broadcast to find other nodes...")

        const messageBuffer = Buffer.from(JSON.stringify(helloMessage));

        const messages = SUPPORTED_PORTS.map((port) => {
            return new Promise((res, rej) => {
                this.socket.send(messageBuffer, port, this.broadcastAddress, (err, bytes) => {
                    if (err) {
                        rej(err);
                        // TODO: handle error
                    }
                    res();
                });
            })
        });

        await Promise.all(messages);
    }

    close() {
        this.socket.close()
    }
}
