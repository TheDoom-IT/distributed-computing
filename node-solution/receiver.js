import dgram from "node:dgram";

const socket = dgram.createSocket('udp4');

let count = 0;

socket.bind(5001, () => {
    socket.on('message', (message, rinfo) => {
        console.log(`Received message from ${rinfo.address}:${rinfo.port} - ${message}. Total messages received: ${count + 1}`);
        count++;
    });
});

