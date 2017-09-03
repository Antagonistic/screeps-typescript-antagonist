import * as creepActions from "../creepActions";

import * as CreepManager from "../creepManager";

import RoomStates from "../../state/roomStates";

import * as StructureManager from "../../structures/structureManager";

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
    action = creepActions.actionUpgrade(creep, action);
  } else {
    action = creepActions.actionGetStorageEnergy(creep, action, 4);
    action = creepActions.actionGetContainerEnergy(creep, action, 4);
    if (creep.room.energyCapacityAvailable < 550) {
      action = creepActions.actionGetSourceEnergy(creep, action, 2);
    }
  }
}

export function getBody(room: Room): string[] | null {
  const energyAvailable: number = room.energyCapacityAvailable;
  if (energyAvailable >= 650) {
    return [WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE];
  } else  if (energyAvailable >= 550) {
    return [MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY, CARRY];
  } else {
    return [WORK, WORK, CARRY, MOVE];
  }
}

export function build(room: Room, spawn: Spawn, creeps: Creep[], State: RoomStates, spawnAction: boolean): boolean {
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
              numUpgraders = 6;
            } else if (energy > 50000) {
              numUpgraders = 5;
            } else if (energy > 30000) {
              numUpgraders = 4;
            } else if (energy > 20000) {
              numUpgraders = 3;
            } else if (energy > 10000) {
              numUpgraders = 2;
            }
          }
        }
        const roomEnergy: number = StructureManager.getRoomEnergy(room);
        const roomEnergyCapacity: number = StructureManager.getRoomEnergyCapacity(room);
        if (roomEnergyCapacity > 4000) {
          if (roomEnergy > roomEnergyCapacity) {
            numUpgraders += 2;
          } else if (roomEnergy > roomEnergyCapacity / 2) {
            numUpgraders += 1;
          }
        }
      }
      if (_upgraders.length < numUpgraders) {
        return CreepManager.createCreep(spawn, getBody(room), "upgrader");
      }
    }
  }
  return spawnAction;
}
