import { exploreUntil } from "../../../global-primitives/exploreUntil";
import { killMob } from "../../../global-primitives/killMob";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function killPig(bot: Bot) {
  const output: string[] = [];

  const directions = [new Vec3(1, 0, 1), new Vec3(0, 0, 1), new Vec3(1, 0, 0), new Vec3(-1, 0, 1)];

  let pigEntity = null;
  for (const dir of directions) {
    pigEntity = await exploreUntil(bot, dir, 120, () => {
      const pig = bot.nearestEntity((entity) => {
        return entity.name === "pig" && entity.position.distanceTo(bot.entity.position) < 32;
      });
      return pig;
    });
    if (pigEntity.result) break;
  }

  if (!pigEntity.result) {
    output.push("Could not find a pig after exploring.");
    bot.chat("Could not find a pig after exploring.");
    return { output, success: false };
  }

  // Kill the pig
  const { output: killOutput, success } = await killMob(bot, "pig", 300);

  if (!success) {
    output.push("Failed to kill pig.");
    return { output, success: false };
  }
  output.push(...killOutput);
  output.push("Pig killed.");
  bot.chat("Pig killed.");
  return { output, success: true };
}