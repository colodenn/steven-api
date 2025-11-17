import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftPlanks(bot: Bot, count = 1) {
  const output: string[] = [];
  // Assume oak_log for now
  const { output: craftOutput, success } = await craftItem(bot, "oak_planks", count);
  if (!success) {
    output.push(...craftOutput);
    output.push("Failed to craft planks.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Planks crafted.");
  return { output, success: true };
}