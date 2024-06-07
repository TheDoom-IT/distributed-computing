import dgram from "node:dgram";
import { getAddresses } from "./dist/utils/get-addresses.js";

const socket = dgram.createSocket('udp4');

const addresses = getAddresses();

const send100Messages = async () => {
    for (let i = 0; i < 100; i++) {
        console.log(`Sending message ${i + 1}`);
        const message = Buffer.from(`Message ${i}`);
        await new Promise(((res, rej) => {
            socket.send(message, 0, message.length, 5001, addresses.broadcastAddress, (error) => {
                if (error !== null) {
                    rej();
                }
                res();
            });
        }));
        await new Promise((res => setTimeout(res, 100)));
    }
};

const startSending = async () => {
    socket.setBroadcast(true);
    console.log('Sending broadcast message');

    await send100Messages();

    socket.close();
};

socket.bind(5000, () => {
    startSending();
});

