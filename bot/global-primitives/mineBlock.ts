import mcDataImport from "minecraft-data";
import type { Bot } from "mineflayer";

const mcData = mcDataImport("1.19");

// Mine 3 cobblestone: mineBlock(bot, "stone", 3);
export async function mineBlock(bot: Bot, name: string, count = 1) {
  const output: string[] = [];
  let _mineBlockFailCount = 0;

  // return if name is not string
  if (typeof name !== "string") {
    output.push(`name for mineBlock must be a string`);
    return { success: false, output };
  }
  if (typeof count !== "number") {
    output.push(`count for mineBlock must be a number`);
    return { success: false, output };
  }
  const blockByName = mcData.blocksByName[name];
  if (!blockByName) {
    output.push(`No block named ${name}`);
    return { success: false, output };
  }
  const blocks = await bot.findBlocks({
    matching: [blockByName.id],
    maxDistance: 32,
    count: 1024,
  });
  if (blocks.length === 0) {
    output.push(`No ${name} nearby, please explore first`);
    _mineBlockFailCount++;
    if (_mineBlockFailCount > 10) {
      output.push(
        "mineBlock failed too many times, make sure you explore before calling mineBlock",
      );
      return { success: false, output };
    }
    return { output, success: false };
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

  return { output, success: true };
}