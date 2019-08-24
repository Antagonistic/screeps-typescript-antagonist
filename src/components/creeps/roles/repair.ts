import * as creepActions from "../creepActions";

import { SpawnRoom } from "../../rooms/SpawnRoom";
// import * as CreepManager from "../creepManager";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {
  let action: boolean = false;

  action = creepActions.actionRecycle(creep, action);
  if (creepActions.canWork(creep)) {
    action = creepActions.actionMoveToRoom(creep, action);
    if (creep.room.controller && creep.room.controller.ticksToDowngrade < 2000) {
      action = creepActions.actionUpgrade(creep, action);
    }
    action = creepActions.actionRepairCache(creep, action);
    action = creepActions.actionRepairCritical(creep, action);
    // action = creepActions.actionRepair(creep, action, true, 3000000);
    action = creepActions.actionRepair(creep, action, false, 10);
    // action = creepActions.actionRepair(creep, action, true, 300000);
    action = creepActions.actionRepair(creep, action, false, 2);
    action = creepActions.actionBuild(creep, action);
    if (creep.room.controller && creep.room.controller.level >= 3) {
      // action = creepActions.actionRepair(creep, action, true, 3000);
      // action = creepActions.actionRepair(creep, action, true, 300);
      // action = creepActions.actionRepair(creep, action, true, 2);
      action = creepActions.actionRepairWeakestWall(creep, action, 500000);
    }
    action = creepActions.actionUpgrade(creep, action);
  } else {
    action = creepActions.actionGetStorageEnergy(creep, action);
    action = creepActions.actionGetContainerEnergy(creep, action, 2, true);
    if (creep.room.energyCapacityAvailable < 550) {
      action = creepActions.actionGetDroppedEnergy(creep, action);
      action = creepActions.actionGetSourceEnergy(creep, action);
    } else {
      action = creepActions.actionGetDroppedEnergy(creep, action);
    }
    action = creepActions.actionMoveToRoom(creep, action, creep.memory.home);
  }
}

export function getBody(room: Room): BodyPartConstant[] | null {
  if (room.energyCapacityAvailable >= 550) {
    return [MOVE, MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY];
  } else {
    return [MOVE, WORK, WORK, CARRY];
  }
}

export function build(room: Room, spawn: SpawnRoom, creeps: Creep[], State: RoomStates, spawnAction: boolean): boolean {
  if (spawnAction === false) {
    let numReps: number = 0;
    const _reps = _.filter(creeps, (creep) => creep.memory.role === "repair" && creep.memory.room === room.name);
    switch (State) {
      case RoomStates.MINE:
        numReps = 1;
        break;
      case RoomStates.STABLE:
        numReps = 1;
        if (room.controller && room.controller.my && room.controller.level >= 3) {
          const walls: StructureWall[] = room.find<StructureWall>(FIND_STRUCTURES, {
            filter: (x: Structure) =>
              x.structureType === STRUCTURE_WALL
          });
          if (walls.length > 0) {
            numReps = 2;
          }
        }
        break;
    }
    if (_reps.length < numReps) {
      return spawn.createCreep(getBody(spawn.room), "repair", {}, room);
    }
  }
  return spawnAction;
}
