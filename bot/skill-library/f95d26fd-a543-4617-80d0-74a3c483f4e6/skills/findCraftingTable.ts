import { exploreUntil } from "../../../global-primitives/exploreUntil";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function findCraftingTable(bot: Bot) {
  const output: string[] = [];
  const directions = [new Vec3(1, 0, 0), new Vec3(0, 0, 1), new Vec3(-1, 0, 0), new Vec3(0, 0, -1)];

  let craftingTableBlock = null;
  for (const dir of directions) {
    craftingTableBlock = await exploreUntil(bot, dir, 60, () => {
      return bot.findBlock({
        matching: block => block.name === "crafting_table",
        maxDistance: 32
      });
    });
    if (craftingTableBlock.result) break;
  }

  if (!craftingTableBlock.result) {
    output.push("Could not find a crafting table after exploring.");
    bot.chat("Could not find a crafting table after exploring.");
    return { output, success: false };
  }

  output.push("Found crafting table.");
  bot.chat("Found crafting table.");
  return { output, success: true };
}