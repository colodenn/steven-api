import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftSticks(bot: Bot, count = 1) {
  const output: string[] = [];
  const { output: craftOutput, success } = await craftItem(bot, "stick", count);
  if (!success) {
    output.push(...craftOutput);
    output.push("Failed to craft sticks.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Sticks crafted.");
  return { output, success: true };
}