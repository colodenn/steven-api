import { placeItem } from "../../../global-primitives/placeItem";
import type { Bot } from "mineflayer";
import { Vec3 } from "vec3";

export async function placeCraftingTable(bot: Bot) {
  const position = bot.entity.position.offset(1, -1, 0); // place near the bot
  const { output, success } = await placeItem(bot, "crafting_table", position);
  if (!success) {
    bot.chat("Failed to place crafting table");
    return { output, success: false };
  }
  bot.chat("Placed crafting table");
  return { output, success: true };
}