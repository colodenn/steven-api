import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftSticks(bot: Bot, count: number = 1) {
  const { output, success } = await craftItem(bot, "stick", count);
  if (!success) {
    return { output, success: false };
  }
  return { output, success: true };
}