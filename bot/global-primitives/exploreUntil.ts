import type { Bot } from "mineflayer";
import mineflayerPathfinder from "mineflayer-pathfinder";
import type { Vec3 } from "vec3";

const {
  goals: { GoalNear, GoalNearXZ },
} = mineflayerPathfinder;

/*
Explore until find an iron_ore, use Vec3(0, -1, 0) because iron ores are usually underground
await exploreUntil(bot, new Vec3(0, -1, 0), 60, () => {
    const iron_ore = bot.findBlock({
        matching: mcData.blocksByName["iron_ore"].id,
        maxDistance: 32,
    });
    return iron_ore;
});

Explore until find a pig, use Vec3(1, 0, 1) because pigs are usually on the surface
let pig = await exploreUntil(bot, new Vec3(1, 0, 1), 60, () => {
    const pig = bot.nearestEntity((entity) => {
        return (
            entity.name === "pig" &&
            entity.position.distanceTo(bot.entity.position) < 32
        );
    });
    return pig;
});
*/
/*
direction: Vec3, can only contain value of -1, 0 or 1
maxTime: number, the max time for exploration
callback: function, early stop condition, will be called each second, exploration will stop if return value is not null

Return: null if explore timeout, otherwise return the return value of callback
*/
export async function exploreUntil(
  bot: Bot,
  direction: Vec3,
  maxTime = 60,
  callback = () => {
    return false;
  },
) {
  const output: string[] = [];
  if (typeof maxTime !== "number") {
    output.push("maxTime must be a number");
    return { success: false, output };
  }
  if (typeof callback !== "function") {
    output.push("callback must be a function");
    return { success: false, output };
  }
  const test = callback();
  if (test) {
    return { success: true, output, result: test };
  }
  if (direction.x === 0 && direction.y === 0 && direction.z === 0) {
    output.push("direction cannot be 0, 0, 0");
    return { success: false, output };
  }
  if (
    !(
      (direction.x === 0 || direction.x === 1 || direction.x === -1) &&
      (direction.y === 0 || direction.y === 1 || direction.y === -1) &&
      (direction.z === 0 || direction.z === 1 || direction.z === -1)
    )
  ) {
    output.push("direction must be a Vec3 only with value of -1, 0 or 1");
    return { success: false, output };
  }
  maxTime = Math.min(maxTime, 1200);
  // Minecraft 1.19 valid y coordinate range
  const MIN_Y = -64;
  const MAX_Y = 320;

  return new Promise((resolve) => {
    const dx = direction.x;
    const dy = direction.y;
    const dz = direction.z;

    const explore = () => {
      const x = bot.entity.position.x + Math.floor(Math.random() * 20 + 10) * dx;
      let y = bot.entity.position.y + Math.floor(Math.random() * 20 + 10) * dy;
      // Clamp y coordinate to valid Minecraft bounds
      y = Math.max(MIN_Y, Math.min(MAX_Y, y));
      const z = bot.entity.position.z + Math.floor(Math.random() * 20 + 10) * dz;
      let goal: InstanceType<typeof GoalNear> | InstanceType<typeof GoalNearXZ> =
        new GoalNear(x, y, z, 0);
      if (dy === 0) {
        goal = new GoalNearXZ(x, z, 0);
      }
      try {
        bot.pathfinder.setGoal(goal);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        output.push(`Pathfinding error: ${errorMessage}`);
        // Don't resolve here, let the timeout or callback handle it
        return;
      }

      try {
        const result = callback();
        if (result) {
          cleanUp();
          resolve({ success: true, output, result });
        }
      } catch (err) {
        const error = err as Error;
        cleanUp();
        output.push(error.message);
        resolve({ success: false, output });
      }
    };

    const explorationInterval: NodeJS.Timeout = setInterval(explore, 2000);

    const maxTimeTimeout: NodeJS.Timeout = setTimeout(() => {
      cleanUp();
      output.push(`Exploration timed out after ${maxTime} seconds`);
      resolve({ success: false, output });
    }, maxTime * 1000);

    const cleanUp = () => {
      clearInterval(explorationInterval);
      clearTimeout(maxTimeTimeout);
      bot.pathfinder.setGoal(null);
    };
  });
}
