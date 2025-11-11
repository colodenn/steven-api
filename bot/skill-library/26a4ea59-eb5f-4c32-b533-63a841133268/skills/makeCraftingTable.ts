import { craftItem } from "../primitives/craftItem";
import { placeItem } from "../primitives/placeItem";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function makeCraftingTable(bot: Bot) {
  const output: string[] = [];

  // First, craft planks from logs
  // Assume we have jungle logs
  const logName = "jungle_log";
  const plankName = "jungle_planks";

  // Check if we have logs
  const logs = bot.inventory.items().find(item => item.name === logName);
  if (!logs || logs.count < 1) {
    output.push("Not enough logs to craft planks.");
    bot.chat("Not enough logs to craft planks.");
    return output;
  }

  // Craft planks: 1 log -> 4 planks
  await craftItem(bot, plankName, 4, null, logs);

  output.push("Crafted planks.");

  // Now craft crafting table: 4 planks
  const planks = bot.inventory.items().find(item => item.name === plankName);
  if (!planks || planks.count < 4) {
    output.push("Not enough planks to craft crafting table.");
    bot.chat("Not enough planks to craft crafting table.");
    return output;
  }

  await craftItem(bot, "crafting_table", 1, null, planks);

  output.push("Crafted crafting table.");

  // Place the crafting table
  const craftingTable = bot.inventory.items().find(item => item.name === "crafting_table");
  if (craftingTable) {
    const position = bot.entity.position.floored().offset(1, -1, 0); // place beside, on ground
    await placeItem(bot, "crafting_table", position);
    output.push("Placed crafting table.");
    bot.chat("Placed crafting table.");
  } else {
    output.push("Failed to find crafting table in inventory.");
  }

  return output;
}