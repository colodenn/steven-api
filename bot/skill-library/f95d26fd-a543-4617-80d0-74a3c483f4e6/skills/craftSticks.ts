import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftSticks(bot: Bot) {
  const { output, success } = await craftItem(bot, "stick", 4);
  if (!success) {
    bot.chat("Failed to craft sticks");
    return { output, success: false };
  }
  bot.chat("Crafted sticks");
  return { output, success: true };
}