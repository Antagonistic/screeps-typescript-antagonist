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
  if (energyAvailable < 600) {
    return [WORK, WORK, CARRY, MOVE];
  } else {
    return [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
  }
}

export function build(room: Room, spawn: Spawn, creeps: Creep[], spawnAction: boolean): boolean {
  if (spawnAction === false) {
    let numUpgraders: number = 1;
    const _upgraders = _.filter(creeps, (creep) => creep.memory.role === "upgrader");
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
    if (_upgraders.length < numUpgraders) {
      return CreepManager.createCreep(spawn, getBody(room), "upgrader");
    }
  }
  return spawnAction;
}
