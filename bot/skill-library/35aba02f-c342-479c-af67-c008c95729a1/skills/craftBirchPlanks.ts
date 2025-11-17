import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftBirchPlanks(bot: Bot, count = 1) {
  const output: string[] = [];
  const { output: craftOutput, success } = await craftItem(bot, "birch_planks", count);
  if (!success) {
    output.push(...craftOutput);
    output.push("Failed to craft birch planks.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Birch planks crafted.");
  return { output, success: true };
}