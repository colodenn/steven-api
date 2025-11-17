import { placeItem } from "../../../global-primitives/placeItem";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function placeChest(bot: Bot) {
  const output: string[] = [];
  const position = bot.entity.position.offset(1, 0, 0);
  const { output: placeOutput, success } = await placeItem(bot, "chest", position);
  if (!success) {
    output.push(...placeOutput);
    return { output, success: false };
  }
  output.push(...placeOutput);
  output.push("Chest placed.");
  bot.chat("Chest placed.");
  return { output, success: true };
}