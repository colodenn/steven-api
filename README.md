To install dependencies:
```sh
bun install
# or
npm install
```

To run:
```sh
# Standard (4GB heap)
npm run dev

# Large heap (8GB) - for multiple bots
npm run dev:large

# Or with Bun (heap size managed by Bun)
bun run dev
```

**Note**: The heap size is set to 4GB by default (8GB with `dev:large`). If you see warnings about small heap size, make sure you're running with `npm run dev` rather than directly with `bun` or `tsx`, as NODE_OPTIONS may not be applied correctly.

open http://localhost:9999
