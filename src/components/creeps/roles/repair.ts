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

  if (creepActions.canWork(creep)) {
    let action: boolean = false;
    action = creepActions.actionRepairCache(creep, action);
    action = creepActions.actionRepair(creep, action, false, 10);
    action = creepActions.actionRepair(creep, action, true, 300000);
    action = creepActions.actionRepair(creep, action, false, 2);
    if (creep.room.controller && creep.room.controller.level >= 3) {
      action = creepActions.actionRepair(creep, action, true, 3000);
      action = creepActions.actionRepair(creep, action, true, 300);
      action = creepActions.actionRepair(creep, action, true, 2);
    }
  } else {
    creepActions.getAnyEnergy(creep);
  }
}

export function getBody(room: Room): string[] | null {
  if (room.energyCapacityAvailable >= 550) {
    return [MOVE, MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY];
  } else {
    return [MOVE, WORK, WORK, CARRY];
  }
}

export function build(room: Room, spawn: Spawn, creeps: Creep[], State: RoomStates, spawnAction: boolean): boolean {
  if (spawnAction === false) {
    switch (State) {
      case RoomStates.STABLE:
        const _reps = _.filter(creeps, (creep) => creep.memory.role === "repair");
        let numReps = 1;
        if (room.controller && room.controller.my && room.controller.level >= 3) {
          const walls: StructureWall[] = room.find(FIND_STRUCTURES, {filter: (x: Structure) =>
            x.structureType === STRUCTURE_WALL});
          if (walls.length > 0) {
            numReps = 3;
          }
        }
        if (_reps.length < numReps) {
          return CreepManager.createCreep(spawn, getBody(room), "repair");
        }
        break;
    }
  }
  return spawnAction;
}
