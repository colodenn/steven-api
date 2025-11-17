import { mineBlock } from "../../../global-primitives/mineBlock";
import type { Bot } from "mineflayer";

export async function mineOneStone(bot: Bot) {
  const { output, success } = await mineBlock(bot, "stone", 1);
  if (!success) {
    return { output, success: false };
  }
  return { output, success: true };
}