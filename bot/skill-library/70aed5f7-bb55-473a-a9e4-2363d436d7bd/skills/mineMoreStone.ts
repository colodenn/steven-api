import { mineBlock } from "../../../global-primitives/mineBlock";
import type { Bot } from "mineflayer";

export async function mineMoreStone(bot: Bot) {
  const output: string[] = [];
  const { output: mineOutput, success } = await mineBlock(bot, "stone", 10);
  if (!success) {
    output.push("Failed to mine more stone.");
    bot.chat("Failed to mine more stone.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("Mined more stone.");
  bot.chat("Mined more stone.");
  return { output, success: true };
}