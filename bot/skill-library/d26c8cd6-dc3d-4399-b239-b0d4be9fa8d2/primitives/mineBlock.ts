import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";

const mcData = mcDataImport("1.21.8");

// This is helper function which cant be used directly.
export async function mineBlock(bot: Bot, name: string, count = 1) {
  const output: string[] = [];
  let _mineBlockFailCount = 0;

  // return if name is not string
  if (typeof name !== "string") {
    throw new Error(`name for mineBlock must be a string`);
  }
  if (typeof count !== "number") {
    throw new Error(`count for mineBlock must be a number`);
  }
  const blockByName = mcData.blocksByName[name];
  if (!blockByName) {
    throw new Error(`No block named ${ name } `);
  }
  const blocks = await bot.findBlocks({
    matching: [blockByName.id],
    maxDistance: 32,
    count: 1024,
  });
  if (blocks.length === 0) {
    output.push(`No ${ name } nearby, please explore first`);
    _mineBlockFailCount++;
    if (_mineBlockFailCount > 10) {
      throw new Error(
        "mineBlock failed too many times, make sure you explore before calling mineBlock",
      );
    }
    return output;
  }
  const targets = [];
  for (let i = 0; i < Math.min(count, blocks.length); i++) {
    const position = blocks[i];
    if (position) {
      const block = bot.blockAt(position);
      if (block) {
        targets.push(block);
      }
    }
  }

  await bot.collectBlock.collect(targets, {
    ignoreNoPath: true,
    count: count,
  });

  return output;
}