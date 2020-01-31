import { LogLevels } from "lib/logger/logLevels";

export const homeSpawnName: string = "Antagonist";

/**
 * Enable this if you want a lot of text to be logged to console.
 * @type {boolean}
 */
export const ENABLE_DEBUG_MODE: boolean = true;

/**
 * Enable this to enable screeps profiler
 */
export const USE_PROFILER: boolean = true;

/**
 * Minimum number of ticksToLive for a Creep before they go to renew.
 * @type {number}
 */
export const DEFAULT_MIN_LIFE_BEFORE_NEEDS_REFILL: number = 500;
export const DEFAULT_MAX_LIFE_WHILE_NEEDS_REFILL: number = 1400;


export const ROAD_COST = 3;
export const PLAIN_COST = 4;
export const SWAMP_COST = 5;
export const AVOID_COST = 7;

export enum TargetAction {
    MOVETO = "moveto",
    PRAISE = "praise",
    SIGN = "sign",
    BUILD = "build",
    REPAIR = "repair",
    MINE = "mine",
    PICKUP = "pickup",
    WITHDRAW = "withdraw",
    WITHDRAWENERGY = "withdrawenergy",
    DEPOSIT = "deposit",
    DEPOSITENERGY = "depositenergy",
    HEAL = "heal",
    ATTACK = "attack",
    ATTACK_RANGED = "attackranged",
    DISMANTLE = "dismantle"
}

/**
 * Debug level for log output
 */
export const LOG_LEVEL: number = LogLevels.DEBUG;

/**
 * Prepend log output with current tick number.
 */
export const LOG_PRINT_TICK: boolean = true;

/**
 * Prepend log output with source line.
 */
export const LOG_PRINT_LINES: boolean = true;

/**
 * Load source maps and resolve source lines back to typeascript.
 */
export const LOG_LOAD_SOURCE_MAP: boolean = true;

/**
 * Maximum padding for source links (for aligning log output).
 */
export const LOG_MAX_PAD: number = 100;

/**
 * VSC location, used to create links back to source.
 * Repo and revision are filled in at build time for git repositories.
 */
export const LOG_VSC = { repo: "@@_repo_@@", revision: "@@_revision_@@", valid: false };
// export const LOG_VSC = { repo: "@@_repo_@@", revision: __REVISION__, valid: false };

/**
 * URL template for VSC links, this one works for github and gitlab.
 */
export const LOG_VSC_URL_TEMPLATE = (path: string, line: string) => {
    return `${LOG_VSC.repo}/blob/${LOG_VSC.revision}/${path}#${line}`;
};
