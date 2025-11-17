import { placeItem } from "../../../global-primitives/placeItem";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function placeCraftingTable(bot: Bot) {
  const output: string[] = [];
  const position = bot.entity.position.offset(0, 0, 1);
  const { output: placeOutput, success } = await placeItem(bot, "crafting_table", position);
  if (!success) {
    output.push("Failed to place crafting table.");
    bot.chat("Failed to place crafting table.");
    return { output, success: false };
  }
  output.push(...placeOutput);
  output.push("Crafting table placed.");
  bot.chat("Crafting table placed.");
  return { output, success: true };
}