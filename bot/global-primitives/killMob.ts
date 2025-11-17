import type { Bot } from "mineflayer";
import type { Entity } from "prismarine-entity";
import type { Vec3 } from "vec3";
import { waitForMobRemoved, waitForMobShot } from "./waitForMobRemoved";

type ItemEntity = Entity & { position: Vec3 };

const RANGED_WEAPONS = new Set([
    "bow",
    "crossbow",
    "snowball",
    "ender_pearl",
    "egg",
    "splash_potion",
    "lingering_potion",
    "trident",
]);

let killMobFailCount = 0;

// Kill a pig and collect the dropped item: killMob(bot, "pig", 300);
export async function killMob(
    bot: Bot,
    mobName: string,
    timeoutSeconds = 300
) {
    const output: string[] = [];
    if (typeof mobName !== "string") {
        output.push(`mobName for killMob must be a string`);
        return { success: false, output };
    }
    if (typeof timeoutSeconds !== "number") {
        output.push(`timeout for killMob must be a number`);
        return { success: false, output };
    }

    const handSlot = bot.getEquipmentDestSlot("hand");
    const mainHandItem = handSlot != null ? bot.inventory.slots[handSlot] : null;

    const targetEntity = bot.nearestEntity(
        (entity: Entity) =>
            entity.name === mobName &&
            entity.position.distanceTo(bot.entity.position) < 48
    );

    if (!targetEntity) {
        const message = `No ${mobName} nearby, please explore first`;
        bot.chat(message);
        output.push(message);
        killMobFailCount++;
        if (killMobFailCount > 10) {
            const errorMessage = "killMob failed too many times, make sure you explore before calling killMob";
            output.push(errorMessage);
            return { success: false, output };
        }
        return { success: false, output };
    }

    const killResult =
        mainHandItem && mainHandItem.name && RANGED_WEAPONS.has(mainHandItem.name)
            ? await executeRangedKill(bot, targetEntity, mainHandItem.name, timeoutSeconds)
            : await executeMeleeKill(bot, targetEntity, timeoutSeconds);

    if (!killResult.success) {
        output.push(...killResult.output);
        return { success: false, output };
    }

    killMobFailCount = 0;

    const droppedItem = killResult.item;
    if (droppedItem) {
        const collectBlock = (bot as any).collectBlock;
        if (collectBlock?.collect) {
            await collectBlock.collect(droppedItem, { ignoreNoPath: true });
        }
        output.push(`Successfully killed ${mobName}`);
    } else {
        output.push(`Killed ${mobName} but no item dropped`);
    }

    return { success: true, output };
}

async function executeRangedKill(
    bot: Bot,
    entity: Entity,
    weaponName: string,
    timeoutSeconds: number
): Promise<{ success: boolean; output: string[]; item?: ItemEntity | null }> {
    const hawkEye = (bot as any).hawkEye;
    if (!hawkEye?.autoAttack) {
        return { success: false, output: ["hawkEye plugin is required for ranged kill"] };
    }

    hawkEye.autoAttack(entity, weaponName);
    return waitForMobShot(bot, entity, timeoutSeconds);
}

async function executeMeleeKill(
    bot: Bot,
    entity: Entity,
    timeoutSeconds: number
): Promise<{ success: boolean; output: string[]; item?: ItemEntity | null }> {
    const pvp = (bot as any).pvp;
    if (!pvp?.attack) {
        return { success: false, output: ["pvp plugin is required for melee kill"] };
    }

    await pvp.attack(entity);
    return waitForMobRemoved(bot, entity, timeoutSeconds);
}