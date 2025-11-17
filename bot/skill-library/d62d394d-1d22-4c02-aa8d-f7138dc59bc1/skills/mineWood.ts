import { exploreUntil } from "../../../global-primitives/exploreUntil";
import { mineBlock } from "../../../global-primitives/mineBlock";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function mineWood(bot: Bot) {
  const output: string[] = [];
  const woodLogNames = ["oak_log", "birch_log", "spruce_log", "jungle_log", "acacia_log", "dark_oak_log", "mangrove_log"];

  const directions = [new Vec3(1, 0, 1), new Vec3(0, 0, 1), new Vec3(1, 0, 0), new Vec3(-1, 0, 1)];

  let woodLogBlock = null;
  for (const dir of directions) {
    woodLogBlock = await exploreUntil(bot, dir, 120, () => {
      return bot.findBlock({
        matching: block => woodLogNames.includes(block.name),
        maxDistance: 32
      });
    });
    if (woodLogBlock.result) break;
  }

  if (!woodLogBlock.result) {
    output.push("Could not find a wood log after exploring.");
    bot.chat("Could not find a wood log after exploring.");
    return { output, success: false };
  }

  // Mine the wood log block
  const { output: mineOutput, success } = await mineBlock(bot, woodLogBlock.result.name, 1);
  if (!success) {
    output.push("Failed to mine wood log.");
    bot.chat("Failed to mine wood log.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("Wood log mined.");
  bot.chat("Wood log mined.");
  return { output, success: true };
}