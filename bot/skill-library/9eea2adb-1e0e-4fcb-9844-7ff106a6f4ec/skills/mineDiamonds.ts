import { exploreUntil } from "../../../global-primitives/exploreUntil";
import { mineBlock } from "../../../global-primitives/mineBlock";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";
import mcDataImport from "minecraft-data";

const mcData = mcDataImport("1.19");

export async function mineDiamonds(bot: Bot) {
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

  const directions = [new Vec3(0, -1, 0), new Vec3(1, -1, 0), new Vec3(-1, -1, 0), new Vec3(0, -1, 1), new Vec3(0, -1, -1)];

  let diamondOreBlock = null;
  for (const dir of directions) {
    diamondOreBlock = await exploreUntil(bot, dir, 300, () => {
      return bot.findBlock({
        matching: mcData.blocksByName.diamond_ore.id,
        maxDistance: 32
      });
    });
    if (diamondOreBlock.result) break;
  }

  if (!diamondOreBlock.result) {
    output.push("Could not find diamond ore after exploring.");
    bot.chat("Could not find diamond ore after exploring.");
    return { output, success: false };
  }

  // Mine the diamond ore
  const { output: mineOutput, success } = await mineBlock(bot, "diamond_ore", 1);

  if (!success) {
    output.push("Failed to mine diamond ore.");
    bot.chat("Failed to mine diamond ore.");
    return { output, success: false };
  }
  output.push(...mineOutput);
  output.push("Diamond ore mined.");
  bot.chat("Diamond ore mined.");
  return { output, success: true };
}