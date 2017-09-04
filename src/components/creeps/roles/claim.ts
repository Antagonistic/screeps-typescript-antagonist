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
  let action: boolean = false;

  action = creepActions.actionMoveToRoom(creep, action);
  // action = creepActions.actionMoveToController(creep, action);
  if (creep.memory.reserve) {
    action = creepActions.actionReserve(creep, action);
  }

}

export function getBody(room: Room): string[] | null {
  if (room.energyCapacityAvailable >= 1950) {
    return [CLAIM, CLAIM, CLAIM, MOVE, MOVE, MOVE];
  }
  if (room.energyCapacityAvailable >= 1300) {
    return [CLAIM, CLAIM, MOVE, MOVE];
  }
  return [CLAIM, MOVE];
}

export function build(room: Room, spawn: Spawn, creeps: Creep[],
                      State: RoomStates, spawnAction: boolean): boolean {
  if (spawnAction === false) {
    if (State === RoomStates.MINE) {
      if (room.controller) {
        if (!room.controller.my || !room.controller.reservation || room.controller.reservation.ticksToEnd < 150) {
          const _claims = _.filter(creeps, (creep) => creep.memory.role === "claim" && creep.memory.room === room.name);
          if (!_claims || _claims.length === 0) {
            // Need to reserve
            return CreepManager.createCreep(spawn, getBody(spawn.room), "claim", {reserve: true}, room);
          }
        }
      }
    }
  }
  return spawnAction;
}
