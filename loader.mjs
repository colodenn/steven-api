// Register path aliases for Node.js ESM
import { register } from 'tsconfig-paths';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read tsconfig.json
const tsconfigPath = resolve(__dirname, 'tsconfig.json');
const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));

const baseUrl = resolve(__dirname, tsconfig.compilerOptions.baseUrl || '.');

// Register path aliases
register({
  baseUrl,
  paths: tsconfig.compilerOptions.paths || {},
});

