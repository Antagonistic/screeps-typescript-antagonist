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
  const sourceID: string = creep.memory.sourceID;
  action = creepActions.actionRecycle(creep, action);
  action = creepActions.actionMoveToRoom(creep, action);
  if (!action && sourceID) {
    const source: Source | null = Game.getObjectById(sourceID);
    if (source) {
      const ret: number = creep.harvest(source);
      if (ret === ERR_NOT_IN_RANGE) {
        _findBox(creep, source);
      } else {
        // In case its not on box cos of obstruction
        if (creep.ticksToLive % 50 === 0) {
          _findBox(creep, source);
        }
      }
    } else {
      if (creep.room.name !== creep.memory.room) {
        // Wrong room, lets walk
        creep.moveTo(new RoomPosition(20, 20, creep.memory.room));
      }
    }
  } else {
    console.log("Miner has no specified source to mine!");
    const sources: Source[] = creep.room.find(FIND_SOURCES);
    creep.memory.sourceID = sources[0].id;
  }
}

function _findBox(creep: Creep, source: Source) {
  const box: Container[] = source.pos.findInRange<Container>(FIND_STRUCTURES, 1,
    {filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER});
  if (box && box.length > 0) {
    creep.moveTo(box[0], {visualizePathStyle: {stroke: "#ffffff"}});
    return;
  }
  const boxSite: ConstructionSite[] = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1,
    {filter: (x: ConstructionSite) => x.structureType === STRUCTURE_CONTAINER});
  if (boxSite && boxSite.length > 0) {
    creep.moveTo(boxSite[0], {visualizePathStyle: {stroke: "#ffffff"}});
    return;
  }
  console.log(creep.name + " could not find its box!");
  creep.moveTo(source, {visualizePathStyle: {stroke: "#ffffff"}});
}

export function getBody(room: Room, isRemote: boolean = false): string[] | null {
  if (room.energyCapacityAvailable < 550) {
    return null;
  }
  if (isRemote) {
    return [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK];
  } else {
    return [WORK, WORK, WORK, WORK, WORK, MOVE];
  }
}

export function build(room: Room, spawn: Spawn, sources: Source[], creeps: Creep[],
                      State: RoomStates, spawnAction: boolean, remote: boolean = false): boolean {
  if (spawnAction === false) {
    switch (State) {
      case RoomStates.MINE:
      case RoomStates.TRANSITION:
      case RoomStates.STABLE:
        for (const source of sources) {
          const _miner = _.filter(creeps, (creep) =>
            creep.memory.role === "miner" &&
            creep.memory.sourceID === source.id);
          if (!_miner || _miner.length === 0 || _.all(_miner, (c) => c.ticksToLive < 150)) {
            // console.log("minerSpawn");
            return CreepManager.createCreep(spawn, getBody(room, remote), "miner",
             {sourceID: source.id, room: room.name});
          }
        }
        break;
    }
  }
  return spawnAction;
}
