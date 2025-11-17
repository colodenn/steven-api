import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";
import { Vec3 } from "vec3";
import mineflayerPathfinder from "mineflayer-pathfinder";

const {
    goals: { GoalPlaceBlock },
} = mineflayerPathfinder;
const mcData = mcDataImport("1.19");

// Minecraft 1.19 valid y coordinate range
const MIN_Y = -64;
const MAX_Y = 320;

let _placeItemFailCount = 0;

// Place a crafting_table near the player, Vec3(1, 0, 0) is just an example, you shouldn't always use that: placeItem(bot, "crafting_table", bot.entity.position.offset(1, 0, 0));
export const placeItem = async (bot: Bot, name: string, position: Vec3) => {
    const output: string[] = [];

    // return if name is not string
    if (typeof name !== "string") {
        output.push(`name for placeItem must be a string`);
        return { success: false, output };
    }
    // return if position is not Vec3
    if (!(position instanceof Vec3)) {
        output.push(`position for placeItem must be a Vec3`);
        return { success: false, output };
    }
    const itemByName = mcData.itemsByName[name];
    if (!itemByName) {
        output.push(`No item named ${name}`);
        return { success: false, output };
    }
    const item = bot.inventory.findInventoryItem(itemByName.id, null, true);
    if (!item) {
        output.push(`No ${name} in inventory`);
        return { success: false, output };
    }
    const item_count = item.count;
    // find a reference block
    const faceVectors = [
        new Vec3(0, 1, 0),
        new Vec3(0, -1, 0),
        new Vec3(1, 0, 0),
        new Vec3(-1, 0, 0),
        new Vec3(0, 0, 1),
        new Vec3(0, 0, -1),
    ];
    let referenceBlock = null;
    let faceVector = null;
    for (const vector of faceVectors) {
        const block = bot.blockAt(position.minus(vector));
        if (block?.name !== "air") {
            referenceBlock = block;
            faceVector = vector;
            output.push(`Placing ${name} on ${block?.name} at ${block?.position}`);
            break;
        }
    }
    if (!referenceBlock) {
        output.push(
            `No block to place ${name} on. You cannot place a floating block.`
        );
        _placeItemFailCount++;
        if (_placeItemFailCount > 10) {
            output.push(
                `placeItem failed too many times. You cannot place a floating block.`
            );
            return { success: false, output };
        }
        return { output, success: false };
    }

    // Validate y coordinate is within valid Minecraft bounds
    if (position.y < MIN_Y || position.y > MAX_Y) {
        output.push(
            `Invalid y coordinate ${position.y}. Must be between ${MIN_Y} and ${MAX_Y}.`
        );
        return { output, success: false };
    }

    // You must use try catch to placeBlock
    try {
        // You must first go to the block position you want to place
        await bot.pathfinder.goto(new GoalPlaceBlock(position, bot.world, {} as any));
        // You must equip the item right before calling placeBlock
        await bot.equip(item, "hand");
        await bot.placeBlock(referenceBlock, faceVector as Vec3);
        output.push(`Placed ${name}`);
        return { output, success: true };
    } catch (err) {
        const item = bot.inventory.findInventoryItem(itemByName.id, null, true);
        const error = err as Error;
        if (item?.count === item_count) {
            output.push(
                `Error placing ${name}: ${error.message}, please find another position to place`
            );
            _placeItemFailCount++;
            if (_placeItemFailCount > 10) {
                output.push(
                    `placeItem failed too many times, please find another position to place.`
                );
                return { success: false, output };
            }
        } else {
            output.push(`Placed ${name}`);
            return { output, success: true };
        }
    }
    return { output, success: false };
}