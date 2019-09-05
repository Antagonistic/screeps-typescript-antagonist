import * as creepActions from "../creepActions";

import { SpawnRoom } from "../../rooms/SpawnRoom";
// import * as CreepManager from "../creepManager";

import * as StructureManager from "../../rooms/structureManager";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {

  let action: boolean = false;
  // action = creepActions.actionRenew(creep, action);

  if (!action && creepActions.canWork(creep)) {
    action = creepActions.actionBuildStill(creep, action);
    action = creepActions.actionUpgrade(creep, action);
  } else {
    action = creepActions.actionGetBatteryEnergy(creep, action, 4);
    // action = creepActions.actionGetContainerEnergy(creep, action, 4, true);
    // if (creep.room.energyCapacityAvailable < 550) {
    //   action = creepActions.actionGetSourceEnergy(creep, action, 2);
    // }
    // action = creepActions.actionGetDroppedEnergy(creep, action, false);
  }
}

export function getBody(room: Room): BodyPartConstant[] {
  const energyAvailable: number = room.energyCapacityAvailable;
  if (energyAvailable >= 1300) {
    return [MOVE, MOVE, MOVE, MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, WORK, WORK, WORK,
      CARRY, CARRY, CARRY, CARRY];
  } else if (energyAvailable >= 650) {
    return [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
  } else if (energyAvailable >= 550) {
    return [MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY, CARRY];
  } else if (room.energyCapacityAvailable >= 400) {
    return [MOVE, MOVE, WORK, WORK, CARRY, CARRY];
  } else {
    return [WORK, WORK, CARRY, MOVE];
  }
}

export function build(room: Room, spawn: SpawnRoom, creeps: Creep[], State: RoomStates, spawnAction: boolean): boolean {
  if (spawnAction === false) {
    if (creeps.length > 0) {
      let numUpgraders: number = 1;
      const _upgraders = _.filter(creeps, (creep) => creep.memory.role === "upgrader");
      if (State === RoomStates.STABLE) {
        numUpgraders = 2;
        if (room.storage) {
          const energy: number | undefined = room.storage.store.energy;
          if (energy) {
            if (energy > 100000) {
              numUpgraders += 5;
            } else if (energy > 50000) {
              numUpgraders += 4;
            } else if (energy > 30000) {
              numUpgraders += 3;
            } else if (energy > 20000) {
              numUpgraders += 2;
            } else if (energy > 10000) {
              numUpgraders += 1;
            }
          }
        }
        // console.log(numUpgraders);
        const roomEnergy: number = StructureManager.getRoomEnergy(room);
        const roomEnergyCapacity: number = StructureManager.getRoomEnergyCapacity(room);
        // console.log(roomEnergy + " " + roomEnergyCapacity);
        if (roomEnergyCapacity >= 4000) {
          if (roomEnergy > roomEnergyCapacity) {
            numUpgraders += 3;
          } else if (roomEnergy > roomEnergyCapacity / 2) {
            numUpgraders += 1;
          }
        }
      }
      // console.log(numUpgraders);
      if (_upgraders.length < numUpgraders) {
        return spawn.createCreep(getBody(room), "upgrader");
      }
    }
  }
  return spawnAction;
}
