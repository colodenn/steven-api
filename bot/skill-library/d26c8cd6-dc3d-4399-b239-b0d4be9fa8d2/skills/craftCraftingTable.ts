import { craftItem } from "../primitives/craftItem";
import { craftPlanks } from "../skills/craftPlanks";
import type { Bot } from "mineflayer";

export async function craftCraftingTable(bot: Bot) {
  const output: string[] = [];

  // Check if we have planks
  const planks = bot.inventory.items().filter(item => item.name.endsWith('_planks'));

  if (planks.length < 4) {
    output.push("Not enough planks in inventory. Crafting planks first.");
    await craftPlanks(bot);
  }

  // Re-check planks
  const updatedPlanks = bot.inventory.items().filter(item => item.name.endsWith('_planks'));
  if (updatedPlanks.length < 4) {
    output.push("Still not enough planks.");
    return output;
  }

  await craftItem(bot, "crafting_table", 1);
  output.push("Crafting table crafted.");
  bot.chat("Crafting table crafted.");
  return output;
}