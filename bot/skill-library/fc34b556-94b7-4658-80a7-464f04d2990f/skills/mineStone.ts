import { mineBlock } from "../../../global-primitives/mineBlock";
import type { Bot } from "mineflayer";

export async function mineStone(bot: Bot) {
  const output: string[] = [];

  const { output: mineOutput, success } = await mineBlock(bot, "stone", 10);
  if (!success) {
    output.push(...mineOutput);
    output.push("Failed to mine stone.");
    bot.chat("Failed to mine stone.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("Stone mined.");
  bot.chat("Stone mined.");
  return { output, success: true };
}