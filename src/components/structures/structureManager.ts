import RoomStates from "../state/roomStates";

import * as SpawnHandler from "./structure/spawn";
import * as TowerHandler from "./structure/tower";

export function run(room: Room): void {

  // Handle Towers
  const towerIDs: string[] = room.memory.towers;
  if (towerIDs && towerIDs.length > 0) {
    const hostiles: Creep[] = room.find(FIND_HOSTILE_CREEPS);
    for (const towerID of towerIDs) {
      const tower: Tower | null = Game.getObjectById(towerID);
      if (tower) {
        TowerHandler.run(tower, hostiles);
      }
    }
  }

  // Handle spawns
  const spawns: Spawn[] = room.find(FIND_MY_SPAWNS);
  for (const spawn of spawns) {
    SpawnHandler.run(spawn);
  }

  // Check to build structures
  if (Game.time % 50 === 5) {
    _buildStructures(room);
  }

  // Regen room's tower list
  if (Game.time % 50 === 10) {
    _findTowers(room);
  }
}

function _buildStructures(room: Room) {
  const state: RoomStates = room.memory.state;
  switch  (state) {
    case RoomStates.BOOTSTRAP:
    case RoomStates.TRANSITION:
    case RoomStates.STABLE:
      if (room.memory.stable_structures) {
        return;
      }
      console.log("Placing stable room layouts!");
      const spawns: Spawn[] = room.find(FIND_MY_SPAWNS);
      const spawnPos: RoomPosition[] = _.map(spawns, (x) => x.pos);
      const sources: Source[] = room.find(FIND_SOURCES);
      const sourcePos: RoomPosition[] = _.map(sources, (x) => x.pos);
      if (!spawns || spawns.length === 0) {
        console.log("StructureManager can't find any spawns!");
        return;
      }
      // Place a container per source
      // for (const source of sources) {
        // const path: Path = room.findPath(source.pos, spawns[0].pos,
        //  {ignoreCreeps: true, ignoreRoads: true, swampCost: 1 })
      // }

      for (const spawn of spawnPos) {
        for (const source of sourcePos) {
          _buildRoad(spawn, source, true, true);
        }
        if (room.controller) {
          _buildRoad(spawn, room.controller.pos, true, false);
        }
      }
      room.memory.stable_structures = true;
      break;
  }
}

function _findTowers(room: Room) {
  const towers: Tower[] = room.find(FIND_STRUCTURES, {filter: (x: Structure) => x.structureType === STRUCTURE_TOWER});
  const towerIds: string[] = _.map(towers, (tower) => tower.id);
  room.memory.towers = towerIds;
}

function _buildRoad(from: RoomPosition, goal: RoomPosition, rangeOne: boolean = true, placeContainer: boolean = true) {
  let foundpath: PathFinderPath;
  if (rangeOne) {
    foundpath = PathFinder.search(from, { pos: goal, range: 1 }, {swampCost: 1});
  } else {
    foundpath = PathFinder.search(from, { pos: goal, range: 0 }, {swampCost: 1});
  }
  if (placeContainer) {
    const contPos = foundpath.path.pop();
    if (contPos) {
      contPos.createConstructionSite(STRUCTURE_CONTAINER);
    }
  }
  for (const step of foundpath.path) {
    step.createConstructionSite(STRUCTURE_ROAD);
  }
}
