import {SUPPORTED_PORTS} from "../constants/supported-ports.js";

async function tryToBindSocket(socket, port) {
    return new Promise((resolve, reject) => {
        const handlePortTaken = (err) => {
            socket.removeListener('error', handlePortTaken);

            if (err.code === 'EADDRINUSE') {
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

export async function bindSocketForBroadcast(socket, logger) {
    for (const port of SUPPORTED_PORTS) {
        logger.info(`Trying to bind socket on port ${port}`)
        const success = await tryToBindSocket(socket, port);
        if (success) {
            return port;
        }
    }

    throw new Error("Failed to bind socket: no available ports found");
}
