import { Bot } from "mineflayer";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import {
    getSkillOrPrimitiveFilePath,
    getSkillOrPrimitivePath,
    getSkillFilePath
} from "./constants";

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
export const createSkillOrPrimitive = async (botId: string, name: string, code: string, type: 'skill' | 'primitive') => {
    // Remove .ts extension if present to avoid double extensions
    const cleanName = name.replace(/\.ts$/, '');
    const filePath = getSkillOrPrimitiveFilePath(botId, cleanName, type);
    writeFileSync(filePath, code, 'utf-8');
    return `${type === 'skill' ? 'Skill' : 'Primitive'} ${cleanName} created successfully`;
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
    const filePath = getSkillOrPrimitivePath(botId, type);
    const files = readdirSync(filePath);
    return files.map(file => file.replace('.ts', ''));
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
    // Remove .ts extension if present to avoid double extensions
    const cleanName = name.replace(/\.ts$/, '');
    const filePath = getSkillOrPrimitiveFilePath(botId, cleanName, type);
    return readFileSync(filePath, 'utf-8');
}

/**
 * Call a skill.
 * 
 * @param botId - The ID of the bot.
 * @param bot - The bot instance.
 * @param skillName - The name of the skill (with or without .ts extension).
 * 
 * @returns The result of the tool call.
 */
export const callSkill = async (botId: string, bot: Bot, skillName: string) => {
    if (!bot) {
        throw new Error('Bot instance is undefined in callSkill');
    }

    // Remove .ts extension if present to avoid double extensions
    const cleanName = skillName.replace(/\.ts$/, '');
    const filePath = getSkillFilePath(botId, cleanName);

    // Add cache-busting parameter to force fresh import each time
    const fileURL = `${pathToFileURL(filePath).href}?t=${Date.now()}`;

    const skill = await import(fileURL);

    if (!skill[cleanName]) {
        throw new Error(`Skill function "${cleanName}" not found in module`);
    }

    const result = await skill[cleanName](bot);

    return result;
}