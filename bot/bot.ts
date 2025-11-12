import { createBot, type Bot, type BotOptions } from "mineflayer";
import * as mineflayerCollectblock from "mineflayer-collectblock";
import * as mineflayerPathfinder from "mineflayer-pathfinder";
import * as mineflayerViewer from "prismarine-viewer";

const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

export type MinecraftBotManager = {
    getBot: () => Bot;
    stop: () => Promise<void>;
};

type ManagedBotOptions = Partial<BotOptions> & {
    viewerPort?: number;
};

const createReconnectDelay = (attempt: number) => {
    const exponentialDelay = BASE_RECONNECT_DELAY_MS * 2 ** attempt;
    const cappedDelay = Math.min(exponentialDelay, MAX_RECONNECT_DELAY_MS);
    const jitter = Math.random() * 0.25 * cappedDelay;

    return Math.round(cappedDelay + jitter);
};

/**
 * Creates a managed Minecraft bot instance that automatically attempts to
 * reconnect when it gets disconnected, kicked or crashes. The provided
 * callback is invoked every time a new bot instance is created so callers can
 * update their references.
 *
 * @param options Bot creation options and optional viewer port.
 * @param onBotReady Callback called whenever a new bot instance is created.
 * @returns A bot manager exposing the current bot instance and a stop method.
 */
export const createMinecraftBot = (
    options: ManagedBotOptions = {},
    onBotReady?: (bot: Bot) => void,
): MinecraftBotManager => {
    let activeBot: Bot;
    let reconnectTimeout: NodeJS.Timeout | null = null;
    let reconnectAttempts = 0;
    let stopped = false;

    const {
        viewerPort,
        ...botCreationOptions
    } = options;

    const scheduleReconnect = (reason: string, error?: unknown) => {
        if (stopped) {
            return;
        }

        if (reconnectTimeout) {
            return;
        }

        const delay = createReconnectDelay(reconnectAttempts);
        reconnectAttempts += 1;

        const reasonDetails = typeof reason === "string" ? reason : "unknown";
        const errorDetails = error instanceof Error ? error.message : error;

        console.warn(
            `[BotManager] Bot disconnected (${reasonDetails}). Reconnecting in ${delay}ms.`,
            errorDetails ? { error: errorDetails } : undefined,
        );

        reconnectTimeout = setTimeout(() => {
            reconnectTimeout = null;
            createBotInstance();
        }, delay);
    };

    const attachLifecycleHandlers = (bot: Bot) => {
        bot.once("spawn", () => {
            reconnectAttempts = 0;

            try {
                mineflayerViewer.mineflayer(bot, {
                    port: viewerPort,
                    firstPerson: false,
                });
            } catch (viewerError) {
                console.error("[BotManager] Failed to initialize viewer:", viewerError);
            }
        });

        bot.on("kicked", (message) => {
            console.warn("[BotManager] Bot was kicked:", message);
            scheduleReconnect("kicked", message);
        });

        bot.on("end", () => {
            console.warn("[BotManager] Bot connection ended.");
            scheduleReconnect("end");
        });

        bot.on("error", (error) => {
            console.error("[BotManager] Bot error:", error);
            scheduleReconnect("error", error);
        });
    };

    const createBotInstance = () => {
        if (stopped) {
            return;
        }

        const bot = createBot(botCreationOptions as BotOptions);
        bot.loadPlugin(mineflayerCollectblock.plugin);
        bot.loadPlugin(mineflayerPathfinder.pathfinder);

        attachLifecycleHandlers(bot);

        activeBot = bot;
        onBotReady?.(bot);
    };

    const getBot = () => activeBot;

    const stop = async () => {
        stopped = true;

        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
            reconnectTimeout = null;
        }

        if (activeBot) {
            try {
                await activeBot.quit();
            } catch (error) {
                console.error("[BotManager] Error while stopping bot:", error);
            }
        }
    };

    createBotInstance();

    return { getBot, stop };
};

