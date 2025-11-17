import { mineBlock } from "../../../global-primitives/mineBlock";
import type { Bot } from "mineflayer";

export async function mineIronOre(bot: Bot, count: number = 5) {
  const { output, success } = await mineBlock(bot, "iron_ore", count);
  if (!success) {
    return { output, success: false };
  }
  return { output, success: true };
}