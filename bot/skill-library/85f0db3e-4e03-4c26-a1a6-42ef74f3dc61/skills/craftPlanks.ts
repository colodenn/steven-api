import { craftItem } from "../../../global-primitives/craftItem";
import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";

const mcData = mcDataImport("1.19");

export async function craftPlanks(bot: Bot) {
  const output: string[] = [];
  const logNames = ["oak_log", "birch_log", "spruce_log", "jungle_log", "acacia_log", "dark_oak_log", "mangrove_log"];

  let logItem = null;
  for (const logName of logNames) {
    logItem = bot.inventory.findInventoryItem(mcData.itemsByName[logName].id, null);
    if (logItem) break;
  }

  if (!logItem) {
    output.push("No wood log in inventory to craft planks.");
    return { output, success: false };
  }

  const plankName = logItem.name.replace('_log', '_planks');

  const { output: craftOutput, success } = await craftItem(bot, plankName, 1); // crafts 4 planks

  if (!success) {
    output.push("Failed to craft planks.");
    return { output, success: false };
  }

  output.push(...craftOutput);
  output.push("Planks crafted.");
  return { output, success: true };
}