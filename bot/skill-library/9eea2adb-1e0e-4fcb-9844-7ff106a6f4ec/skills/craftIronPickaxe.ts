import { craftItem } from "../../../global-primitives/craftItem";
import type { Bot } from "mineflayer";

export async function craftIronPickaxe(bot: Bot) {
  const output: string[] = [];

  const { output: craftOutput, success } = await craftItem(bot, "iron_pickaxe", 1);

  if (!success) {
    output.push("Failed to craft iron pickaxe.");
    bot.chat("Failed to craft iron pickaxe.");
    return { output, success: false };
  }
  output.push(...craftOutput);
  output.push("Iron pickaxe crafted.");
  bot.chat("Iron pickaxe crafted.");
  return { output, success: true };
}