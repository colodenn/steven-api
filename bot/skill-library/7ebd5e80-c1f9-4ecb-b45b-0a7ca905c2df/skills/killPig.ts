import { killMob } from "../../../global-primitives/killMob";
import type { Bot } from "mineflayer";

export async function killPig(bot: Bot) {
  const output: string[] = [];
  const { output: killOutput, success } = await killMob(bot, "pig", 300);
  if (!success) {
    output.push(...killOutput);
    return { output, success: false };
  }
  output.push(...killOutput);
  output.push("Pig killed.");
  bot.chat("Pig killed.");
  return { output, success: true };
}