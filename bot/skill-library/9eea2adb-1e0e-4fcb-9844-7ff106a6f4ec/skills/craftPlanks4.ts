import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftPlanks4(bot: Bot) {
  const output: string[] = [];

  const { output: craftOutput, success } = await craftItem(bot, "oak_planks", 1); // 1 recipe = 4 planks

  if (!success) {
    output.push("Failed to craft 4 planks.");
    bot.chat("Failed to craft 4 planks.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("4 planks crafted.");
  bot.chat("4 planks crafted.");
  return { output, success: true };
}