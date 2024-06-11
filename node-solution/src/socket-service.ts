import dgram from "node:dgram";
import {tryJsonParse} from "./utils/try-json-parse.js";
import {HelloMessage, HelloMessageSchema} from "./models/hello-message.js";
import {bindSocketForBroadcast} from "./utils/bind-socket-for-broadcast.js";
import {SUPPORTED_PORTS} from "./constants/supported-ports.js";
import {Logger} from "winston";
import {VotingNode} from "./voting-node.js";

export class SocketService {
    constructor(private broadcastAddress: string, private logger: Logger) {
        this.socket = dgram.createSocket('udp4');
    }

    private readonly socket: dgram.Socket;
    private broadcastPort: number | undefined;

    async initialize() {
        this.logger.info(`Using broadcast address: ${this.broadcastAddress}`);

        this.broadcastPort = await bindSocketForBroadcast(this.socket, this.logger);

        this.socket.on('error', (err) => {
            this.logger.error(`Unexpected error occurred: ${err}. Closing application...`);
            this.socket.close();
            process.exit(1);
        });
    }

    startListening(node: VotingNode) {
        this.socket.setBroadcast(true);

        this.socket.on('message', async (msg, rinfo) => {
            let data = tryJsonParse(msg.toString());
            if (data === null) {
                this.logger.warn("Unsupported broadcast message received");
                return;
            }
            const message = HelloMessageSchema.safeParse(data);
            if (!message.success) {
                this.logger.warn("Unsupported broadcast message received");
                return;
            }

            const helloMessage = message.data;
            await node.handleHelloMessage(helloMessage)
        });
        this.logger.info(`Listening for broadcast on port ${this.broadcastPort}`)
    }

    private prepareMessages(message: Buffer): Promise<void>[] {
        return SUPPORTED_PORTS.map((port) => {
            return new Promise<void>((res, rej) => {
                this.socket.send(message, port, this.broadcastAddress, (err, bytes) => {
                    if (err) {
                        this.logger.error(`Failed to send message to ${this.broadcastAddress}:${port}`);
                        rej(err);
                    }
                    res();
                });
            })
        });
    }

    async sendHelloBroadcast(helloMessage: HelloMessage) {
        this.logger.info("Sending hello broadcast to find other nodes...")

        const messageBuffer = Buffer.from(JSON.stringify(helloMessage));

        const messages = [...this.prepareMessages(messageBuffer), this.prepareMessages(messageBuffer)]

        await Promise.all(messages);
    }

    close() {
        this.socket.close()
    }
}
