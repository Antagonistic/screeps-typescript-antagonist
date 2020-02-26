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

