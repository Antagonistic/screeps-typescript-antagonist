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

}

export function getBody(): string[] | null {
  return [MOVE];
}

export function build(room: Room, spawn: Spawn, creeps: Creep[],
                      State: RoomStates, spawnAction: boolean): boolean {
  if (spawnAction === false) {
    if (State === RoomStates.STABLE) {
      const exits = Game.map.describeExits(room.name);
      spawnAction = _needSpawnScout(exits["1"], spawn, creeps, spawnAction);
      spawnAction = _needSpawnScout(exits["3"], spawn, creeps, spawnAction);
      spawnAction = _needSpawnScout(exits["5"], spawn, creeps, spawnAction);
      spawnAction = _needSpawnScout(exits["7"], spawn, creeps, spawnAction);
    }
  }
  return spawnAction;
}

function _needSpawnScout(roomID: string | undefined, spawn: Spawn, creeps: Creep[], spawnAction: boolean) {
  if (!spawnAction && roomID !== undefined && _needScout(roomID, creeps)) {
    CreepManager.createCreep(spawn, getBody(), "scout", {room: roomID});
    return true;
  }
  return spawnAction;
}

function _needScout(roomID: string, creeps: Creep[]) {
  if (Game.rooms[roomID] === undefined &&
      Game.map.isRoomAvailable(roomID) &&
      Memory.rooms[roomID].state !== RoomStates.NONE) {
    const _scouts = _.filter(creeps, (creep) => creep.memory.role === "scout" && creep.memory.room === roomID);
    if (_scouts.length) {
      return false;
    } else {
      return true;
    }
  }
  return false;
}
