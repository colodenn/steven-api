import { smeltItem } from "../../../global-primitives/smeltItem";
import type { Bot } from "mineflayer";

export async function smeltIron(bot: Bot) {
  const output: string[] = [];
  const { output: smeltOutput, success } = await smeltItem(bot, "raw_iron", "coal", 1);
  if (!success) {
    output.push("Failed to smelt iron.");
    bot.chat("Failed to smelt iron.");
    return { output, success: false };
  }
  output.push(...smeltOutput);
  output.push("Iron smelted.");
  bot.chat("Iron smelted.");
  return { output, success: true };
}