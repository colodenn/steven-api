import type { Bot } from "mineflayer";
import * as mineflayerPathfinder from "mineflayer-pathfinder";
import type { Vec3 } from "vec3";

const {
  goals: { GoalNear, GoalNearXZ },
} = mineflayerPathfinder;

export async function exploreUntil(
  bot: Bot,
  direction: Vec3,
  maxTime = 60,
  callback = () => {
    return false;
  },
) {
  if (typeof maxTime !== "number") {
    throw new Error("maxTime must be a number");
  }
  if (typeof callback !== "function") {
    throw new Error("callback must be a function");
  }
  const test = callback();
  if (test) {
    return Promise.resolve(test);
  }
  if (direction.x === 0 && direction.y === 0 && direction.z === 0) {
    throw new Error("direction cannot be 0, 0, 0");
  }
  if (
    !(
      (direction.x === 0 || direction.x === 1 || direction.x === -1) &&
      (direction.y === 0 || direction.y === 1 || direction.y === -1) &&
      (direction.z === 0 || direction.z === 1 || direction.z === -1)
    )
  ) {
    throw new Error("direction must be a Vec3 only with value of -1, 0 or 1");
  }
  maxTime = Math.min(maxTime, 1200);
  return new Promise((resolve, reject) => {
    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    const explore = () => {
      const x = bot.entity.position.x + Math.floor(Math.random() * 20 + 10) * dx;
      const y = bot.entity.position.y + Math.floor(Math.random() * 20 + 10) * dy;
      const z = bot.entity.position.z + Math.floor(Math.random() * 20 + 10) * dz;
      let goal: InstanceType<typeof GoalNear> | InstanceType<typeof GoalNearXZ> =
        new GoalNear(x, y, z, 0);
      if (dy === 0) {
        goal = new GoalNearXZ(x, z, 0);
      }
      bot.pathfinder.setGoal(goal);

      try {
        const result = callback();
        if (result) {
          cleanUp();
          resolve(result);
        }
      } catch (err) {
        cleanUp();
        reject(err);
      }
    };

    const explorationInterval: NodeJS.Timeout = setInterval(explore, 2000);

    const maxTimeTimeout: NodeJS.Timeout = setTimeout(() => {
      cleanUp();
      resolve(null);
    }, maxTime * 1000);

    const cleanUp = () => {
      clearInterval(explorationInterval);
      clearTimeout(maxTimeTimeout);
      bot.pathfinder.setGoal(null);
    };
  });
}
