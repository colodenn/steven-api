import { craftItem } from "../primitives/craftItem";
import { mineWood } from "../skills/mineWood";
import type { Bot } from "mineflayer";

export async function craftPlanks(bot: Bot) {
  const output: string[] = [];

  // Check if we have logs
  const logs = bot.inventory.items().filter(item => item.name.endsWith('_log'));

  if (logs.length === 0) {
    output.push("No logs in inventory. Mining wood first.");
    await mineWood(bot);
  }

  // Re-check logs
  const updatedLogs = bot.inventory.items().filter(item => item.name.endsWith('_log'));
  if (updatedLogs.length === 0) {
    output.push("Still no logs available.");
    return output;
  }

  const log = updatedLogs[0];
  const plankName = log.name.replace('_log', '_planks');

  await craftItem(bot, plankName, 1);  // Changed to 1, since recipe produces 4
  output.push("Planks crafted.");
  bot.chat("Planks crafted.");
  return output;
}