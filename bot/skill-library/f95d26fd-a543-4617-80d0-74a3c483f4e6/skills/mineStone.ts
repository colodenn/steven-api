import { mineBlock } from "../../../global-primitives/mineBlock";
import type { Bot } from "mineflayer";

export async function mineStone(bot: Bot) {
  const { output, success } = await mineBlock(bot, "stone", 5);
  if (!success) {
    bot.chat("Failed to mine stone");
    return { output, success: false };
  }
  bot.chat("Mined stone");
  return { output, success: true };
}