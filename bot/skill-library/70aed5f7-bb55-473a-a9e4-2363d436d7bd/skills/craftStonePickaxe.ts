import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftStonePickaxe(bot: Bot) {
  const output: string[] = [];
  const { output: craftOutput, success } = await craftItem(bot, "stone_pickaxe", 1);
  if (!success) {
    output.push("Failed to craft stone pickaxe.");
    bot.chat("Failed to craft stone pickaxe.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Stone pickaxe crafted.");
  bot.chat("Stone pickaxe crafted.");
  return { output, success: true };
}