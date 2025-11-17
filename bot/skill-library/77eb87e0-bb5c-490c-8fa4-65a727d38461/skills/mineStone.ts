import { mineBlock } from "../../../global-primitives/mineBlock";
import type { Bot } from "mineflayer";

export async function mineStone(bot: Bot, count: number = 10) {
  const { output, success } = await mineBlock(bot, "stone", count);
  if (!success) {
    return { output, success: false };
  }
  return { output, success: true };
}