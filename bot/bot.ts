import { createBot, type Player, type BotOptions } from "mineflayer";
import * as mineflayerCollectblock from "mineflayer-collectblock";
import * as mineflayerPathfinder from "mineflayer-pathfinder";
import * as mineflayerViewer from "prismarine-viewer";

/**
 * Creates a new Minecraft bot instance.
 * 
 * @param options - {
 *  host?: string;
 *  port?: number;
 *  username?: string;
 *  version?: string;
 * }
 * 
 * @returns The bot instance.
 */
export const createMinecraftBot = (options?: Partial<BotOptions> & { viewerPort?: number }) => {
    const bot = createBot((options || {}) as BotOptions);
    bot.loadPlugin(mineflayerCollectblock.plugin);
    bot.loadPlugin(mineflayerPathfinder.pathfinder);

    bot.once('spawn', () => {
        mineflayerViewer.mineflayer(bot, { port: options?.viewerPort, firstPerson: true })
    })

    bot.on("kicked", (message) => {
        console.log(message);
    });

    bot.on("end", () => {
        console.log("Bot disconnected");
    });

    bot.on("error", (error) => {
        console.log("onError", error);
    });

    return bot;
}

