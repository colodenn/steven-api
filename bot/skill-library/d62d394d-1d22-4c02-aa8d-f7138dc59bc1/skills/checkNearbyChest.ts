import { checkItemInsideChest } from "../../../global-primitives/useChest";
import type { Bot } from "mineflayer";

export async function checkNearbyChest(bot: Bot) {
  const output: string[] = [];

  const chest = bot.findBlock({
    matching: "chest",
    maxDistance: 32,
  });

  if (!chest) {
    output.push("No chest nearby.");
    return { output, success: false };
  }

  // Listen for the closeChest event to get items
  const itemsPromise = new Promise((resolve) => {
    bot.once("closeChest", (items, position) => {
      resolve(items);
    });
  });

  await checkItemInsideChest(bot, chest.position);

  const items = await itemsPromise;

  output.push(`Chest contents: ${JSON.stringify(items)}`);
  return { output, success: true };
}