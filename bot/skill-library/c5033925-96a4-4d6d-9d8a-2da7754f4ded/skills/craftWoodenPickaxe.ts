import mcDataImport from "minecraft-data";
import { craftItem } from "../../../global-primitives/craftItem";
import { placeItem } from "../../../global-primitives/placeItem";
import { Vec3 } from "vec3";
import type { Bot } from "mineflayer";

const mcData = mcDataImport("1.19");

export async function craftWoodenPickaxe(bot: Bot) {
  const output: string[] = [];

  // Craft planks directly
  const planksId = mcData.itemsByName["oak_planks"].id;
  const planksRecipe = bot.recipesFor(planksId, null, 0, false)[0];
  if (!planksRecipe) {
    output.push("No recipe for oak_planks");
    return { output, success: false };
  }
  try {
    await bot.craft(planksRecipe, 1, null);
    output.push("Crafted 4 oak planks");
  } catch (err) {
    output.push("Failed to craft planks: " + err.message);
    return { output, success: false };
  }

  // Craft crafting table directly
  const tableId = mcData.itemsByName["crafting_table"].id;
  const tableRecipe = bot.recipesFor(tableId, null, 0, false)[0];
  if (!tableRecipe) {
    output.push("No recipe for crafting_table");
    return { output, success: false };
  }
  try {
    await bot.craft(tableRecipe, 1, null);
    output.push("Crafted crafting table");
  } catch (err) {
    output.push("Failed to craft crafting table: " + err.message);
    return { output, success: false };
  }

  // Place crafting table
  const tablePosition = bot.entity.position.offset(1, -1, 0);
  const { output: placeOutput, success: placeSuccess } = await placeItem(bot, "crafting_table", tablePosition);
  if (!placeSuccess) {
    output.push(...placeOutput);
    return { output, success: false };
  }
  output.push(...placeOutput);

  // Now use craftItem for more planks, sticks, pickaxe
  const { output: plankOutput2, success: plankSuccess2 } = await craftItem(bot, "oak_planks", 2);
  if (!plankSuccess2) {
    output.push(...plankOutput2);
    return { output, success: false };
  }
  output.push(...plankOutput2);

  const { output: stickOutput, success: stickSuccess } = await craftItem(bot, "stick", 1);
  if (!stickSuccess) {
    output.push(...stickOutput);
    return { output, success: false };
  }
  output.push(...stickOutput);

  const { output: pickaxeOutput, success: pickaxeSuccess } = await craftItem(bot, "wooden_pickaxe", 1);
  if (!pickaxeSuccess) {
    output.push(...pickaxeOutput);
    return { output, success: false };
  }
  output.push(...pickaxeOutput);

  output.push("Wooden pickaxe crafted.");
  bot.chat("Wooden pickaxe crafted.");
  return { output, success: true };
}