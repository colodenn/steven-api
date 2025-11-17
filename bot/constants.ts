import { join } from "node:path";

/**
 * Base paths
 */
export const BOT_DIR = "bot";
export const SKILL_LIBRARY_DIR = "skill-library";
export const GLOBAL_PRIMITIVES_DIR = "global-primitives";
export const SKILLS_DIR = "skills";
export const PRIMITIVES_DIR = "primitives";

/**
 * Get the base bot directory path
 */
export const getBotBasePath = () => join(process.cwd(), BOT_DIR);

/**
 * Get the global primitives directory path
 */
export const getGlobalPrimitivesPath = () =>
    join(process.cwd(), BOT_DIR, GLOBAL_PRIMITIVES_DIR);

/**
 * Get the skill library base path for a specific bot
 */
export const getSkillLibraryPath = (botId: string) =>
    join(process.cwd(), BOT_DIR, SKILL_LIBRARY_DIR, botId);

/**
 * Get the skills directory path for a specific bot
 */
export const getSkillsPath = (botId: string) =>
    join(getSkillLibraryPath(botId), SKILLS_DIR);

/**
 * Get the primitives directory path for a specific bot
 */
export const getPrimitivesPath = (botId: string) =>
    join(process.cwd(), BOT_DIR, GLOBAL_PRIMITIVES_DIR);

/**
 * Get the full path for a specific skill file
 */
export const getSkillFilePath = (botId: string, skillName: string) =>
    join(getSkillsPath(botId), `${skillName}.ts`);

/**
 * Get the full path for a specific primitive file
 */
export const getPrimitiveFilePath = (botId: string, primitiveName: string) =>
    join(getPrimitivesPath(botId), `${primitiveName}.ts`);

/**
 * Get the full path for a global primitive file
 */
export const getGlobalPrimitiveFilePath = (primitiveName: string) =>
    join(getGlobalPrimitivesPath(), primitiveName);

/**
 * Get the path for a skill or primitive based on type
 */
export const getSkillOrPrimitivePath = (botId: string, type: 'skill' | 'primitive') =>
    type === 'skill' ? getSkillsPath(botId) : getPrimitivesPath(botId);

/**
 * Get the file path for a skill or primitive based on type
 */
export const getSkillOrPrimitiveFilePath = (botId: string, name: string, type: 'skill' | 'primitive') =>
    type === 'skill' ? getSkillFilePath(botId, name) : getPrimitiveFilePath(botId, name);

