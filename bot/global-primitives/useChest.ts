import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";
import mineflayerPathfinder from "mineflayer-pathfinder";
import type { Block } from "prismarine-block";
import { Vec3 } from "vec3";

const mcData = mcDataImport("1.19");
const {
    goals: { GoalLookAtBlock },
} = mineflayerPathfinder;

type ItemCounts = Record<string, number>;
type ContainerWindow = Awaited<ReturnType<Bot["openContainer"]>>;

// Get a torch from chest at (30, 65, 100): getItemFromChest(bot, new Vec3(30, 65, 100), {"torch": 1});
// This function will work no matter how far the bot is from the chest.
export async function getItemFromChest(
    bot: Bot,
    chestPosition: Vec3,
    itemsToGet: ItemCounts
) {
    validateChestPosition(chestPosition, "getItemFromChest");
    const chestBlock = await moveToChest(bot, chestPosition);
    const chest = await bot.openContainer(chestBlock);

    for (const [name, requestedCount] of Object.entries(itemsToGet)) {
        if (!Number.isFinite(requestedCount) || requestedCount <= 0) continue;

        const itemByName = mcData.itemsByName[name];
        if (!itemByName) {
            bot.chat(`No item named ${name}`);
            continue;
        }

        const item = chest.findContainerItem(itemByName.id, null, false);
        if (!item) {
            bot.chat(`I don't see ${name} in this chest`);
            continue;
        }

        try {
            await chest.withdraw(item.type, null, requestedCount);
        } catch (error) {
            bot.chat(`Not enough ${name} in chest.`);
        }
    }

    await closeChest(bot, chest, chestBlock);
}

// Deposit a torch into chest at (30, 65, 100): depositItemIntoChest(bot, new Vec3(30, 65, 100), {"torch": 1});
// This function will work no matter how far the bot is from the chest.
export async function depositItemIntoChest(
    bot: Bot,
    chestPosition: Vec3,
    itemsToDeposit: ItemCounts
) {
    validateChestPosition(chestPosition, "depositItemIntoChest");
    const chestBlock = await moveToChest(bot, chestPosition);
    const chest = await bot.openContainer(chestBlock);

    for (const [name, requestedCount] of Object.entries(itemsToDeposit)) {
        if (!Number.isFinite(requestedCount) || requestedCount <= 0) continue;

        const itemByName = mcData.itemsByName[name];
        if (!itemByName) {
            bot.chat(`No item named ${name}`);
            continue;
        }

        const item = bot.inventory.findInventoryItem(itemByName.id, null, false);
        if (!item) {
            bot.chat(`No ${name} in inventory`);
            continue;
        }

        try {
            await chest.deposit(item.type, null, requestedCount);
        } catch (error) {
            bot.chat(`Not enough ${name} in inventory.`);
        }
    }

    await closeChest(bot, chest, chestBlock);
}

// Check the items inside the chest at (30, 65, 100): checkItemInsideChest(bot, new Vec3(30, 65, 100));
// You only need to call this function once without any action to finish task of checking items inside the chest.
export async function checkItemInsideChest(bot: Bot, chestPosition: Vec3) {
    validateChestPosition(chestPosition, "checkItemInsideChest");
    const chestBlock = await moveToChest(bot, chestPosition);
    const chest = await bot.openContainer(chestBlock);
    await closeChest(bot, chest, chestBlock);
}

async function moveToChest(bot: Bot, chestPosition: Vec3): Promise<Block> {
    validateChestPosition(chestPosition, "moveToChest");

    if (chestPosition.distanceTo(bot.entity.position) > 32) {
        bot.chat(
            `/tp ${chestPosition.x} ${chestPosition.y} ${chestPosition.z}`
        );
        await bot.waitForTicks(20);
    }

    const chestBlock = bot.blockAt(chestPosition);
    if (!chestBlock || chestBlock.name !== "chest") {
        emitBotEvent(bot, "removeChest", chestPosition);
        throw new Error(
            `No chest at ${String(chestPosition)}, it is ${chestBlock?.name ?? "unknown"
            }`
        );
    }

    await bot.pathfinder.goto(
        new GoalLookAtBlock(chestBlock.position, bot.world, {} as any)
    );
    return chestBlock;
}

async function listItemsInChest(
    bot: Bot,
    chest: ContainerWindow,
    chestBlock: Block
) {
    const items = chest.containerItems();

    if (items.length > 0) {
        const itemNames = items.reduce<Record<string, number>>(
            (acc, { name, count }) => {
                if (name) acc[name] = (acc[name] ?? 0) + count;
                return acc;
            },
            {}
        );
        emitBotEvent(bot, "closeChest", itemNames, chestBlock.position);
    } else {
        emitBotEvent(bot, "closeChest", {}, chestBlock.position);
    }
}

async function closeChest(
    bot: Bot,
    chest: ContainerWindow,
    chestBlock: Block
) {
    try {
        await listItemsInChest(bot, chest, chestBlock);
        await chest.close();
    } catch (error) {
        if (bot.currentWindow) {
            await bot.closeWindow(bot.currentWindow);
        }
    }
}

function validateChestPosition(chestPosition: Vec3, context: string) {
    if (!(chestPosition instanceof Vec3)) {
        throw new Error(`chestPosition for ${context} must be a Vec3`);
    }
}

function emitBotEvent(bot: Bot, event: string, ...args: unknown[]) {
    (bot as any).emit(event, ...args);
}