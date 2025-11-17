import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";
import mineflayerPathfinder from "mineflayer-pathfinder";

const mcData = mcDataImport("1.19");
const {
    goals: { GoalLookAtBlock },
} = mineflayerPathfinder;
let _smeltItemFailCount = 0;

// Smelt 1 raw_iron into 1 iron_ingot using 1 oak_planks as fuel: smeltItem(bot, "raw_iron", "oak_planks");
// You must place a furnace before calling this function
export async function smeltItem(
    bot: Bot,
    itemName: string,
    fuelName: string,
    count: number = 1
) {
    const output: string[] = [];
    // return if itemName or fuelName is not string
    if (typeof itemName !== "string" || typeof fuelName !== "string") {
        output.push("itemName or fuelName for smeltItem must be a string");
        return { success: false, output };
    }
    // return if count is not a number
    if (typeof count !== "number") {
        output.push("count for smeltItem must be a number");
        return { success: false, output };
    }
    const item = mcData.itemsByName[itemName];
    const fuel = mcData.itemsByName[fuelName];
    if (!item) {
        output.push(`No item named ${itemName}`);
        return { success: false, output };
    }
    if (!fuel) {
        output.push(`No item named ${fuelName}`);
        return { success: false, output };
    }
    const furnaceBlock = bot.findBlock({
        matching: mcData.blocksByName.furnace.id,
        maxDistance: 32,
    });
    if (!furnaceBlock) {
        output.push("No furnace nearby");
        return { success: false, output };
    } else {
        await bot.pathfinder.goto(
            new GoalLookAtBlock(furnaceBlock.position, bot.world)
        );
    }
    const furnace = await bot.openFurnace(furnaceBlock);
    let success_count = 0;
    for (let i = 0; i < count; i++) {
        if (!bot.inventory.findInventoryItem(item.id, null, false)) {
            const message = `No ${itemName} to smelt in inventory`;
            bot.chat(message);
            output.push(message);
            break;
        }
        if (furnace.fuel < 15 && furnace.fuelItem()?.name !== fuelName) {
            if (!bot.inventory.findInventoryItem(fuel.id, null, false)) {
                const message = `No ${fuelName} as fuel in inventory`;
                bot.chat(message);
                output.push(message);
                break;
            }
            await furnace.putFuel(fuel.id, null, 1);
            await bot.waitForTicks(20);
            if (!furnace.fuel && furnace.fuelItem()?.name !== fuelName) {
                output.push(`${fuelName} is not a valid fuel`);
                furnace.close();
                return { success: false, output };
            }
        }
        await furnace.putInput(item.id, null, 1);
        await bot.waitForTicks(12 * 20);
        if (!furnace.outputItem()) {
            output.push(`${itemName} is not a valid input`);
            furnace.close();
            return { success: false, output };
        }
        await furnace.takeOutput();
        success_count++;
    }
    furnace.close();
    if (success_count > 0) {
        const message = `Smelted ${success_count} ${itemName}.`;
        bot.chat(message);
        output.push(message);
        return { output, success: true };
    } else {
        const message = `Failed to smelt ${itemName}, please check the fuel and input.`;
        bot.chat(message);
        output.push(message);
        _smeltItemFailCount++;
        if (_smeltItemFailCount > 10) {
            output.push(
                `smeltItem failed too many times, please check the fuel and input.`
            );
            return { success: false, output };
        }
        return { output, success: false };
    }
}