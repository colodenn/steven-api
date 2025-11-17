import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftChest(bot: Bot) {
  const output: string[] = [];
  const { output: craftOutput, success } = await craftItem(bot, "chest", 1);
  if (!success) {
    output.push(...craftOutput);
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Chest crafted.");
  bot.chat("Chest crafted.");
  return { output, success: true };
}