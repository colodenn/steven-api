import { smeltItem } from "../../../global-primitives/smeltItem";
import type { Bot } from "mineflayer";

export async function smeltIron(bot: Bot, count: number = 1) {
  const { output, success } = await smeltItem(bot, "raw_iron", "coal", count);
  if (!success) {
    return { output, success: false };
  }
  return { output, success: true };
}