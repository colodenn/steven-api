import { mineBlock } from "../../../global-primitives/mineBlock";
import type { Bot } from "mineflayer";

export async function mineCoal(bot: Bot) {
  const output: string[] = [];

  // Equip stone pickaxe if available, else wooden
  let pickaxe = bot.inventory.items().find(item => item.name === 'stone_pickaxe');
  if (!pickaxe) {
    pickaxe = bot.inventory.items().find(item => item.name === 'wooden_pickaxe');
  }
  if (pickaxe) {
    await bot.equip(pickaxe, 'hand');
    output.push(`Equipped ${pickaxe.name}.`);
  } else {
    output.push("No pickaxe to equip.");
    return { output, success: false };
  }

  const { output: mineOutput, success } = await mineBlock(bot, "coal_ore", 3);

  if (!success) {
    output.push("Failed to mine coal.");
    bot.chat("Failed to mine coal.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("Coal mined.");
  bot.chat("Coal mined.");
  return { output, success: true };
}