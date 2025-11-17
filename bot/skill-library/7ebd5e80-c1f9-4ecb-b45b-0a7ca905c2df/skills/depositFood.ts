import { depositItemIntoChest } from "../../../global-primitives/useChest";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function depositFood(bot: Bot) {
  const output: string[] = [];
  const chestPosition = bot.entity.position.offset(1, 0, 0);
  await depositItemIntoChest(bot, chestPosition, { "cooked_porkchop": 1 });
  output.push("Food deposited.");
  bot.chat("Food deposited.");
  return { output, success: true };
}