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

  if (!action && creepActions.canWork(creep)) {
    action = creepActions.actionMoveToRoom(creep, action, creep.memory.home);
    action = creepActions.actionFillEnergy(creep, action);
    action = creepActions.actionFillTower(creep, action);
    action = creepActions.actionFillEnergyStorage(creep, action);
  } else {
    action = creepActions.actionMoveToRoom(creep, action, creep.memory.room);
    action = creepActions.actionGetDroppedEnergy(creep, action, true);
    action = creepActions.actionGetContainerEnergy(creep, action, 3);
  }
}

export function getBody(room: Room): BodyPartConstant[] | null {
  if (room.energyCapacityAvailable > 600) {
    // Big hauler
    return [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
  } else {
    // Small hauler
    return [MOVE, MOVE, CARRY, CARRY, CARRY, CARRY];
  }

}

export function build(room: Room, spawn: SpawnRoom, sources: Source[], creeps: Creep[],
  State: RoomStates, spawnAction: boolean): boolean {
  if (spawnAction === false) {
    let numHaulers = 0;
    switch (State) {
      case RoomStates.TRANSITION:
        numHaulers = sources.length;
      case RoomStates.STABLE:
        numHaulers = sources.length + 1;
        break;
    }
    const _haulers = _.filter(creeps, (creep) => creep.memory.role === "longhauler");
    if (_haulers.length < numHaulers) {
      return spawn.createCreep(getBody(room), "hauler", { room: room.name, home: spawn.room.name });
    }
  }
  return spawnAction;
}
