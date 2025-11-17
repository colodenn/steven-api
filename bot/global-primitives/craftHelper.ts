import mcDataImport, { Block, Item } from "minecraft-data";
import type { Bot } from "mineflayer";

const mcData = mcDataImport("1.19");

let output: string[] = [];

export const craftHelper = (bot: Bot, name: string, item: Item, craftingTable: Block) => {
    const recipes = bot.recipesAll(item.id, null, craftingTable);
    if (!recipes.length) {
        output.push(`No crafting table nearby`);
        return output;
    } else {
        const recipes = bot.recipesAll(
            item.id,
            null,
            true
        );
        // find the recipe with the fewest missing ingredients
        var min = 999;
        var min_recipe = null;
        for (const recipe of recipes) {
            const delta = recipe.delta;
            var missing = 0;
            for (const delta_item of delta) {
                if (delta_item.count < 0) {
                    const inventory_item = bot.inventory.findInventoryItem(
                        mcData.items[delta_item.id].name,
                        null
                    );
                    if (!inventory_item) {
                        missing += -delta_item.count;
                    } else {
                        missing += Math.max(
                            -delta_item.count - inventory_item.count,
                            0
                        );
                    }
                }
            }
            if (missing < min) {
                min = missing;
                min_recipe = recipe;
            }
        }
        const delta = min_recipe.delta;
        let message = "";
        for (const delta_item of delta) {
            if (delta_item.count < 0) {
                const inventory_item = bot.inventory.findInventoryItem(
                    mcData.items[delta_item.id].name,
                    null
                );
                if (!inventory_item) {
                    message += ` ${-delta_item.count} more ${mcData.items[delta_item.id].name
                        }, `;
                } else {
                    if (inventory_item.count < -delta_item.count) {
                        message += `${-delta_item.count - inventory_item.count
                            } more ${mcData.items[delta_item.id].name}`;
                    }
                }
            }
        }
        output.push(`I cannot make ${name} because I need: ${message}`);
    }
    return output;
}