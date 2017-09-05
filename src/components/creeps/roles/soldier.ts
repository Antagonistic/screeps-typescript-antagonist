import * as creepActions from "../creepActions";

import * as CreepManager from "../creepManager";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {
  let action: boolean = false;

  action = creepActions.actionRecycle(creep, action);

  action = creepActions.actionMoveToRoom(creep, action);

  action = creepActions.actionAttackHostile(creep, action);

  action = creepActions.actionHealFriendly(creep, action);
}

export function getBody(subrole: string): string[] | null {
  switch (subrole) {
    case "archer":
      return [RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, RANGED_ATTACK, MOVE, MOVE, MOVE, MOVE];
    case "healer":
      return [MOVE, MOVE, MOVE, HEAL, HEAL, HEAL];
    case "brawler":
      return [ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE, ATTACK, MOVE];
    case "siege":
      return [TOUGH, MOVE, TOUGH, MOVE, TOUGH, MOVE, ATTACK, MOVE, ATTACK, MOVE, MOVE, HEAL];
  }
  return null;
}

export function build(room: Room, spawn: Spawn, subrole: string,
                      spawnAction: boolean): boolean {
  if (spawnAction === false) {
    return CreepManager.createCreep(spawn, getBody(subrole), "soldier", {subrole}, room);
  }
  return spawnAction;
}
