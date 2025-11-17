import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftWoodenPickaxe(bot: Bot) {
  const { output, success } = await craftItem(bot, "wooden_pickaxe", 1);
  if (!success) {
    return { output, success: false };
  }
  return { output, success: true };
}