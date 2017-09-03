import * as creepActions from "../creepActions";

import * as CreepManager from "../creepManager";

import RoomStates from "../../state/roomStates";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {

  // if (creepActions.needsRenew(creep)) {
  //  const spawn = creep.room.find<Spawn>(FIND_MY_SPAWNS)[0];
  //  creepActions.moveToRenew(creep, spawn);
  //  return;
  // }

  if (creepActions.canWork(creep)) {
    let action: boolean = false;
    action = creepActions.actionFillEnergy(creep, action);
    if (creep.room.controller && creep.room.controller.ticksToDowngrade < 2000) {
      action = creepActions.actionUpgrade(creep, action);
    }
    action = creepActions.actionRepair(creep, action, false, 8);
    action = creepActions.actionBuild(creep, action);
    action = creepActions.actionUpgrade(creep, action);
  } else {
    let action: boolean = false;
    action = creepActions.actionGetDroppedEnergy(creep, action, true);
    action = creepActions.actionGetContainerEnergy(creep, action, 4);
    action = creepActions.actionGetSourceEnergy(creep, action, 2);
  }
}

export function getBody(room: Room): string[] | null {
  if (room.energyCapacityAvailable >= 500) {
    return [MOVE, MOVE, MOVE, WORK, WORK, CARRY, CARRY, CARRY];
  } else if (room.energyCapacityAvailable >= 400) {
    return [MOVE, MOVE, WORK, WORK, CARRY, CARRY];
  }
  return [WORK, WORK, CARRY, MOVE];
}

export function build(spawn: Spawn, creeps: Creep[], State: RoomStates, spawnAction: boolean): boolean {
  if (spawnAction === false) {
    switch (State) {
      case RoomStates.BOOTSTRAP: {
        const harvesters = _.filter(creeps, (creep) => creep.memory.role === "harvester");
        if (harvesters.length < 7) {
          return CreepManager.createCreep(spawn, getBody(spawn.room), "harvester");
        }
        break;
      }
      case RoomStates.TRANSITION: {
        const harvesters = _.filter(creeps, (creep) => creep.memory.role === "harvester");
        if (harvesters.length < 2) {
          return CreepManager.createCreep(spawn, getBody(spawn.room), "harvester");
        }
        break;
      }
    }
  }
  return spawnAction;
}
