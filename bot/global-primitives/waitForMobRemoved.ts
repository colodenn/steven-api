import type { Bot } from "mineflayer";
import type { Entity } from "prismarine-entity";
import type { Vec3 } from "vec3";

type ItemEntity = Entity & { position: Vec3 };

export function waitForMobRemoved(
    bot: Bot,
    entity: Entity,
    timeoutSeconds = 300
) {
    if (!entity) {
        return Promise.resolve({ success: false, output: ["waitForMobRemoved requires a valid entity"] });
    }

    return new Promise<{ success: boolean; output: string[]; item?: ItemEntity | null }>((resolve) => {
        let droppedItem: ItemEntity | null = null;
        let success = false;
        let resolved = false;

        const timeoutId = setTimeout(() => {
            if (resolved) return;
            resolved = true;
            success = false;
            safeStopCombat(bot);
            cleanup();
            resolve({ success: false, output: [`Failed to kill ${entity.name} within timeout.`] });
        }, timeoutSeconds * 1000);

        const onEntityGone = (removed: Entity) => {
            if (removed.id !== entity.id) return;
            if (resolved) return;
            success = true;
            safeStopCombat(bot);
            bot.chat(`Killed ${entity.name}!`);
        };

        const onItemDrop = (item: ItemEntity) => {
            if (entity.position.distanceTo(item.position) <= 1) {
                droppedItem = item;
            }
        };

        const onStoppedAttacking = () => {
            if (resolved) return;
            resolved = true;
            cleanup();
            if (!success) {
                resolve({ success: false, output: [`Failed to kill ${entity.name}.`] });
            } else {
                resolve({ success: true, output: [], item: droppedItem });
            }
        };

        const cleanup = () => {
            clearTimeout(timeoutId);
            const botAny = bot as any;
            try {
                botAny.removeListener("entityGone", onEntityGone);
                botAny.removeListener("stoppedAttacking", onStoppedAttacking);
                botAny.removeListener("itemDrop", onItemDrop);
            } catch (error) {
                // Ignore cleanup errors
            }
        };

        const botAny = bot as any;
        try {
            botAny.on("entityGone", onEntityGone);
            botAny.on("stoppedAttacking", onStoppedAttacking);
            botAny.on("itemDrop", onItemDrop);
        } catch (error) {
            cleanup();
            resolve({ success: false, output: [`Error setting up listeners: ${error}`] });
        }
    });
}

export function waitForMobShot(
    bot: Bot,
    entity: Entity,
    timeoutSeconds = 300
) {
    if (!entity) {
        return Promise.resolve({ success: false, output: ["waitForMobShot requires a valid entity"] });
    }

    return new Promise<{ success: boolean; output: string[]; item?: ItemEntity | null }>((resolve) => {
        let droppedItem: ItemEntity | null = null;
        let success = false;
        let resolved = false;

        const timeoutId = setTimeout(() => {
            if (resolved) return;
            resolved = true;
            success = false;
            safeStopRanged(bot);
            cleanup();
            resolve({ success: false, output: [`Failed to shoot ${entity.name} within timeout.`] });
        }, timeoutSeconds * 1000);

        const onEntityGone = (removed: Entity) => {
            if (removed.id !== entity.id) return;
            if (resolved) return;
            success = true;
            safeStopRanged(bot);
            bot.chat(`Shot ${entity.name}!`);
        };

        const onItemDrop = (item: ItemEntity) => {
            if (entity.position.distanceTo(item.position) <= 1) {
                droppedItem = item;
            }
        };

        const onAutoShotStopped = () => {
            if (resolved) return;
            resolved = true;
            cleanup();
            if (!success) {
                resolve({ success: false, output: [`Failed to shoot ${entity.name}.`] });
            } else {
                resolve({ success: true, output: [], item: droppedItem });
            }
        };

        const cleanup = () => {
            clearTimeout(timeoutId);
            const botAny = bot as any;
            try {
                botAny.removeListener("entityGone", onEntityGone);
                botAny.removeListener("auto_shot_stopped", onAutoShotStopped);
                botAny.removeListener("itemDrop", onItemDrop);
            } catch (error) {
                // Ignore cleanup errors
            }
        };

        const botAny = bot as any;
        try {
            botAny.on("entityGone", onEntityGone);
            botAny.on("auto_shot_stopped", onAutoShotStopped);
            botAny.on("itemDrop", onItemDrop);
        } catch (error) {
            cleanup();
            resolve({ success: false, output: [`Error setting up listeners: ${error}`] });
        }
    });
}

function safeStopCombat(bot: Bot) {
    const pvp = (bot as any).pvp;
    if (pvp?.stop) pvp.stop();
}

function safeStopRanged(bot: Bot) {
    const hawkEye = (bot as any).hawkEye;
    if (hawkEye?.stop) hawkEye.stop();
}