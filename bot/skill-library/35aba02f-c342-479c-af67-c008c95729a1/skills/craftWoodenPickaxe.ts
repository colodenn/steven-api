import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftWoodenPickaxe(bot: Bot) {
  const output: string[] = [];
  const { output: craftOutput, success } = await craftItem(bot, "wooden_pickaxe", 1);
  if (!success) {
    output.push(...craftOutput);
    output.push("Failed to craft wooden pickaxe.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Wooden pickaxe crafted.");
  return { output, success: true };
}