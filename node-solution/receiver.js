import dgram from "node:dgram";

const socket = dgram.createSocket('udp4');

let messages = [];

const reviewMessages = () => {
    for (let i = 0; i < 100; i++) {
        if (!messages[i + 1]) {
            console.log(`Message ${i + 1} was not received.`);
        }
    }
};

socket.bind(5001, () => {
    socket.on('message', (message, rinfo) => {
        const index = Number(message);
        console.log(`Received message from ${rinfo.address}:${rinfo.port} - ${message}.`);
        messages[index] = true;

        if (index === 100) {
            reviewMessages();
            socket.close();
        }
    });
});

