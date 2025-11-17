import { smeltItem } from "../../../global-primitives/smeltItem";
import type { Bot } from "mineflayer";

export async function smeltPork(bot: Bot) {
  const output: string[] = [];
  const { output: smeltOutput, success } = await smeltItem(bot, "raw_porkchop", "oak_planks", 1);
  if (!success) {
    output.push(...smeltOutput);
    return { output, success: false };
  }
  output.push(...smeltOutput);
  output.push("Pork cooked.");
  bot.chat("Pork cooked.");
  return { output, success: true };
}