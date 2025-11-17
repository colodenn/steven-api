import { mineBlock } from "../../../global-primitives/mineBlock";
import type { Bot } from "mineflayer";

export async function mineStone(bot: Bot, count = 4) {
  const output: string[] = [];

  const { output: mineOutput, success } = await mineBlock(bot, "stone", count);
  if (!success) {
    output.push("Failed to mine stone.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("Stone mined.");
  return { output, success: true };
}