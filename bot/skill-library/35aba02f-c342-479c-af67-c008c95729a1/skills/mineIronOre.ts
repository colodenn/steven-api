import { exploreUntil } from "../../../global-primitives/exploreUntil";
import { mineBlock } from "../../../global-primitives/mineBlock";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function mineIronOre(bot: Bot, count = 1) {
  const output: string[] = [];
  const ironOre = await exploreUntil(bot, new Vec3(0, -1, 0), 120, () => {
    return bot.findBlock({
      matching: block => block.name === "iron_ore",
      maxDistance: 32
    });
  });
  if (!ironOre.result) {
    output.push("Could not find iron ore after exploring.");
    return { output, success: false };
  }
  const { output: mineOutput, success } = await mineBlock(bot, "iron_ore", count);
  if (!success) {
    output.push(...mineOutput);
    output.push("Failed to mine iron ore.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("Iron ore mined.");
  return { output, success: true };
}