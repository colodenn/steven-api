import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";

const mcData = mcDataImport("1.19");

export async function craftSticksDirect(bot: Bot) {
  const output: string[] = [];
  const item = mcData.itemsByName["stick"];
  if (!item) {
    output.push("No stick item");
    return { success: false, output };
  }
  const recipe = bot.recipesFor(item.id, null, 1, null)[0];
  if (!recipe) {
    output.push("No recipe for stick");
    return { success: false, output };
  }
  try {
    await bot.craft(recipe, 1, null);
    output.push("Crafted sticks");
    bot.chat("Crafted sticks");
    return { output, success: true };
  } catch (err) {
    output.push(`Failed to craft sticks: ${err.message}`);
    bot.chat("Failed to craft sticks");
    return { success: false, output };
  }
}