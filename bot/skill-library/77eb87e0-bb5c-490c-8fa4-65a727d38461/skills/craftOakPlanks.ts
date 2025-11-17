import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftOakPlanks(bot: Bot, count: number = 1) {
  const { output, success } = await craftItem(bot, "oak_planks", count);
  if (!success) {
    return { output, success: false };
  }
  return { output, success: true };
}