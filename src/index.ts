// Register path aliases for Node.js
import '../loader.mjs'

import { Context, Next, Hono, MiddlewareHandler } from 'hono'
import { serve } from '@hono/node-server'
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import { Bot } from 'mineflayer'
import { randomInt, randomUUID } from 'node:crypto'
import { createMinecraftBot, type MinecraftBotManager } from '@/bot/bot'
import { uniqueNamesGenerator, Config, names } from 'unique-names-generator';
import { getDetailedStatus, getSurroundingBlocks, prefillWithPrimitives } from '@/bot/utils';
import { callSkill, createSkill, getSkillOrPrimitiveCode, getSkillsOrPrimitives, clearSkillCacheForBot, clearAllSkillCaches } from '@/bot/tools'
import { getSkillsPath, getPrimitivesPath } from '@/bot/constants'
import { mkdir } from "node:fs/promises";
import { fetchPlayerInventory } from '@/rcon'


type Variables = {
  bot: Bot
}

type Env = {
  Variables: Variables
  Bindings: {}
}

const app = new Hono<Env>()

app.use('/*', cors({
  origin: 'http://localhost:3000',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}))

const bots = new Map<string, Bot>()
const viewers = new Map<string, number>()
const usernames = new Map<string, string>()
const botManagers = new Map<string, MinecraftBotManager>()

// Memory monitoring
const logMemoryUsage = () => {
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    const mb = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100
    const heapUsagePercent = Math.round((usage.heapUsed / usage.heapTotal) * 100)
    console.log(`[Memory] Heap: ${mb(usage.heapUsed)}/${mb(usage.heapTotal)} MB (${heapUsagePercent}%), RSS: ${mb(usage.rss)} MB`)

    // Warn if memory usage is high
    if (heapUsagePercent > 80) {
      console.warn(`[Memory] WARNING: Heap usage is at ${heapUsagePercent}%!`)

      // If heap is very small (< 100MB), warn about potential need to increase heap size
      if (usage.heapTotal < 100 * 1024 * 1024) {
        console.warn(`[Memory] Heap size is very small (${mb(usage.heapTotal)} MB). Consider increasing with NODE_OPTIONS='--max-old-space-size=2048' or higher.`)
      }
    }
  }
}

// Log memory usage every 2 minutes (more frequent)
if (typeof setInterval !== 'undefined') {
  setInterval(logMemoryUsage, 2 * 60 * 1000)

  // Force garbage collection if available (requires --expose-gc flag)
  if (typeof global !== 'undefined' && (global as any).gc) {
    setInterval(() => {
      const usage = process.memoryUsage()
      const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100
      if (heapUsagePercent > 60) {
        console.log('[Memory] Forcing garbage collection (heap at ' + Math.round(heapUsagePercent) + '%)...')
        try {
          (global as any).gc()
          logMemoryUsage()
        } catch (error) {
          // GC not available or failed
        }
      }
    }, 2 * 60 * 1000) // Every 2 minutes if memory is above 60%
  }

  // Aggressive cleanup: clear skill cache periodically
  setInterval(() => {
    const usage = process.memoryUsage()
    const heapUsagePercent = (usage.heapUsed / usage.heapTotal) * 100
    if (heapUsagePercent > 75) {
      console.warn('[Memory] High memory usage detected, clearing skill cache...')
      // Clear all skill caches - they'll be reloaded when needed
      clearAllSkillCaches()
      logMemoryUsage()
    }
  }, 3 * 60 * 1000) // Every 3 minutes if memory is above 75%
}

/**
 * This is a middleware to check if the bot exists.
 * 
 * @param c Context
 * @param next Next function
 * 
 * @returns Returns a JSON response with the bot not found error if the bot is not found.
 */
const checkBotExists: MiddlewareHandler<Env> = createMiddleware(async (c, next) => {
  const botId = c.req.param('id')
  const method = c.req.method
  const path = c.req.path

  console.log(`[API] ${method} ${path} - Bot ID: ${botId}`)

  if (!botId) {
    console.warn(`[API] ${method} ${path} - Missing bot ID`)
    return c.json({
      success: false,
      data: null,
      error: 'Bot ID is required',
    }, 400)
  }

  const bot = bots.get(botId)

  if (!bot) {
    console.warn(`[API] ${method} ${path} - Bot not found: ${botId}`)
    return c.json({
      success: false,
      data: null,
      error: 'Bot not found',
    }, 404)
  }

  // Check if bot is still connected
  if (bot.entity === null || bot.entity === undefined) {
    console.warn(`[API] ${method} ${path} - Bot not connected: ${botId}`)
    return c.json({
      success: false,
      data: null,
      error: 'Bot is not connected to the server',
    }, 503)
  }

  c.set('bot', bot)
  await next()
})

/**
 * This is the health check endpoint.
 */
app.get('/', (c: Context<Env>) => {
  return c.text('OK')
})

/**
 * This returns the status of the bot. Inventory, health, time, and nearby blocks.
 * 
 * @param c Context
 * 
 * @returns Returns a JSON response with the status of the bot.
 */
app.get('/status/:id', checkBotExists, (c: Context<Env>) => {
  const botId = c.req.param('id')
  const bot = c.get('bot')

  try {
    const status = getDetailedStatus(bot)
    console.log(`[API] GET /status/${botId} - Status retrieved successfully`)
    return c.json({
      success: true,
      data: status,
      error: null,
    }, 200)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[API] GET /status/${botId} - Failed to get status:`, errorMessage, error)
    return c.json({
      success: false,
      data: null,
      error: errorMessage,
    }, 500)
  }
})

/**
 * This returns the surrounding blocks of the bot.
 * 
 * @param c Context
 * 
 * @returns Returns a JSON response with the surrounding blocks of the bot.
 */
app.get('/surroundingBlocks/:id', checkBotExists, (c: Context<Env>) => {
  const bot = c.get('bot')

  const surroundingBlocks = getSurroundingBlocks(bot, 16, 16, 16)

  return c.json({
    success: true,
    data: surroundingBlocks,
    error: null,
  }, 200)
})

/**
 * This starts a new bot.
 * 
 * @param c Context
 * 
 * @returns Returns a JSON response with the bot ID and status.
 */
app.get('/start', async (c: Context<Env>) => {
  const botId = randomUUID()
  const viewerPort = randomInt(10000, 65535)

  console.log(`[API] GET /start - Starting new bot: ${botId}`)

  const config: Config = {
    dictionaries: [names],
  }

  const characterName: string = uniqueNamesGenerator(config);

  try {
    const manager = createMinecraftBot({
      username: characterName,
      host: "localhost",
      port: 25565,
      version: process.env.MINECRAFT_VERSION!,
      viewerPort,
    }, (newBot: Bot) => {
      bots.set(botId, newBot)
      console.log(`[API] Bot ${botId} (${characterName}) connected and ready`)
    })

    bots.set(botId, manager.getBot())
    viewers.set(botId, viewerPort)
    usernames.set(botId, characterName)
    botManagers.set(botId, manager)

    await mkdir(getSkillsPath(botId), { recursive: true })
    await mkdir(getPrimitivesPath(botId), { recursive: true })

    await prefillWithPrimitives(botId)

    console.log(`[API] GET /start - Bot ${botId} started successfully`)
    return c.json({
      success: true,
      data: {
        id: botId,
        status: 'started',
        viewerPort: viewerPort,
        username: characterName,
      },
      error: null,
    }, 200)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[API] GET /start - Failed to start bot ${botId}:`, errorMessage, error)
    return c.json({
      success: false,
      data: null,
      error: errorMessage,
    }, 500)
  }
})

/**
 * This stops a bot.
 * 
 * @param c Context
 * 
 * @returns Returns a JSON response with the bot ID and status.
 */
app.get('/stop/:id', checkBotExists, async (c: Context<Env>) => {
  const botId = c.req.param('id')
  console.log(`[API] GET /stop/${botId} - Stopping bot`)
  logMemoryUsage() // Log memory before cleanup

  const manager = botManagers.get(botId)

  try {
    if (manager) {
      await manager.stop()
    }

    // Clear skill cache for this bot to free memory
    clearSkillCacheForBot(botId)

    bots.delete(botId)
    viewers.delete(botId)
    usernames.delete(botId)
    botManagers.delete(botId)

    logMemoryUsage() // Log memory after cleanup
    console.log(`[API] GET /stop/${botId} - Bot stopped successfully`)
    return c.json({
      success: true,
      data: {
        id: botId,
        status: 'stopped',
      },
      error: null,
    }, 200)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[API] GET /stop/${botId} - Failed to stop bot:`, errorMessage, error)
    return c.json({
      success: false,
      data: null,
      error: errorMessage,
    }, 500)
  }
})

/**
 * This returns the viewer port for the bot.
 * 
 * @param c Context
 * 
 * @returns Returns a JSON response with the viewer port.
 */
app.get('/viewer/:id', checkBotExists, (c: Context<Env>) => {
  const viewerPort = viewers.get(c.req.param('id'))

  if (!viewerPort) {
    return c.json({
      success: false,
      data: null,
      error: 'Viewer port not found',
    }, 404)
  }
  return c.redirect(`http://localhost:${viewerPort}`)
})

/**
 * This endpoint allows tool calling.
 * 
 * @param c Context
 * 
 * @returns Returns a JSON response with the tool call result.
 */
app.post('/tool-call/:id', checkBotExists, async (c: Context<Env>) => {
  const botId = c.req.param('id')
  const bot = c.get('bot')

  let toolArgs: any
  let toolName: string

  try {
    const body = await c.req.json()
    toolArgs = body.toolArgs
    toolName = body.toolName
  } catch (error) {
    console.error(`[API] POST /tool-call/${botId} - Failed to parse request body:`, error)
    return c.json({
      success: false,
      data: null,
      error: 'Invalid request body',
    }, 400)
  }

  console.log(`[API] POST /tool-call/${botId} - Tool: ${toolName}`, { toolArgs })

  const toolHandlers: Record<string, () => Promise<any>> = {
    'create_skill': () => createSkill(botId, toolArgs.name, toolArgs.code),
    'get_skills_or_primitives': () => getSkillsOrPrimitives(botId, toolArgs.type),
    'get_skill_or_primitive_code': () => getSkillOrPrimitiveCode(botId, toolArgs.name, toolArgs.type),
    'call_skill': () => callSkill(botId, bot, toolArgs.name),
  }

  const handler = toolHandlers[toolName]

  if (!handler) {
    console.warn(`[API] POST /tool-call/${botId} - Unknown tool: ${toolName}`)
    return c.json({
      success: false,
      data: null,
      error: `Unknown tool: ${toolName}`,
    }, 400)
  }

  const startTime = Date.now()
  try {
    const result = await handler()
    const duration = Date.now() - startTime
    console.log(`[API] POST /tool-call/${botId} - Tool ${toolName} completed in ${duration}ms`, { success: result.success })

    if (!result.success) {
      return c.json({
        success: false,
        data: result.data,
        error: null,
      }, 500)
    }
    return c.json({
      success: true,
      data: result.data,
      error: null,
    }, 200)
  } catch (error) {
    const duration = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[API] POST /tool-call/${botId} - Tool ${toolName} failed after ${duration}ms:`, errorMessage, error)
    return c.json({
      success: false,
      data: null,
      error: errorMessage,
    }, 500)
  }
})

/** Fetch the inventory of the player. */
app.get('/inventory/:id', checkBotExists, async (c: Context<Env>) => {
  const botId = c.req.param('id')

  console.log(`[API] GET /inventory/${botId} - Fetching inventory`)

  const config = { host: '127.0.0.1', port: 25575, password: '123qwe!!' };
  const player = usernames.get(botId);

  if (!player) {
    console.warn(`[API] GET /inventory/${botId} - Player username not found`)
    return c.json({
      success: false,
      data: null,
      error: `Player with username ${player} not found`,
    }, 404)
  }

  try {
    const inventoryRaw = await fetchPlayerInventory(config, player);
    console.log(`[API] GET /inventory/${botId} - Inventory fetched successfully`)
    return c.json({
      success: true,
      data: inventoryRaw,
      error: null,
    }, 200)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[API] GET /inventory/${botId} - Failed to fetch inventory:`, errorMessage, error)
    return c.json({
      success: false,
      data: null,
      error: errorMessage,
    }, 500)
  }
})


const port = Number(process.env.PORT ?? 9999)

if (import.meta.main) {
  // Log initial memory state and verify heap size
  if (typeof process !== 'undefined' && process.memoryUsage) {
    const usage = process.memoryUsage()
    const mb = (bytes: number) => Math.round(bytes / 1024 / 1024 * 100) / 100
    const heapTotalMB = mb(usage.heapTotal)

    console.log(`[Memory] Initial heap size: ${heapTotalMB} MB`)

    // Warn if heap is suspiciously small (likely NODE_OPTIONS not applied)
    if (heapTotalMB < 200) {
      console.warn(`[Memory] WARNING: Heap size is very small (${heapTotalMB} MB).`)
      console.warn(`[Memory] This suggests NODE_OPTIONS='--max-old-space-size=4096' may not be applied.`)
      console.warn(`[Memory] Make sure you're running with: npm run dev or NODE_OPTIONS='--max-old-space-size=4096 --expose-gc' tsx src/index.ts`)
    } else {
      console.log(`[Memory] Heap size looks good (${heapTotalMB} MB)`)
    }
  }

  serve({
    fetch: app.fetch,
    port,
  })

  console.log(`[server] Listening on http://localhost:${port}`)
}

export default {
  port,
  fetch: app.fetch,
}
