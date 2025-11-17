import { smeltItem } from "../../../global-primitives/smeltItem";
import type { Bot } from "mineflayer";

export async function smeltOneIron(bot: Bot) {
  const output: string[] = [];

  const { output: smeltOutput, success } = await smeltItem(bot, "raw_iron", "coal", 1);

  if (!success) {
    output.push("Failed to smelt one iron.");
    bot.chat("Failed to smelt one iron.");
    return { output, success: false };
  }
  output.push(...smeltOutput);
  output.push("One iron smelted.");
  bot.chat("One iron smelted.");
  return { output, success: true };
}