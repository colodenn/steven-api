import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

export async function exploreUntil(bot: Bot, direction: Vec3, maxDistance: number, condition: () => any) {
  const startPos = bot.entity.position.clone();
  let distance = 0;
  const stepSize = 1;

  while (distance < maxDistance) {
    const result = condition();
    if (result) return result;

    // Calculate next position
    const normalizedDir = direction.normalize();
    const nextPos = startPos.plus(normalizedDir.multiply(distance + stepSize));
    nextPos.y = Math.floor(nextPos.y); // Adjust to block level or something, but maybe not

    try {
      await bot.pathfinder.goto(nextPos);
    } catch (e) {
      // If can't reach, maybe break or continue
      break;
    }

    distance += stepSize;

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  return null;
}