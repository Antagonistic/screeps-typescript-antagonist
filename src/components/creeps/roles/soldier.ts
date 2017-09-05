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

  action = creepActions.actionAttackHostile(creep, action);

  action = creepActions.actionHealFriendly(creep, action);

  if (!creep.memory.squad || !Memory.squads || !Memory.squads[creep.memory.squad]) {
    action = creepActions.actionMoveToRoom(creep, action);
    // console.log(creep.memory.squad);
  } else {
    action = creepActions.actionMoveToRoom(creep, action, Memory.squads[creep.memory.squad].assignedRoom);
    // console.log(Memory.squads[creep.memory.squad].assignedRoom);
  }

  action = creepActions.actionRenew(creep, action, 1200);

  action = creepActions.actionRally(creep, action);
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

export function build(room: Room, spawn: Spawn, subrole: string, squad: string,
                      spawnAction: boolean): boolean {
  if (spawnAction === false) {
    if (!squad) {
      squad = "null";
    }
    return CreepManager.createCreep(spawn, getBody(subrole), "soldier",
     {subrole, squad}, room, squad + " - " + subrole);
  }
  return spawnAction;
}
