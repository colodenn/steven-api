import { placeItem } from "../../../global-primitives/placeItem";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function placeFurnace(bot: Bot) {
  const output: string[] = [];

  const position = bot.entity.position.offset(0, 0, 1);

  const { output: placeOutput, success } = await placeItem(bot, "furnace", position);

  if (!success) {
    output.push("Failed to place furnace.");
    bot.chat("Failed to place furnace.");
    return { output, success: false };
  }
  output.push(...placeOutput);
  output.push("Furnace placed.");
  bot.chat("Furnace placed.");
  return { output, success: true };
}