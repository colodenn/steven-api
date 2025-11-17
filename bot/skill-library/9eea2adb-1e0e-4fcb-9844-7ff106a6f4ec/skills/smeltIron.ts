import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";
import mineflayerPathfinder from "mineflayer-pathfinder";

const mcData = mcDataImport("1.19");
const { goals: { GoalLookAtBlock } } = mineflayerPathfinder;

export async function smeltIron(bot: Bot) {
  const output: string[] = [];

  const furnaceBlock = bot.findBlock({
    matching: mcData.blocksByName.furnace.id,
    maxDistance: 32,
  });

  if (!furnaceBlock) {
    output.push("No furnace nearby");
    return { output, success: false };
  }

  await bot.pathfinder.goto(new GoalLookAtBlock(furnaceBlock.position, bot.world, {} as any));

  const furnace = await bot.openFurnace(furnaceBlock);

  const rawIronId = mcData.itemsByName.raw_iron.id;
  const coalId = mcData.itemsByName.coal.id;

  const rawIron = bot.inventory.findInventoryItem(rawIronId, null, false);
  const coal = bot.inventory.findInventoryItem(coalId, null, false);

  if (!rawIron) {
    output.push("No raw iron to smelt.");
    furnace.close();
    return { output, success: false };
  }

  if (!coal) {
    output.push("No coal for fuel.");
    furnace.close();
    return { output, success: false };
  }

  await furnace.putFuel(coal.type, null, 1);
  await furnace.putInput(rawIron.type, null, 1);
  await bot.waitForTicks(12 * 20); // Wait for smelting

  if (furnace.outputItem()) {
    await furnace.takeOutput();
    output.push("Smelted 1 raw iron into iron ingot.");
  } else {
    output.push("Smelting failed.");
  }

  furnace.close();
  return { output, success: true };
}