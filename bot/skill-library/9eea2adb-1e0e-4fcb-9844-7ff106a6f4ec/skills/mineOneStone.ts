import { mineBlock } from "../../../global-primitives/mineBlock";
import type { Bot } from "mineflayer";

export async function mineOneStone(bot: Bot) {
  const output: string[] = [];

  // Equip wooden pickaxe
  const pickaxe = bot.inventory.items().find(item => item.name === 'wooden_pickaxe');
  if (pickaxe) {
    await bot.equip(pickaxe, 'hand');
    output.push("Equipped wooden pickaxe.");
  } else {
    output.push("No wooden pickaxe to equip.");
    return { output, success: false };
  }

  const { output: mineOutput, success } = await mineBlock(bot, "stone", 1);

  if (!success) {
    output.push("Failed to mine one stone.");
    bot.chat("Failed to mine one stone.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("One stone mined.");
  bot.chat("One stone mined.");
  return { output, success: true };
}