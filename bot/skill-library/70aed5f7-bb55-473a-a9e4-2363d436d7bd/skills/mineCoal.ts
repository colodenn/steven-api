import { exploreUntil } from "../../../global-primitives/exploreUntil";
import { mineBlock } from "../../../global-primitives/mineBlock";
import { Vec3 } from "vec3";
import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";

const mcData = mcDataImport("1.19");

export async function mineCoal(bot: Bot) {
  const output: string[] = [];
  const directions = [new Vec3(0, -1, 0), new Vec3(0, -1, 1), new Vec3(0, -1, -1)];
  let coalOreBlock = null;
  for (const dir of directions) {
    coalOreBlock = await exploreUntil(bot, dir, 120, () => {
      const coal_ore = bot.findBlock({
        matching: mcData.blocksByName["coal_ore"].id,
        maxDistance: 32
      });
      return coal_ore;
    });
    if (coalOreBlock.result) break;
  }
  if (!coalOreBlock.result) {
    output.push("Could not find coal ore after exploring.");
    bot.chat("Could not find coal ore after exploring.");
    return { output, success: false };
  }
  // Mine the coal ore
  const { output: mineOutput, success } = await mineBlock(bot, coalOreBlock.result.name, 1);
  if (!success) {
    output.push("Failed to mine coal ore.");
    bot.chat("Failed to mine coal ore.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("Coal ore mined.");
  bot.chat("Coal ore mined.");
  return { output, success: true };
}