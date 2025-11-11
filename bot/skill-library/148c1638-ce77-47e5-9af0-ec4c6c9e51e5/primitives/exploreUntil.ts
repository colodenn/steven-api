import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function exploreUntil(bot: Bot, direction: Vec3, maxTime: number, condition: () => any) {
  const startTime = Date.now();

  while (Date.now() - startTime < maxTime * 1000) {
    const result = condition();
    if (result) return result;

    // Look in direction
    bot.lookAt(bot.position.add(direction));

    // Move forward
    bot.setControlState('forward', true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    bot.setControlState('forward', false);

    // Wait a bit more
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return null;
}