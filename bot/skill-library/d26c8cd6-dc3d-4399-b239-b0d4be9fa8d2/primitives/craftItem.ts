import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";

const mcData = mcDataImport("1.21.8");

export async function craftItem(bot: Bot, name: string, count = 1) {
  const output: string[] = [];

  if (typeof name !== "string") {
    throw new Error(`name for craftItem must be a string`);
  }
  if (typeof count !== "number") {
    throw new Error(`count for craftItem must be a number`);
  }

  const itemByName = mcData.itemsByName[name];
  if (!itemByName) {
    throw new Error(`No item named ${name}`);
  }

  const recipes = bot.recipesFor(itemByName.id, null, null, null);
  if (recipes.length === 0) {
    output.push(`No recipe found for ${name}`);
    return output;
  }

  // Use the first recipe
  const recipe = recipes[0];

  try {
    await bot.craft(recipe, count, null);
    output.push(`Crafted ${count} ${name}`);
  } catch (e) {
    output.push(`Failed to craft ${name}: ${e.message}`);
  }

  return output;
}