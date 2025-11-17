import { exploreUntil } from "../../../global-primitives/exploreUntil";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function goToSurface(bot: Bot) {
  const output: string[] = [];

  // Explore upwards
  const result = await exploreUntil(bot, new Vec3(0, 1, 0), 120, () => {
    const blockBelow = bot.blockAt(bot.entity.position.offset(0, -1, 0));
    return blockBelow && (blockBelow.name === 'grass_block' || blockBelow.name === 'dirt');
  });

  if (result.success && result.result) {
    output.push("Reached the surface.");
    bot.chat("Reached the surface.");
    return { output, success: true };
  } else {
    output.push("Could not reach the surface.");
    bot.chat("Could not reach the surface.");
    return { output, success: false };
  }
}