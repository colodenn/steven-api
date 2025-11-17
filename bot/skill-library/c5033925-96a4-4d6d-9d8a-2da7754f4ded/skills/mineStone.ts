import { exploreUntil } from "../../../global-primitives/exploreUntil";
import { mineBlock } from "../../../global-primitives/mineBlock";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function mineStone(bot: Bot) {
  const output: string[] = [];
  const directions = [new Vec3(1, 0, 1), new Vec3(0, 0, 1), new Vec3(1, 0, 0), new Vec3(-1, 0, 1)];

  let stoneBlock = null;
  for (const dir of directions) {
    stoneBlock = await exploreUntil(bot, dir, 120, () => {
      return bot.findBlock({
        matching: block => block.name === "stone",
        maxDistance: 32
      });
    });
    if (stoneBlock.result) break;
  }

  if (!stoneBlock.result) {
    output.push("Could not find stone after exploring.");
    bot.chat("Could not find stone after exploring.");
    return { output, success: false };
  }

  // Mine the stone block
  const { output: mineOutput, success } = await mineBlock(bot, "stone", 1);
  if (!success) {
    output.push("Failed to mine stone.");
    bot.chat("Failed to mine stone.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("Stone mined.");
  bot.chat("Stone mined.");
  return { output, success: true };
}