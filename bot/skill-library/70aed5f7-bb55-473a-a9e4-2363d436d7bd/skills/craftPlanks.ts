import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftPlanks(bot: Bot) {
  const output: string[] = [];
  const { output: craftOutput, success } = await craftItem(bot, "oak_planks", 2);
  if (!success) {
    output.push("Failed to craft planks.");
    bot.chat("Failed to craft planks.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Planks crafted.");
  bot.chat("Planks crafted.");
  return { output, success: true };
}