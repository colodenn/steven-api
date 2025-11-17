import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftPickaxe(bot: Bot) {
  const output: string[] = [];
  const { output: craftOutput, success } = await craftItem(bot, "wooden_pickaxe", 1);
  if (!success) {
    output.push("Failed to craft pickaxe.");
    bot.chat("Failed to craft pickaxe.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Pickaxe crafted.");
  bot.chat("Pickaxe crafted.");
  return { output, success: true };
}