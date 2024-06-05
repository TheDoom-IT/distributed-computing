import os from 'node:os';

export function getAddresses(): { broadcastAddress: string, address: string } {
    const ipv4Addresses = [];

    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        const iface = interfaces[name];
        for (const addr of iface!) {
            if (addr.family === 'IPv4' && !addr.internal) {
                ipv4Addresses.push(addr);
            }
        }
    }

    if (ipv4Addresses.length === 0) {
        throw new Error('No network interfaces found');
    }

    if (ipv4Addresses.length > 1) {
        console.warn('Multiple network interfaces found. Using the first one: ', ipv4Addresses[0].address);
    }

    const address = ipv4Addresses[0].address;
    const netmask = ipv4Addresses[0].netmask;
    const addressParts = address.split('.');
    const netmaskParts = netmask.split('.');
    const prefix = addressParts.map((value, index) => {
        return Number(value) & Number(netmaskParts[index]);
    });
    const postfix = netmaskParts.map((value) => {
        return Number(value) ^ 255;
    });

    const broadcastAddress =  prefix.map((value, index) => {
        return value + postfix[index];
    }).map((value) => value.toString()).join(".");

    return {broadcastAddress, address};
}
