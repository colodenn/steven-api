import { Bot } from "mineflayer";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
    getSkillOrPrimitiveFilePath,
    getSkillOrPrimitivePath,
    getSkillFilePath,
} from "./constants";

// Module cache to track loaded skills and allow cleanup
// Using stable URLs without cache busting to allow proper GC
const skillModuleCache = new Map<string, { module: any; timestamp: number; lastAccess: number }>();
const MAX_CACHE_AGE_MS = 60 * 1000; // 60 seconds - modules are reused for 1 minute
const MAX_CACHE_SIZE = 10; // Maximum number of cached modules
const MAX_IDLE_TIME_MS = 30 * 1000; // Clear modules not accessed for 30 seconds

/**
 * Clean up old modules from cache to prevent memory leaks
 * This is called periodically and before each import
 */
const cleanupModuleCache = () => {
    const now = Date.now();
    const entriesToDelete: string[] = [];

    for (const [key, value] of skillModuleCache.entries()) {
        // Remove if too old or idle too long
        const age = now - value.timestamp;
        const idle = now - value.lastAccess;

        if (age > MAX_CACHE_AGE_MS || idle > MAX_IDLE_TIME_MS) {
            entriesToDelete.push(key);
        }
    }

    for (const key of entriesToDelete) {
        skillModuleCache.delete(key);
    }

    // If cache is still too large, remove least recently used entries
    if (skillModuleCache.size > MAX_CACHE_SIZE) {
        const sortedEntries = Array.from(skillModuleCache.entries())
            .sort((a, b) => a[1].lastAccess - b[1].lastAccess);

        const toRemove = sortedEntries.slice(0, skillModuleCache.size - MAX_CACHE_SIZE);
        for (const [key] of toRemove) {
            skillModuleCache.delete(key);
        }
    }
};

/**
 * Clear skill cache for a specific bot
 * This is called when a bot is stopped or when memory is high
 */
export const clearSkillCacheForBot = (botId: string) => {
    const keysToDelete: string[] = [];
    for (const key of skillModuleCache.keys()) {
        if (key.startsWith(`${botId}:`)) {
            keysToDelete.push(key);
        }
    }
    for (const key of keysToDelete) {
        skillModuleCache.delete(key);
    }
    console.log(`[Tools] Cleared skill cache for bot ${botId} (${keysToDelete.length} entries)`);

    // Force cleanup after clearing bot-specific cache
    cleanupModuleCache();
};

/**
 * Clear all skill caches - used for aggressive memory cleanup
 */
export const clearAllSkillCaches = () => {
    const count = skillModuleCache.size;
    skillModuleCache.clear();
    console.log(`[Tools] Cleared all skill caches (${count} entries)`);
};

/**
 * Create a skill or a primitive.
 * 
 * @param botId - The ID of the bot.
 * @param name - The name of the skill or primitive (with or without .ts extension).
 * @param code - The code of the skill or primitive.
 * @param type - The type of the skill or primitive.
 * 
 * @returns The result of the tool call.
 */
export const createSkill = async (botId: string, name: string, code: string) => {
    // Remove .ts extension if present to avoid double extensions
    const cleanName = name.replace(/\.ts$/, '');
    const filePath = getSkillFilePath(botId, cleanName);
    writeFileSync(filePath, code, 'utf-8');
    return { success: true, data: `Skill ${cleanName} created successfully`, error: null };
}

/**
 * Get all skills or primitives.
 * 
 * @param botId - The ID of the bot.
 * @param type - The type of the skills or primitives.
 * 
 * @returns The result of the tool call.
 */
export const getSkillsOrPrimitives = async (botId: string, type: 'skill' | 'primitive') => {
    const path = getSkillOrPrimitivePath(botId, type);
    const files = readdirSync(path);
    return { success: true, data: files.map(file => file.replace('.ts', '')), error: null };
}

/**
 * Get the code of a skill or primitive.
 * 
 * @param botId - The ID of the bot.
 * @param name - The name of the skill or primitive (with or without .ts extension).
 * @param type - The type of the skill or primitive.
 * 
 * @returns The code of the skill or primitive.
 */
export const getSkillOrPrimitiveCode = async (botId: string, name: string, type: 'skill' | 'primitive') => {
    const path = getSkillOrPrimitiveFilePath(botId, name, type);
    return { success: true, data: readFileSync(path, 'utf-8'), error: null };
}

export const callSkill = async (botId: string, bot: Bot, skillName: string) => {
    if (!bot) {
        throw new Error('Bot instance is undefined in callSkill');
    }

    // Remove .ts extension if present to avoid double extensions
    const cleanName = skillName.replace(/\.ts$/, '');
    const filePath = getSkillFilePath(botId, cleanName);
    const fileURL = pathToFileURL(filePath).href;

    // Always clean up old cache entries before importing
    cleanupModuleCache();

    const now = Date.now();
    const cacheKey = `${botId}:${cleanName}`;
    let skillModule: any;

    // Check cache first
    const cached = skillModuleCache.get(cacheKey);
    if (cached && (now - cached.timestamp) < MAX_CACHE_AGE_MS) {
        // Update last access time
        cached.lastAccess = now;
        skillModule = cached.module;
    } else {
        // Import fresh module using stable URL (no cache busting)
        // This allows the module to be properly garbage collected when removed from cache
        try {
            // Clear the module from require cache if it exists (for CommonJS compatibility)
            if (typeof require !== 'undefined' && require.cache) {
                for (const key in require.cache) {
                    if (key.includes(filePath)) {
                        delete require.cache[key];
                    }
                }
            }

            // Use stable URL without cache busting - this is key for proper GC
            // The module will be reused from ESM cache, but we control when to clear it
            skillModule = await import(fileURL);

            // Update or add to cache
            if (skillModuleCache.size >= MAX_CACHE_SIZE) {
                // Remove oldest entry before adding new one
                cleanupModuleCache();
            }

            skillModuleCache.set(cacheKey, {
                module: skillModule,
                timestamp: now,
                lastAccess: now,
            });
        } catch (error) {
            console.error(`[Tools] Failed to import skill ${cleanName}:`, error);
            throw error;
        }
    }

    if (!skillModule[cleanName]) {
        throw new Error(`Skill function "${cleanName}" not found in module`);
    }

    const result = await skillModule[cleanName](bot);

    // Don't null the module reference here - it's in the cache and will be cleaned up by cleanupModuleCache
    // Setting it to null would prevent the cache from working

    return { success: result.success, data: result.output, error: null };
}