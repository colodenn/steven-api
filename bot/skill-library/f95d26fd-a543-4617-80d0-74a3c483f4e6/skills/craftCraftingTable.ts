import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftCraftingTable(bot: Bot) {
  const { output, success } = await craftItem(bot, "crafting_table", 1);
  if (!success) {
    bot.chat("Failed to craft crafting table");
    return { output, success: false };
  }
  bot.chat("Crafted crafting table");
  return { output, success: true };
}