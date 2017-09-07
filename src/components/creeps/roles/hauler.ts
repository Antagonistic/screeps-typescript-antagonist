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

  if (!action && creepActions.canWork(creep)) {
    action = creepActions.actionMoveToRoom(creep, action, creep.memory.home);
    action = creepActions.actionFillEnergy(creep, action);
    action = creepActions.actionFillTower(creep, action);
    action = creepActions.actionFillBufferChest(creep, action);
    action = creepActions.actionFillEnergyStorage(creep, action);
    action = creepActions.actionFillUpgrader(creep, action);
  } else {
    action = creepActions.actionMoveToRoom(creep, action);
    action = creepActions.actionGetDroppedEnergy(creep, action, true);
    action = creepActions.actionGetContainerEnergy(creep, action, 2, true);
  }
}

export function getBody(room: Room): string[] | null {
    if (room.energyCapacityAvailable >= 750) {
      // Huge hauler
      return [MOVE, MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
    } else if (room.energyCapacityAvailable >= 600) {
      // Big hauler
      return [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
    } else if (room.energyAvailable >= 450) {
      // Medium hauler
      return [MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
    } else {
      // Small hauler
      return [MOVE, MOVE, CARRY, CARRY, CARRY, CARRY];
    }
  }

export function build(room: Room, spawn: Spawn, sources: Source[], creeps: Creep[],
                      State: RoomStates, spawnAction: boolean): boolean {
  if (spawnAction === false) {
    let numHaulers = 0;
    switch (State) {
      case RoomStates.MINE:
        numHaulers = sources.length * 2 + 1;
        break;
      case RoomStates.TRANSITION:
        numHaulers = sources.length;
        break;
      case RoomStates.STABLE:
        numHaulers = sources.length * 2 + 1;
        break;
    }
    const _haulers = _.filter(creeps, (creep) => creep.memory.role === "hauler" && creep.memory.room === room.name);
    if (_haulers.length < numHaulers) {
      console.log(_haulers.length + "/" + numHaulers + " - " + room.name);
      return CreepManager.createCreep(spawn, getBody(spawn.room), "hauler", {}, room);
    }
  }
  return spawnAction;
}
