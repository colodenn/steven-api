import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";

const mcData = mcDataImport("1.19");

export async function craftCraftingTableDirect(bot: Bot) {
  const output: string[] = [];
  const item = mcData.itemsByName["crafting_table"];
  if (!item) {
    output.push("No crafting_table item");
    return { success: false, output };
  }
  const recipe = bot.recipesFor(item.id, null, 1, null)[0];
  if (!recipe) {
    output.push("No recipe for crafting_table");
    return { success: false, output };
  }
  try {
    await bot.craft(recipe, 1, null);
    output.push("Crafted crafting table");
    bot.chat("Crafted crafting table");
    return { output, success: true };
  } catch (err) {
    output.push(`Failed to craft crafting table: ${err.message}`);
    bot.chat("Failed to craft crafting table");
    return { success: false, output };
  }
}