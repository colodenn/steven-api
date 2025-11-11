import { exploreUntil } from "../primitives/exploreUntil";
import { mineBlock } from "../primitives/mineBlock";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function mineFiveWoodLogs(bot: Bot) {
  const output: string[] = [];
  const woodLogNames = ["oak_log", "birch_log", "spruce_log", "jungle_log", "acacia_log", "dark_oak_log", "mangrove_log"];

  for (let i = 0; i < 5; i++) {
    // Find a wood log block
    const woodLogBlock = await exploreUntil(bot, new Vec3(1, 0, 1), 60, () => {
      return bot.findBlock({
        matching: block => woodLogNames.includes(block.name),
        maxDistance: 32
      });
    });

    if (!woodLogBlock) {
      output.push(`Could not find a wood log for the ${i+1}th attempt.`);
      bot.chat(`Could not find a wood log for the ${i+1}th attempt.`);
      break;
    }

    // Mine the wood log block
    await mineBlock(bot, woodLogBlock.name, 1);
    output.push(`Wood log ${i+1} mined.`);
    bot.chat(`Wood log ${i+1} mined.`);
  }

  return output;
}