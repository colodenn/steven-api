import { mineBlock } from "../../../global-primitives/mineBlock";
import type { Bot } from "mineflayer";

export async function mineIronOre(bot: Bot) {
  const output: string[] = [];

  // Equip stone pickaxe
  const pickaxe = bot.inventory.items().find(item => item.name === 'stone_pickaxe');
  if (pickaxe) {
    await bot.equip(pickaxe, 'hand');
    output.push("Equipped stone pickaxe.");
  } else {
    output.push("No stone pickaxe to equip.");
    return { output, success: false };
  }

  const { output: mineOutput, success } = await mineBlock(bot, "iron_ore", 3);

  if (!success) {
    output.push("Failed to mine iron ore.");
    bot.chat("Failed to mine iron ore.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("Iron ore mined.");
  bot.chat("Iron ore mined.");
  return { output, success: true };
}