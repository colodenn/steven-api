import { exploreUntil } from "../../../global-primitives/exploreUntil";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function goToSurface(bot: Bot) {
  const output: string[] = [];

  const result = await exploreUntil(bot, new Vec3(0, 1, 0), 120, () => {
    return bot.findBlock({
      matching: block => block.name === "grass_block" || block.name === "dirt",
      maxDistance: 32
    });
  });

  if (!result.success) {
    output.push("Could not reach the surface after exploring upwards.");
    bot.chat("Could not reach the surface after exploring upwards.");
    return { output, success: false };
  }

  output.push("Reached the surface.");
  bot.chat("Reached the surface.");
  return { output, success: true };
}