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
  const sourceID: string | undefined = creep.memory.sourceID;
  action = creepActions.actionRecycle(creep, action);
  action = creepActions.actionMoveToRoom(creep, action);
  if (!action) {
    if (sourceID) {
      const source: Source | null = Game.getObjectById(sourceID);
      if (source) {
        const ret: number = creep.harvest(source);
        if (ret === ERR_NOT_IN_RANGE) {
          _findBox(creep, source);
        } else if (ret === ERR_NOT_ENOUGH_RESOURCES) {
          action = creepActions.actionBuildStill(creep, action);
          action = creepActions.actionRepairStill(creep, action);
          action = creepActions.actionTransferStill(creep, action);
        } else {
          // In case its not on box cos of obstruction
          if (creep.ticksToLive && creep.ticksToLive % 50 === 0) {
            _findBox(creep, source);
          }
        }
      } else {
        if (creep.room.name !== creep.memory.room) {
          // Wrong room, lets walk
          creepActions.moveTo(creep, new RoomPosition(20, 20, creep.memory.room));
        }
      }
    } else {
      console.log("Miner " + creep.name + "  has no specified source to mine!");
      const sources: Source[] = creep.room.find(FIND_SOURCES);
      creep.memory.sourceID = sources[0].id;
    }
  }
}

function _findBox(creep: Creep, source: Source) {
  const box: StructureContainer[] = source.pos.findInRange<StructureContainer>(FIND_STRUCTURES, 1,
    { filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER });
  if (box && box.length > 0) {
    creepActions.moveTo(creep, box[0].pos);
    return;
  }
  const boxSite: ConstructionSite[] = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1,
    { filter: (x: ConstructionSite) => x.structureType === STRUCTURE_CONTAINER });
  if (boxSite && boxSite.length > 0) {
    creepActions.moveTo(creep, boxSite[0].pos);
    return;
  }
  // console.log(creep.name + " could not find its box!");
  creepActions.moveTo(creep, source.pos);
}

function _idleBox(creep: Creep, source: Source) {
  const box: StructureContainer[] = source.pos.findInRange<StructureContainer>(FIND_STRUCTURES, 1,
    { filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER });
  if (box && box.length > 0) {
    creep.repair(box[0]);
    return;
  }
  const boxSite: ConstructionSite[] = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1,
    { filter: (x: ConstructionSite) => x.structureType === STRUCTURE_CONTAINER });
  if (boxSite && boxSite.length > 0) {
    creep.build(boxSite[0]);
    return;
  }
}

export function getBody(room: Room, isRemote: boolean = false, linkMiner: boolean = false): BodyPartConstant[] {
  if (room.energyCapacityAvailable < 550) {
    return [];
  }
  if (isRemote) {
    return [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK];
  } else if (linkMiner) {
    return [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, CARRY, CARRY];
  } else {
    return [WORK, WORK, WORK, WORK, WORK, MOVE];
  }
}

export function build(room: Room, spawn: SpawnRoom, sources: Source[], creeps: Creep[],
  State: RoomStates, spawnAction: boolean, remote: boolean = false): boolean {
  if (spawnAction === false) {
    switch (State) {
      case RoomStates.MINE:
      case RoomStates.TRANSITION:
      case RoomStates.STABLE:
        for (const source of sources) {
          const linkMining: boolean = (room.memory.mininglinks !== undefined && room.memory.mininglinks.length > 0);
          const _miner = _.filter(creeps, (creep) =>
            creep.memory.role === "miner" &&
            creep.memory.sourceID === source.id);
          if (!_miner || _miner.length === 0 || _.all(_miner, (c) => c.ticksToLive && c.ticksToLive < 150)) {
            // console.log("minerSpawn " + room.name + " " + spawn.name);
            return spawn.createCreep(getBody(spawn.room, remote, linkMining), "miner",
              { sourceID: source.id, linkMining, remote }, room);
          }
        }
        break;
    }
  }
  return spawnAction;
}
