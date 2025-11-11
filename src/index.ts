import { Context, Next, Hono, MiddlewareHandler } from 'hono'
import { cors } from 'hono/cors'
import { createMiddleware } from 'hono/factory'
import { Bot } from 'mineflayer'
import { randomInt, randomUUID } from 'node:crypto'
import { createMinecraftBot } from '@/bot/bot'
import { uniqueNamesGenerator, Config, names } from 'unique-names-generator';
import { getDetailedStatus, getSurroundingBlocks, prefillWithPrimitives } from '@/bot/utils';
import { callSkill, createSkillOrPrimitive, getSkillOrPrimitiveCode, getSkillsOrPrimitives } from '@/bot/tools'
import { getSkillsPath, getPrimitivesPath } from '@/bot/constants'
import { mkdir } from "node:fs/promises";


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

  if (!botId) {
    return c.json({
      success: false,
      data: null,
      error: 'Bot ID is required',
    }, 400)
  }

  const bot = bots.get(botId)

  if (!bot) {
    return c.json({
      success: false,
      data: null,
      error: 'Bot not found',
    }, 404)
  }

  c.set('bot', bot)
  await next()
})

/**
 * This is the health check endpoint.
 */
app.get('/', (c) => {
  return c.text('OK')
})

/**
 * This returns the status of the bot. Inventory, health, time, and nearby blocks.
 * 
 * @param c Context
 * 
 * @returns Returns a JSON response with the status of the bot.
 */
app.get('/status/:id', checkBotExists, (c) => {
  const bot = c.get('bot')

  const status = getDetailedStatus(bot)

  return c.json({
    success: true,
    data: status,
    error: null,
  }, 200)
})

/**
 * This returns the surrounding blocks of the bot.
 * 
 * @param c Context
 * 
 * @returns Returns a JSON response with the surrounding blocks of the bot.
 */
app.get('/surroundingBlocks/:id', checkBotExists, (c) => {
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
app.get('/start', async (c) => {
  const botId = randomUUID()
  const viewerPort = randomInt(10000, 65535)

  const config: Config = {
    dictionaries: [names],
  }

  const characterName: string = uniqueNamesGenerator(config);
  const bot = createMinecraftBot({
    username: characterName,
    host: "localhost",
    port: 25565,
    version: process.env.MINECRAFT_VERSION!,
    viewerPort,
  })

  bots.set(botId, bot)
  viewers.set(botId, viewerPort)

  await mkdir(getSkillsPath(botId), { recursive: true })
  await mkdir(getPrimitivesPath(botId), { recursive: true })

  await prefillWithPrimitives(botId)

  return c.json({
    success: true,
    data: {
      id: botId,
      status: 'started',
      viewerPort: viewerPort,
    },
    error: null,
  }, 200)
})

/**
 * This stops a bot.
 * 
 * @param c Context
 * 
 * @returns Returns a JSON response with the bot ID and status.
 */
app.get('/stop/:id', checkBotExists, async (c) => {
  const botId = c.req.param('id')
  const bot = c.get('bot')

  await bot.quit()
  bots.delete(botId)
  viewers.delete(botId)

  return c.json({
    success: true,
    data: {
      id: botId,
      status: 'stopped',
    },
    error: null,
  }, 200)
})

/**
 * This returns the viewer port for the bot.
 * 
 * @param c Context
 * 
 * @returns Returns a JSON response with the viewer port.
 */
app.get('/viewer/:id', checkBotExists, (c) => {
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
app.post('/tool-call/:id', checkBotExists, async (c) => {
  const { toolArgs, toolName } = await c.req.json()
  const botId = c.req.param('id')
  const bot = c.get('bot')

  const toolHandlers: Record<string, () => Promise<any>> = {
    'create_skill_or_primitive': () => createSkillOrPrimitive(botId, toolArgs.name, toolArgs.code, toolArgs.type),
    'get_skills_or_primitives': () => getSkillsOrPrimitives(botId, toolArgs.type),
    'get_skill_or_primitive_code': () => getSkillOrPrimitiveCode(botId, toolArgs.name, toolArgs.type),
    'call_skill': () => callSkill(botId, bot, toolArgs.name),
  }

  const handler = toolHandlers[toolName]

  if (!handler) {
    return c.json({
      success: false,
      data: null,
      error: `Unknown tool: ${toolName}`,
    }, 400)
  }

  try {
    const result = await handler()
    return c.json({
      success: true,
      data: result,
      error: null,
    }, 200)
  } catch (error) {
    return c.json({
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500)
  }
})


export default {
  port: 9999,
  fetch: app.fetch,
}
