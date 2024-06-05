import {SUPPORTED_PORTS} from "../constants/supported-ports.js";
import dgram from "node:dgram";
import {Logger} from "winston";

async function tryToBindSocket(socket: dgram.Socket, port: number) {
    return new Promise((resolve, reject) => {
        const handlePortTaken = (err: Error) => {
            socket.removeListener('error', handlePortTaken);

            if ('code' in err && err.code === 'EADDRINUSE') {
                return resolve(false);
            }

            reject(err);
        }

        socket.addListener('error', handlePortTaken)

        socket.bind(port, () => {
            socket.removeListener('error', handlePortTaken);
            resolve(true);
        });
    });
}

export async function bindSocketForBroadcast(socket: dgram.Socket, logger: Logger) {
    for (const port of SUPPORTED_PORTS) {
        logger.info(`Trying to bind socket on port ${port}`)
        const success = await tryToBindSocket(socket, port);
        if (success) {
            return port;
        }
    }

    throw new Error("Failed to bind socket: no available ports found");
}
