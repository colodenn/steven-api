import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";
import type { Entity } from "prismarine-entity";
import { waitForMobShot } from "./waitForMobRemoved";

const mcData = mcDataImport("1.19");

const VALID_WEAPONS = new Set([
    "bow",
    "crossbow",
    "snowball",
    "ender_pearl",
    "egg",
    "splash_potion",
    "lingering_potion",
    "trident",
]);

export async function shoot(
    bot: Bot,
    weapon: string,
    targetName: string,
    timeoutSeconds = 300
) {
    const output: string[] = [];
    if (typeof weapon !== "string") {
        output.push("weapon for shoot must be a string");
        return { success: false, output };
    }
    if (typeof targetName !== "string") {
        output.push("target for shoot must be a string");
        return { success: false, output };
    }

    if (!VALID_WEAPONS.has(weapon)) {
        const message = `${weapon} is not a valid weapon for shooting`;
        bot.chat(message);
        output.push(message);
        return { success: false, output };
    }

    const weaponItem = mcData.itemsByName[weapon];
    if (!weaponItem) {
        output.push(`No item named ${weapon}`);
        return { success: false, output };
    }

    if (!bot.inventory.findInventoryItem(weaponItem.id, null, false)) {
        const message = `No ${weapon} in inventory for shooting`;
        bot.chat(message);
        output.push(message);
        return { success: false, output };
    }

    const targetEntity = bot.nearestEntity(
        (entity) =>
            entity.name === targetName &&
            entity.position.distanceTo(bot.entity.position) <= 64
    );

    if (!targetEntity) {
        const message = `No ${targetName} nearby`;
        bot.chat(message);
        output.push(message);
        return { success: false, output };
    }

    const hawkEye = (bot as any).hawkEye;
    if (!hawkEye?.autoAttack) {
        output.push("hawkEye plugin is required for shoot primitive");
        return { success: false, output };
    }

    hawkEye.autoAttack(targetEntity as Entity, weapon);
    const result = await waitForMobShot(bot, targetEntity, timeoutSeconds);

    if (!result.success) {
        output.push(...result.output);
        return { success: false, output };
    }

    output.push(`Successfully shot ${targetName}`);
    return { success: true, output };
}