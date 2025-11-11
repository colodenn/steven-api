import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";
import { goals } from "mineflayer-pathfinder";
import { Vec3 } from "vec3";

const mcData = mcDataImport("1.21.8");
const { GoalPlaceBlock } = goals;

let _placeItemFailCount = 0;

export const placeItem = async (bot: Bot, name: string, position: Vec3) => {
    const output: string[] = [];

    // return if name is not string
    if (typeof name !== "string") {
        throw new Error(`name for placeItem must be a string`);
    }
    // return if position is not Vec3
    if (!(position instanceof Vec3)) {
        throw new Error(`position for placeItem must be a Vec3`);
    }
    const itemByName = mcData.itemsByName[name];
    if (!itemByName) {
        throw new Error(`No item named ${name}`);
    }
    const item = bot.inventory.findInventoryItem(itemByName.id, null, true);
    if (!item) {
        output.push(`No ${name} in inventory`);
        return output;
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
            throw new Error(
                `placeItem failed too many times. You cannot place a floating block.`
            );
        }
        return output;
    }

    // You must use try catch to placeBlock
    try {
        // You must first go to the block position you want to place
        await bot.pathfinder.goto(new GoalPlaceBlock(position, bot.world, {} as any));
        // You must equip the item right before calling placeBlock
        await bot.equip(item, "hand");
        await bot.placeBlock(referenceBlock, faceVector as Vec3);
        output.push(`Placed ${name}`);
    } catch (err) {
        const item = bot.inventory.findInventoryItem(itemByName.id, null, true);
        const error = err as Error;
        if (item?.count === item_count) {
            output.push(
                `Error placing ${name}: ${error.message}, please find another position to place`
            );
            _placeItemFailCount++;
            if (_placeItemFailCount > 10) {
                throw new Error(
                    `placeItem failed too many times, please find another position to place.`
                );
            }
        } else {
            output.push(`Placed ${name}`);
        }
    }

    return output;
}