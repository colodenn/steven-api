import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftCraftingTable(bot: Bot) {
  const output: string[] = [];

  const { output: craftOutput, success } = await craftItem(bot, "crafting_table", 1);
  if (!success) {
    output.push(...craftOutput);
    output.push("Failed to craft crafting table.");
    bot.chat("Failed to craft crafting table.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Crafting table crafted.");
  bot.chat("Crafting table crafted.");
  return { output, success: true };
}