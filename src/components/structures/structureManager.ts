import RoomStates from "../state/roomStates";

import * as SpawnHandler from "./structure/spawn";
import * as TowerHandler from "./structure/tower";

import { log } from "../../lib/logger/log";

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
    if (spawn.hits < spawn.hitsMax) {
      // EMERGENCY, SAFE MODE!
      _safeMode(room);
    }
  }

  // Check for extention damage
  const extentions: Extension[] = room.find<StructureExtension>(FIND_MY_STRUCTURES, {filter:
    (x: Structure) => x.structureType === STRUCTURE_EXTENSION && x.hits < x.hitsMax});
  if (extentions && extentions.length) {
    _safeMode(room);
  }
  // Check to build structures
  if (Game.time % 50 === 5) {
    _buildStructures(room);
  }

  // Regen room's tower list
  if (Game.time % 50 === 10) {
    _findTowers(room);
  }

  if (Game.time % 50 === 15) {
    _findBufferChests(room);
  }

  if (Game.time % 50 === 20) {
    _findRemoteRooms(room);
  }

  if (Game.time % 50 === 25) {
    _findLinks(room);
  }
}

function _safeMode(room: Room) {
  // EMERGENCY, SAFE MODE!
  const hostiles: Creep[] = room.find(FIND_HOSTILE_CREEPS, {filter: (x: Creep) => x.owner.username !== "Invader"});
  if (room.controller && room.controller.my && room.controller.safeModeAvailable && hostiles && hostiles.length) {
    if (!room.controller.safeMode) {
      room.controller.activateSafeMode();
      log.info(room.name + ": EMERGENCY! SAFE MODE ACTIVATED!!");
    }
  }
}

export function getRoomEnergy(room: Room): number {
  let energy: number = 0;
  if (room.storage && room.storage.my && room.storage.store.energy) {
    energy += room.storage.store.energy;
  }
  const containers: Container[] = room.find<Container>(FIND_STRUCTURES, {filter:
    (x: Structure) => x.structureType === STRUCTURE_CONTAINER});
  if (containers && containers.length) {
    for (const container of containers) {
      energy += container.store.energy;
    }
  }
  const dropped: Resource[] = room.find<Resource>(FIND_DROPPED_RESOURCES, {filter:
    (x: Resource) => x.resourceType === RESOURCE_ENERGY});
  if (dropped && dropped.length) {
    for (const res of dropped) {
      energy += res.amount;
    }
  }
  return energy;
}

export function getRoomEnergyCapacity(room: Room): number {
  let energy: number = 0;
  if (room.storage && room.storage.my && room.storage.store.energy) {
    energy += room.storage.storeCapacity;
  }
  const containers: Container[] = room.find<Container>(FIND_STRUCTURES, {filter:
    (x: Structure) => x.structureType === STRUCTURE_CONTAINER});
  if (containers && containers.length) {
    for (const container of containers) {
      energy += container.storeCapacity;
    }
  }
  return energy;
}

function _buildStructures(room: Room) {
  const state: RoomStates = room.memory.state;
  switch  (state) {
    case RoomStates.MINE:
      if (room.memory.mine_structures) {
        return;
      }
      log.info(room.name + ": Placing mining room layouts!");
      const home = room.memory.home;
      if (home) {
        const homeSpawn: Spawn[] = Game.rooms[home].find(FIND_MY_SPAWNS);
        const mineSources: Source[] = room.find(FIND_SOURCES);
        if (homeSpawn && homeSpawn.length && mineSources && mineSources.length) {
          for (const s of mineSources) {
            _buildRoad(homeSpawn[0].pos, s.pos, true, true);
          }
          room.memory.mine_structures = Game.time;
        }
      }
      break;
    case RoomStates.TRANSITION:
    case RoomStates.STABLE:
      if (room.memory.stable_structures || room.energyCapacityAvailable < 550) {
        return;
      }
      log.info(room.name + ": Placing stable room layouts!");
      const spawns: Spawn[] = room.find(FIND_MY_SPAWNS);
      const spawnPos: RoomPosition[] = _.map(spawns, (x) => x.pos);
      const sources: Source[] = room.find(FIND_SOURCES);
      const sourcePos: RoomPosition[] = _.map(sources, (x) => x.pos);
      if (!spawns || spawns.length === 0) {
        log.info(room.name + ": StructureManager can't find any spawns!");
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
  if (towers && towers.length) {
    const towerIds: string[] = _.map(towers, (tower) => tower.id);
    if (!_.isEqual(towerIds, room.memory.towers)) {
      room.memory.towers = towerIds;
      log.info(room.name + ": Updating tower info.");
    }
  }
}

function _findBufferChests(room: Room) {
  const containers: Container[] = room.find<Container>(FIND_STRUCTURES, {filter:
    (x: Structure) => x.structureType === STRUCTURE_CONTAINER});
  if (containers && containers.length) {
    const bufferChests: string[] = [];
    for (const container of containers) {
      const sources: Source[] = container.pos.findInRange(FIND_SOURCES, 1);
      if (!sources || sources.length === 0) {
        bufferChests.push(container.id);
      }
    }
    if (bufferChests && bufferChests.length) {
      if (!_.isEqual(bufferChests, room.memory.bufferChests)) {
        log.info(room.name + ": Updating buffer chests.");
        room.memory.bufferChests = bufferChests;
      }
    }
  }
}

function _findRemoteRooms(room: Room) {
  const validRemotes: string[] = [];
  const exits = Game.map.describeExits(room.name);
  let exit: string | undefined = exits["1"];
  if (exit && _validRoom(exit)) {
    validRemotes.push(exit);
  }
  exit = exits["3"];
  if (exit && _validRoom(exit)) {
    validRemotes.push(exit);
  }
  exit = exits["5"];
  if (exit && _validRoom(exit)) {
    validRemotes.push(exit);
  }
  exit = exits["7"];
  if (exit && _validRoom(exit)) {
    validRemotes.push(exit);
  }
  room.memory.remoteRoom = validRemotes;
}

function _validRoom(roomName: string): boolean {
  if (!Game.map.isRoomAvailable(roomName)) {
    return false;
  } else {
    return true;
  }
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

function _findLinks(room: Room): void {
  const links: Link[] = room.find<Link>(FIND_STRUCTURES, {filter:
     (x: Structure) => x.structureType === STRUCTURE_LINK});
  if (links && links.length) {
    const mininglinks: Link[] = _.filter(links, (l) => l.pos.findInRange(FIND_SOURCES, 2).length);
    if (mininglinks && mininglinks.length) {
      const mininglinkIDs = _.map(mininglinks, (l) => l.id);
      if (!_.isEqual(room.memory.mininglinks, mininglinkIDs)) {
        log.info(room.name + ": Updating mining links! " + mininglinks.length);
        room.memory.mininglinks = mininglinkIDs;
      }
    } else {
      room.memory.mininglinks = undefined;
    }
    const spawnlinks: Link[] = _.filter(links, (l) => l.pos.findInRange(FIND_MY_STRUCTURES, 2, {filter:
      (x: Structure) => x.structureType === STRUCTURE_SPAWN}).length);
    if (spawnlinks && spawnlinks.length) {
      const spawnlinkIDs = _.map(spawnlinks, (l) => l.id);
      if (!_.isEqual(room.memory.spawnlinks, spawnlinkIDs)) {
        log.info(room.name + ": Updating spawn links! " + spawnlinks.length);
        room.memory.spawnlinks = spawnlinkIDs;
      }
    } else {
      room.memory.spawnlinks = undefined;
    }
    const controllerlinks: Link[] = _.filter(links, (l) => l.pos.findInRange([room.controller.pos], 3).length);
    if (controllerlinks && controllerlinks.length) {
      const controllerlinkIDs = _.map(controllerlinks, (l) => l.id);
      if (!_.isEqual(room.memory.controllerlinks, controllerlinkIDs)) {
        log.info(room.name + ": Updating controller links! " + controllerlinks.length);
        room.memory.controllerlinks = controllerlinkIDs;
      }
    } else {
      room.memory.controllerlinks = undefined;
    }
  }
}
