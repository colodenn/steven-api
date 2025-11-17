import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";

const mcData = mcDataImport("1.19");

export async function craftPlanksDirect(bot: Bot) {
  const output: string[] = [];
  const item = mcData.itemsByName["oak_planks"];
  if (!item) {
    output.push("No oak_planks item");
    return { success: false, output };
  }
  const recipe = bot.recipesFor(item.id, null, 1, null)[0];
  if (!recipe) {
    output.push("No recipe for oak_planks");
    return { success: false, output };
  }
  try {
    await bot.craft(recipe, 1, null);
    output.push("Crafted oak planks");
    bot.chat("Crafted oak planks");
    return { output, success: true };
  } catch (err) {
    output.push(`Failed to craft oak planks: ${err.message}`);
    bot.chat("Failed to craft oak planks");
    return { success: false, output };
  }
}