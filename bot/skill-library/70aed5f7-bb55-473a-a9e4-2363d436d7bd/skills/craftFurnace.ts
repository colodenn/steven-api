import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftFurnace(bot: Bot) {
  const output: string[] = [];
  const { output: craftOutput, success } = await craftItem(bot, "furnace", 1);
  if (!success) {
    output.push("Failed to craft furnace.");
    bot.chat("Failed to craft furnace.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Furnace crafted.");
  bot.chat("Furnace crafted.");
  return { output, success: true };
}