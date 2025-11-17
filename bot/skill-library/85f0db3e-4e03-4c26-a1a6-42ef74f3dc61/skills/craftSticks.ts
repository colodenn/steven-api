import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftSticks(bot: Bot) {
  const output: string[] = [];

  const { output: craftOutput, success } = await craftItem(bot, "stick", 1); // crafts 4 sticks from 2 planks

  if (!success) {
    output.push("Failed to craft sticks.");
    return { output, success: false };
  }

  output.push(...craftOutput);
  output.push("Sticks crafted.");
  return { output, success: true };
}