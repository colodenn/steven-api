import { craftItem } from "../primitives/craftItem";
import { placeItem } from "../primitives/placeItem";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function craftWoodenTools(bot: Bot) {
  const output: string[] = [];

  // Craft planks from logs (assuming we have logs)
  await craftItem(bot, "oak_planks", 4); // Assuming oak, but we mined various
  output.push("Planks crafted.");
  bot.chat("Planks crafted.");

  // Craft sticks
  await craftItem(bot, "stick", 4);
  output.push("Sticks crafted.");
  bot.chat("Sticks crafted.");

  // Craft crafting table
  await craftItem(bot, "crafting_table", 1);
  output.push("Crafting table crafted.");
  bot.chat("Crafting table crafted.");

  // Find a position to place the crafting table (on the ground)
  const pos = bot.entity.position.floored().offset(0, -1, 0);
  await placeItem(bot, "crafting_table", pos);
  output.push("Crafting table placed.");
  bot.chat("Crafting table placed.");

  // Craft wooden pickaxe
  await craftItem(bot, "wooden_pickaxe", 1);
  output.push("Wooden pickaxe crafted.");
  bot.chat("Wooden pickaxe crafted.");

  return output;
}