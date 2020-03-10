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

export enum EnergyState {
    UNKNOWN,
    CRITICAL,
    LOW,
    NORMAL,
    EXCESS
}

export const EnergyStateString: { [key in EnergyState]: string } = {
    0: "UNKNOWN",
    1: "CRITICAL",
    2: "LOW",
    3: "NORMAL",
    4: "EXCESS"
}

export enum RoomClass {
    SQUARE = "square",
    SNAKE = "snake",
    PRAISE = "praise",
    REMOTE = "remote"
}


export const BUNKER_VALID_MAX: number = 20;
export const PLAN_SEGMENT: number = 1;
export const MAX_PLAN_SEGMENTS: number = 4;
export const BUNKER_RADIUS: number = 5;
