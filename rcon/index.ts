import { Rcon } from 'rcon-client';

type RconConfig = {
    host: string;
    port: number;
    password: string;
};

export async function fetchPlayerInventory(config: RconConfig, playerName: string): Promise<string | null> {
    const rcon = await Rcon.connect({
        host: config.host,
        port: config.port,
        password: config.password,
    });

    try {
        // Minecraft Java example: request the Inventory NBT for playerName
        // If you use a different game, change this command to whatever the server supports.
        const cmd = `data get entity ${playerName} Inventory`;
        // send command and wait for console response
        const response = await rcon.send(cmd);

        // Basic sanity: null/empty -> no data/permission
        if (!response || typeof response !== 'string' || response.length === 0) {
            return null;
        }

        // The server usually returns a single-line string containing NBT-like data.
        // Example: "Player123 has the following entity data: [{id:"minecraft:stone",Count:64b,Slot:0b}, ...]"
        // Return raw response so caller can parse NBT with a proper parser, or parse simple cases here.
        return response;
    } finally {
        rcon.end();
    }
}