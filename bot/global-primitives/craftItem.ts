import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";
import { craftHelper } from "./craftHelper";
import * as mineflayerPathfinder from "mineflayer-pathfinder";

const {
    goals: { GoalLookAtBlock },
} = mineflayerPathfinder;

const mcData = mcDataImport("1.21.8");

let _craftItemFailCount = 0;

export const craftItem = async (bot: Bot, name: string, count = 1) => {
    const output: string[] = [];

    // return if name is not string
    if (typeof name !== "string") {
        throw new Error("name for craftItem must be a string");
    }
    // return if count is not number
    if (typeof count !== "number") {
        throw new Error("count for craftItem must be a number");
    }
    const itemByName = mcData.itemsByName[name];
    if (!itemByName) {
        throw new Error(`No item named ${name}`);
    }
    const craftingTable = bot.findBlock({
        matching: mcData.blocksByName.crafting_table.id,
        maxDistance: 32,
    });
    if (!craftingTable) {
        output.push("Craft without a crafting table");
    } else {
        await bot.pathfinder.goto(
            new GoalLookAtBlock(craftingTable.position, bot.world)
        );
    }
    const recipe = bot.recipesFor(itemByName.id, null, 1, craftingTable)[0];
    if (recipe) {
        output.push(`I can make ${name}`);
        try {
            await bot.craft(recipe, count, craftingTable ?? undefined);
            output.push(`I did the recipe for ${name} ${count} times`);
        } catch (err) {
            output.push(`I cannot do the recipe for ${name} ${count} times`);
        }
    } else {
        const helperOutput = craftHelper(bot, name, itemByName, craftingTable as any);
        output.push(...helperOutput);
        _craftItemFailCount++;
        if (_craftItemFailCount > 10) {
            throw new Error(
                "craftItem failed too many times, check chat log to see what happened"
            );
        }
    }

    return output;
}