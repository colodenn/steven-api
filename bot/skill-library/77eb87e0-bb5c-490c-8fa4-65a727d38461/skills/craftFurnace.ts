import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftFurnace(bot: Bot) {
  const { output, success } = await craftItem(bot, "furnace", 1);
  if (!success) {
    return { output, success: false };
  }
  return { output, success: true };
}