import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftStonePickaxe(bot: Bot) {
  const { output, success } = await craftItem(bot, "stone_pickaxe", 1);
  if (!success) {
    return { output, success: false };
  }
  return { output, success: true };
}