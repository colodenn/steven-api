import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";
import { craftHelper } from "./craftHelper";
import mineflayerPathfinder from "mineflayer-pathfinder";

const {
    goals: { GoalLookAtBlock },
} = mineflayerPathfinder;

const mcData = mcDataImport("1.19");

// Craft 8 oak_planks from 2 oak_log (do the recipe 2 times): craftItem(bot, "oak_planks", 2);
// You must place a crafting table before calling this function
export const craftItem = async (bot: Bot, name: string, count = 1) => {
    let _craftItemFailCount = 0;
    const output: string[] = [];

    // return if name is not string
    if (typeof name !== "string") {
        output.push("name for craftItem must be a string");
        return { success: false, output };
    }
    // return if count is not number
    if (typeof count !== "number") {
        output.push("count for craftItem must be a number");
        return { success: false, output };
    }
    const itemByName = mcData.itemsByName[name];
    if (!itemByName) {
        output.push(`No item named ${name}`);
        return { success: false, output };
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
            return { output, success: true };
        } catch (err) {
            output.push(`I cannot do the recipe for ${name} ${count} times`);
            return { output, success: false };
        }
    } else {
        const helperOutput = craftHelper(bot, name, itemByName, craftingTable as any);
        output.push(...helperOutput);
        _craftItemFailCount++;
        if (_craftItemFailCount > 10) {
            output.push(
                "craftItem failed too many times, check chat log to see what happened"
            );
        }
        return { success: false, output };
    }
}