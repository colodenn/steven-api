import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftPlanks(bot: Bot) {
  const output: string[] = [];
  const { output: craftOutput, success } = await craftItem(bot, "oak_planks", 4);
  if (!success) {
    output.push("Failed to craft oak planks.");
    bot.chat("Failed to craft oak planks.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Oak planks crafted.");
  bot.chat("Oak planks crafted.");
  return { output, success: true };
}