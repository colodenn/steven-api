import { createBot, type Bot, type BotOptions } from "mineflayer";
import { EventEmitter } from "events";
import * as mineflayerCollectblock from "mineflayer-collectblock";
import * as mineflayerPathfinder from "mineflayer-pathfinder";
import * as mineflayerViewer from "prismarine-viewer";
import * as minecraftHawkEyeModule from 'minecrafthawkeye';
import * as minecraftPvp from 'mineflayer-pvp';
import * as tool from 'mineflayer-tool';

const patchEventEmitterForBun = () => {
    const eventEmitterPrototype = EventEmitter.prototype as EventEmitter & { __bunRemoveAllPatched?: boolean; __originalRemoveAllListeners?: EventEmitter["removeAllListeners"] };

    if (eventEmitterPrototype.__bunRemoveAllPatched) {
        return;
    }

    const originalRemoveAllListeners = eventEmitterPrototype.removeAllListeners;

    eventEmitterPrototype.__originalRemoveAllListeners = originalRemoveAllListeners;
    eventEmitterPrototype.removeAllListeners = function patchedRemoveAllListeners(this: EventEmitter | undefined | null, ...args: Parameters<EventEmitter["removeAllListeners"]>) {
        if (this == null || typeof this !== "object") {
            return eventEmitterPrototype;
        }

        return originalRemoveAllListeners.apply(this, args);
    };

    eventEmitterPrototype.__bunRemoveAllPatched = true;
};

const patchMineflayerPvpForBun = () => {
    const pvpPrototype = (minecraftPvp as unknown as { PVP?: { prototype: Record<string, unknown> } }).PVP?.prototype;

    if (!pvpPrototype || (pvpPrototype as { __bunPatched?: boolean }).__bunPatched) {
        return;
    }

    const originalStop = pvpPrototype.stop as (...args: unknown[]) => Promise<unknown>;

    if (typeof originalStop !== "function") {
        return;
    }

    pvpPrototype.stop = async function patchedStop(this: { bot?: Bot }, ...args: unknown[]) {
        try {
            return await originalStop.apply(this, args);
        } catch (error) {
            const errorMessage = String(error ?? "");

            if (
                error instanceof TypeError &&
                errorMessage.includes("this._events") &&
                this?.bot
            ) {
                const removeAll = EventEmitter.prototype.removeAllListeners;

                if (typeof removeAll === "function") {
                    try {
                        removeAll.call(this.bot, "path_stop");
                    } catch {
                        this.bot.removeAllListeners?.call?.(this.bot, "path_stop");
                    }
                }

                this.bot.pathfinder?.setGoal?.(null);
                this.bot.emit?.("stoppedAttacking" as unknown as Parameters<Bot["emit"]>[0]);

                return;
            }

            throw error;
        }
    };

    (pvpPrototype as { __bunPatched?: boolean }).__bunPatched = true;
};

patchEventEmitterForBun();
patchMineflayerPvpForBun();

const BASE_RECONNECT_DELAY_MS = 1_000;
const MAX_RECONNECT_DELAY_MS = 30_000;

// Map to store viewers by username
export const viewerMap = new Map<string, { updateHeldItem?: (entityId: number, item: unknown) => void }>();

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
    let viewerServer: { close: () => void } | null = null;

    const {
        viewerPort,
        ...botCreationOptions
    } = options;

    const cleanupViewer = () => {
        if (viewerServer) {
            try {
                // Remove error listeners before closing to prevent unhandled errors
                if (viewerServer instanceof EventEmitter) {
                    viewerServer.removeAllListeners('error');
                }

                // Close the server
                if (typeof viewerServer.close === 'function') {
                    try {
                        viewerServer.close();
                    } catch (closeError) {
                        // Ignore close errors
                    }
                }
            } catch (error) {
                console.warn("[BotManager] Error closing viewer server:", error);
            }
            viewerServer = null;
        }

        // Remove viewer from map when cleaning up
        const username = botCreationOptions.username as string | undefined;
        if (username) {
            viewerMap.delete(username);
        }
    };

    const scheduleReconnect = (reason: string, error?: unknown) => {
        if (stopped) {
            return;
        }

        if (reconnectTimeout) {
            return;
        }

        // Clean up the old viewer before reconnecting
        cleanupViewer();

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

    const cleanupBot = (bot: Bot | undefined) => {
        if (!bot) return;

        try {
            // Clean up stuck check if it exists
            if ((bot as any).__cleanupStuckCheck && typeof (bot as any).__cleanupStuckCheck === 'function') {
                try {
                    (bot as any).__cleanupStuckCheck();
                } catch (error) {
                    // Ignore cleanup errors
                }
            }

            // Remove all event listeners to prevent memory leaks
            bot.removeAllListeners();

            // Clean up pathfinder
            if (bot.pathfinder) {
                bot.pathfinder.setGoal(null);
                if (typeof (bot.pathfinder as any).stop === 'function') {
                    (bot.pathfinder as any).stop();
                }
            }

            // Clean up PVP
            if ((bot as any).pvp && typeof (bot as any).pvp.stop === 'function') {
                try {
                    (bot as any).pvp.stop();
                } catch (error) {
                    // Ignore errors during cleanup
                }
            }

            // Clean up collectblock
            if ((bot as any).collectBlock && typeof (bot as any).collectBlock.stop === 'function') {
                try {
                    (bot as any).collectBlock.stop();
                } catch (error) {
                    // Ignore errors during cleanup
                }
            }
        } catch (error) {
            console.warn("[BotManager] Error during bot cleanup:", error);
        }
    };

    const attachLifecycleHandlers = (bot: Bot) => {
        bot.once("spawn", () => {
            reconnectAttempts = 0;

            // Clean up any existing viewer before creating a new one
            cleanupViewer();

            // Wait a bit for the port to be released before creating a new viewer
            setTimeout(() => {
                try {
                    const server = mineflayerViewer.mineflayer(bot, {
                        port: viewerPort,
                        firstPerson: true,
                    });
                    viewerServer = server as { close: () => void };

                    // Handle error events on the server to prevent crashes
                    if (server instanceof EventEmitter) {
                        server.on('error', (error: Error) => {
                            if (error.message.includes('EADDRINUSE')) {
                                console.warn(
                                    `[BotManager] Port ${viewerPort} is already in use. Viewer may not be available for this bot instance.`,
                                );
                            } else {
                                console.error("[BotManager] Viewer server error:", error);
                            }
                        });
                    }

                    // Store the viewer in the map by username
                    const username = botCreationOptions.username as string | undefined;
                    if (username) {
                        const viewer = (bot as { viewer?: { updateHeldItem?: (entityId: number, item: unknown) => void } }).viewer;
                        if (viewer) {
                            viewerMap.set(username, viewer);
                        }
                    }
                } catch (viewerError) {
                    // Handle port conflicts gracefully
                    if (viewerError instanceof Error && viewerError.message.includes('EADDRINUSE')) {
                        console.warn(
                            `[BotManager] Port ${viewerPort} is already in use. Viewer may not be available for this bot instance.`,
                        );
                    } else {
                        console.error("[BotManager] Failed to initialize viewer:", viewerError);
                    }
                }
            }, 100); // Small delay to ensure port is released
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

        // Clean up the old bot instance before creating a new one
        if (activeBot) {
            cleanupBot(activeBot);
            try {
                activeBot.end();
            } catch (error) {
                // Bot may already be ended
            }
        }

        // Clean up the old bot's viewer if it exists
        cleanupViewer();

        const bot = createBot(botCreationOptions as BotOptions);
        bot.loadPlugin(mineflayerCollectblock.plugin);
        bot.loadPlugin(mineflayerPathfinder.pathfinder);
        // @ts-ignore
        bot.loadPlugin((minecraftHawkEyeModule.default as { default: (bot: Bot) => void }).default);
        bot.loadPlugin(minecraftPvp.plugin);
        bot.loadPlugin(tool.plugin);

        // Configure pathfinder to handle falling better
        if (bot.pathfinder) {
            const pathfinder = bot.pathfinder as any;
            // Increase timeout for pathfinding operations
            if (pathfinder.setDefaultPathfindingTimeout) {
                pathfinder.setDefaultPathfindingTimeout(30000); // 30 seconds
            }
            // Allow pathfinding while falling
            if (pathfinder.setAllowFalling) {
                pathfinder.setAllowFalling(true);
            }
        }

        // Monitor bot position and cancel pathfinding if stuck or floating
        // Use primitive values instead of objects to reduce memory allocation
        let lastX = 0;
        let lastY = 0;
        let lastZ = 0;
        let lastTimestamp = 0;
        let stuckCheckInterval: NodeJS.Timeout | null = null;
        let floatingStartTime: number | null = null;

        const checkStuck = () => {
            if (!bot.entity || !bot.entity.position) return;

            const currentPos = bot.entity.position;
            const onGround = bot.entity.onGround;
            const now = Date.now();

            if (lastTimestamp > 0) {
                const verticalChange = Math.abs(currentPos.y - lastY);
                const horizontalChange = Math.sqrt(
                    Math.pow(currentPos.x - lastX, 2) +
                    Math.pow(currentPos.z - lastZ, 2)
                );

                // Check if bot is floating (not on ground, not falling, not moving)
                if (!onGround && verticalChange < 0.05 && horizontalChange < 0.05) {
                    // Bot appears to be floating
                    if (floatingStartTime === null) {
                        floatingStartTime = now;
                    } else if (now - floatingStartTime > 2000) {
                        // Floating for more than 2 seconds - cancel pathfinding
                        if (bot.pathfinder) {
                            bot.pathfinder.setGoal(null);
                            console.warn("[BotManager] Bot floating/stuck detected, cancelled pathfinding to prevent timeout");
                        }
                        floatingStartTime = null; // Reset after action
                    }
                } else {
                    // Bot is moving or on ground - reset floating timer
                    floatingStartTime = null;
                }
            }

            // Update position using primitives (no object allocation)
            lastX = currentPos.x;
            lastY = currentPos.y;
            lastZ = currentPos.z;
            lastTimestamp = now;
        };

        // Start monitoring after spawn
        bot.once("spawn", () => {
            lastX = bot.entity.position.x;
            lastY = bot.entity.position.y;
            lastZ = bot.entity.position.z;
            lastTimestamp = Date.now();

            // Check every 2 seconds if bot is stuck (less frequent to reduce memory pressure)
            stuckCheckInterval = setInterval(checkStuck, 2000);
        });

        // Clean up interval on disconnect
        const cleanupStuckCheck = () => {
            if (stuckCheckInterval) {
                clearInterval(stuckCheckInterval);
                stuckCheckInterval = null;
            }
            lastX = 0;
            lastY = 0;
            lastZ = 0;
            lastTimestamp = 0;
            floatingStartTime = null;
        };

        bot.on("end", cleanupStuckCheck);

        // Store cleanup function to be called when bot is cleaned up
        (bot as any).__cleanupStuckCheck = cleanupStuckCheck;

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

        // Clean up the viewer server
        cleanupViewer();

        if (activeBot) {
            try {
                // Clean up bot resources before quitting
                cleanupBot(activeBot);
                await activeBot.quit();
            } catch (error) {
                console.error("[BotManager] Error while stopping bot:", error);
            }
        }
    };

    createBotInstance();

    return { getBot, stop };
};

