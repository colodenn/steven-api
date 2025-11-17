import type { Bot } from "mineflayer";
import type { Entity } from "prismarine-entity";
import mcDataImport from "minecraft-data";
import { readdir, readFile, writeFile } from "node:fs/promises";
import {
  getGlobalPrimitivesPath,
  getGlobalPrimitiveFilePath,
  getPrimitiveFilePath
} from "./constants";

const minecraftVersion = "1.19";
export const mcData = mcDataImport(minecraftVersion);

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
  const botPosition = bot.entity.position;

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
    isDay: bot.time.isDay,
    timeOfDay: (() => {
      const time = bot.time.time % 24000;
      if (time >= 0 && time < 3000) return "sunrise";
      if (time >= 3000 && time < 9000) return "noon";
      if (time >= 9000 && time < 15000) return "sunset";
      return "midnight";
    })(),
    nearbyEntities: Object.values(bot.entities)
      .filter((entity) => entity.id !== bot.entity.id)
      .filter((entity) => {
        if (!entity.position) return false;
        const dx = entity.position.x - botPosition.x;
        const dy = entity.position.y - botPosition.y;
        const dz = entity.position.z - botPosition.z;
        const distanceSquared = dx * dx + dy * dy + dz * dz;
        return distanceSquared <= 12 * 12;
      })
      .map((entity) => summarizeEntity(entity)),
    hunger: bot.food,
    oxygen: bot.oxygenLevel,
    nearbyBlocks: {
      chests: mcData?.blocksByName?.chest ? bot.findBlocks({
        matching: [mcData.blocksByName.chest.id],
        maxDistance: 16,
        count: 100,
      }).length : 0,
      craftingTables: mcData?.blocksByName?.crafting_table ? bot.findBlocks({
        matching: [mcData.blocksByName.crafting_table.id],
        maxDistance: 16,
        count: 100,
      }).length : 0,
      furnaces: mcData?.blocksByName?.furnace ? bot.findBlocks({
        matching: [mcData.blocksByName.furnace.id],
        maxDistance: 16,
        count: 100,
      }).length : 0,
      surroundingBlocks: getSurroundingBlocks(bot, 16, 16, 16),
    },
  };
}

type EntitySummary = {
  id: number;
  type: Entity["type"];
  kind?: Entity["kind"];
  mobType?: Entity["mobType"];
  name?: string;
  position?: { x: number; y: number; z: number };
  health?: number;
  isValid: boolean;
};

const summarizeEntity = (entity: Entity): EntitySummary => {
  const name = entity.displayName ?? entity.username ?? entity.name;
  const summary: EntitySummary = {
    id: entity.id,
    type: entity.type,
    isValid: entity.isValid,
  };

  if (entity.kind) summary.kind = entity.kind;
  if (name) summary.name = name;
  if (typeof entity.health === "number") summary.health = entity.health;
  if (entity.position) {
    summary.position = {
      x: Number(entity.position.x.toFixed(2)),
      y: Number(entity.position.y.toFixed(2)),
      z: Number(entity.position.z.toFixed(2)),
    };
  }

  return summary;
};

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