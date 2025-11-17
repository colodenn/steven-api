import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftPlanks(bot: Bot) {
  const output: string[] = [];
  // Craft 1 time to get 4 planks from 1 log
  const { output: craftOutput, success } = await craftItem(bot, "oak_planks", 1);
  if (!success) {
    output.push(...craftOutput);
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Planks crafted.");
  bot.chat("Planks crafted.");
  return { output, success: true };
}