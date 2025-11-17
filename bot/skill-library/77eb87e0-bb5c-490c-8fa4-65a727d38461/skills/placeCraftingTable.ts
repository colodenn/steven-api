import { placeItem } from "../../../global-primitives/placeItem";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function placeCraftingTable(bot: Bot) {
  const position = bot.entity.position.offset(1, 0, 0);
  const { output, success } = await placeItem(bot, "crafting_table", position);
  if (!success) {
    return { output, success: false };
  }
  return { output, success: true };
}