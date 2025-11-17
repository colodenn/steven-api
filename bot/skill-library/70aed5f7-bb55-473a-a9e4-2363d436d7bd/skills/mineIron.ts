import { exploreUntil } from "../../../global-primitives/exploreUntil";
import { mineBlock } from "../../../global-primitives/mineBlock";
import { Vec3 } from "vec3";
import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";

const mcData = mcDataImport("1.19");

export async function mineIron(bot: Bot) {
  const output: string[] = [];
  const directions = [new Vec3(0, -1, 0), new Vec3(0, -1, 1), new Vec3(0, -1, -1)];
  let ironOreBlock = null;
  for (const dir of directions) {
    ironOreBlock = await exploreUntil(bot, dir, 120, () => {
      const iron_ore = bot.findBlock({
        matching: mcData.blocksByName["iron_ore"].id,
        maxDistance: 32
      });
      return iron_ore;
    });
    if (ironOreBlock.result) break;
  }
  if (!ironOreBlock.result) {
    output.push("Could not find iron ore after exploring.");
    bot.chat("Could not find iron ore after exploring.");
    return { output, success: false };
  }
  // Mine the iron ore
  const { output: mineOutput, success } = await mineBlock(bot, ironOreBlock.result.name, 1);
  if (!success) {
    output.push("Failed to mine iron ore.");
    bot.chat("Failed to mine iron ore.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("Iron ore mined.");
  bot.chat("Iron ore mined.");
  return { output, success: true };
}