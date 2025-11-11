import type { Bot } from "mineflayer";
import mcDataImport from "minecraft-data";
import { readdir, readFile, writeFile } from "node:fs/promises";
import {
  getGlobalPrimitivesPath,
  getGlobalPrimitiveFilePath,
  getPrimitiveFilePath
} from "./constants";

export const mcData = mcDataImport(process.env.MINECRAFT_VERSION!);

/**
 * Get the surrounding blocks of the bot.
 * 
 * @param bot - The bot instance.
 * @param x_distance - The distance to search for blocks in the x direction.
 * @param y_distance - The distance to search for blocks in the y direction.
 * @param z_distance - The distance to search for blocks in the z direction.
 * 
 * @returns An array of block names.
 */
export const getSurroundingBlocks = (
  bot: Bot,
  x_distance: number,
  y_distance: number,
  z_distance: number,
) => {
  const surroundingBlocks = new Set<string>();
  const botPos = bot.entity.position;

  // Sample every 2 blocks instead of every block to reduce computation.
  const step = 2;

  for (let x = -x_distance; x <= x_distance; x += step) {
    for (let y = -y_distance; y <= y_distance; y += step) {
      for (let z = -z_distance; z <= z_distance; z += step) {
        try {
          const block = bot.blockAt(botPos.offset(x, y, z));
          if (block && block.type !== 0 && block.name !== "air") {
            surroundingBlocks.add(block.name);
          }
        } catch {
          // Skip blocks that are not loaded.
          continue;
        }
      }
    }
  }

  return Array.from(surroundingBlocks);
}

/**
 * Get the detailed status of the bot. Inventory, health, time, and nearby blocks.
 * 
 * @param bot - The bot instance.
 * 
 * @returns The detailed status of the bot.
 */
export const getDetailedStatus = (bot: Bot) => {
  return {
    inventory: bot.inventory.slots
      .map((slot) =>
        slot
          ? {
            count: slot.count,
            displayName: slot.displayName,
          }
          : null,
      )
      .filter((slot) => slot !== null),
    health: bot.health,
    time: bot.time.time,
    nearbyBlocks: {
      chests: bot.findBlocks({
        matching: [mcData.blocksByName.chest!.id],
        maxDistance: 16,
        count: 100,
      }).length,
      craftingTables: bot.findBlocks({
        matching: [mcData.blocksByName.crafting_table!.id],
        maxDistance: 16,
        count: 100,
      }).length,
      furnaces: bot.findBlocks({
        matching: [mcData.blocksByName.furnace!.id],
        maxDistance: 16,
        count: 100,
      }).length,
      surroundingBlocks: getSurroundingBlocks(bot, 16, 16, 16),
    },
  };
}

/**
 * Prefill the skill library with primitives.
 * 
 * @param botId - The ID of the bot.
 * 
 * @returns The result of the prefill.
 */
export const prefillWithPrimitives = async (botId: string) => {
  const primitives = await readdir(getGlobalPrimitivesPath())
  for (const primitive of primitives) {
    const primitiveCode = await readFile(getGlobalPrimitiveFilePath(primitive))
    await writeFile(getPrimitiveFilePath(botId, primitive).replace('.ts', ''), primitiveCode)
  }
  return primitives
}