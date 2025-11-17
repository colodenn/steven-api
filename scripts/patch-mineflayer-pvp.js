#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const pvpFile = join(__dirname, '../node_modules/mineflayer-pvp/lib/PVP.js');

try {
  let content = readFileSync(pvpFile, 'utf8');
  
  if (content.includes("this.bot.on('physicTick'")) {
    content = content.replace(
      "this.bot.on('physicTick'",
      "this.bot.on('physicsTick'"
    );
    writeFileSync(pvpFile, content, 'utf8');
    console.log('✓ Patched mineflayer-pvp: changed physicTick to physicsTick');
  } else if (content.includes("this.bot.on('physicsTick'")) {
    console.log('✓ mineflayer-pvp already patched');
  } else {
    console.warn('⚠ Could not find physicTick in mineflayer-pvp');
  }
} catch (error) {
  console.error('✗ Error patching mineflayer-pvp:', error.message);
  process.exit(1);
}

