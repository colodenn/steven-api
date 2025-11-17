import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftPlanks(bot: Bot) {
  const { output, success } = await craftItem(bot, "oak_planks", 1);
  if (!success) {
    bot.chat("Failed to craft planks");
    return { output, success: false };
  }
  bot.chat("Crafted planks");
  return { output, success: true };
}