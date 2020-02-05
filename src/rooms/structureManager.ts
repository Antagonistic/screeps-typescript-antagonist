import * as SpawnHandler from "./structure/spawn";
import * as TowerHandler from "./structure/tower";

import { log } from "../lib/logger/log";

export function run(room: Room): void {

  // Handle Towers
  const towerIDs: string[] | undefined = room.memory.towers;
  if (towerIDs && towerIDs.length > 0) {
    const hostiles: Creep[] = room.find(FIND_HOSTILE_CREEPS);
    for (const towerID of towerIDs) {
      const tower: StructureTower | null = Game.getObjectById(towerID);
      if (tower) {
        TowerHandler.run(tower, hostiles);
      }
    }
  }

  // Handle spawns
  const spawns: StructureSpawn[] = room.find(FIND_MY_SPAWNS);
  for (const spawn of spawns) {
    SpawnHandler.run(spawn);
    if (spawn.hits < spawn.hitsMax) {
      // EMERGENCY, SAFE MODE!
      _safeMode(room);
    }
  }

  // Check for extention or lab damage
  const extentions: Structure[] = room.find<StructureExtension>(FIND_MY_STRUCTURES, {
    filter:
      (x: Structure) => (x.structureType === STRUCTURE_EXTENSION || x.structureType === STRUCTURE_LAB)
        && x.hits < x.hitsMax
  });
  if (extentions && extentions.length) {
    _safeMode(room);
  }
  // Check for terminal damage
  const terminal: StructureTerminal | undefined = room.terminal;
  if (terminal && terminal.hits < terminal.hitsMax) {
    _safeMode(room);
  }

  const storage = room.storage;
  if (storage && storage.hits < storage.hitsMax) {
    _safeMode(room);
  }

  // Check to build structures
  if (Game.time % 50 === 5) {
    // _buildStructures(room);
  }

  // Regen room's tower list
  if (Game.time % 50 === 10) {
    _findTowers(room);
  }

  if (Game.time % 50 === 15) {
    _findBufferChests(room);
  }

  if (Game.time % 50 === 20) {
    if (room.name !== "sim") {
      _findRemoteRooms(room);
    }
  }

  if (Game.time % 50 === 25) {
    _findLinks(room);
  }

  if (Game.time % 50 === 30) {
    _findBoostLabs(room);
  }
}

function _safeMode(room: Room) {
  // EMERGENCY, SAFE MODE!
  const hostiles: Creep[] = room.find(FIND_HOSTILE_CREEPS, { filter: (x: Creep) => x.owner.username !== "Invader" });
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
  const containers: StructureContainer[] = room.find<StructureContainer>(FIND_STRUCTURES, {
    filter:
      (x: Structure) => x.structureType === STRUCTURE_CONTAINER
  });
  if (containers && containers.length) {
    for (const container of containers) {
      energy += container.store.energy;
    }
  }
  const dropped: Resource[] = room.find<FIND_DROPPED_RESOURCES>(FIND_DROPPED_RESOURCES, {
    filter:
      (x: Resource) => x.resourceType === RESOURCE_ENERGY
  });
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
  const containers: StructureContainer[] = room.find<StructureContainer>(FIND_STRUCTURES, {
    filter:
      (x: Structure) => x.structureType === STRUCTURE_CONTAINER
  });
  if (containers && containers.length) {
    for (const container of containers) {
      energy += container.storeCapacity;
    }
  }
  return energy;
}

function _findTowers(room: Room) {
  const towers: StructureTower[] = room.find<StructureTower>(FIND_STRUCTURES, { filter: (x: Structure) => x.structureType === STRUCTURE_TOWER });
  if (towers && towers.length) {
    const towerIds: string[] = _.map(towers, (tower) => tower.id);
    if (!_.isEqual(towerIds, room.memory.towers)) {
      room.memory.towers = towerIds;
      log.info(room.name + ": Updating tower info.");
    }
  }
}

function _findBufferChests(room: Room) {
  const containers: StructureContainer[] = room.find<StructureContainer>(FIND_STRUCTURES, {
    filter:
      (x: Structure) => x.structureType === STRUCTURE_CONTAINER
  });
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

export function _buildRoad(from: RoomPosition, goal: RoomPosition, rangeOne: boolean = true, placeContainer: boolean = true) {
  let foundpath: PathFinderPath;
  if (rangeOne) {
    foundpath = PathFinder.search(from, { pos: goal, range: 1 }, { swampCost: 1 });
  } else {
    foundpath = PathFinder.search(from, { pos: goal, range: 0 }, { swampCost: 1 });
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
  const links: StructureLink[] = room.find<StructureLink>(FIND_STRUCTURES, {
    filter:
      (x: Structure) => x.structureType === STRUCTURE_LINK
  });
  if (links && links.length) {
    const mininglinks: StructureLink[] = _.filter(links, (l) => l.pos.findInRange(FIND_SOURCES, 2).length);
    if (mininglinks && mininglinks.length) {
      const mininglinkIDs = _.map(mininglinks, (l) => l.id);
      if (!_.isEqual(room.memory.mininglinks, mininglinkIDs)) {
        log.info(room.name + ": Updating mining links! " + mininglinks.length);
        room.memory.mininglinks = mininglinkIDs;
      }
    } else {
      room.memory.mininglinks = undefined;
    }
    const spawnlinks: StructureLink[] = _.filter(links, (l) => l.pos.findInRange(FIND_MY_STRUCTURES, 2, {
      filter:
        (x: Structure) => x.structureType === STRUCTURE_SPAWN
    }).length);
    if (spawnlinks && spawnlinks.length) {
      const spawnlinkIDs = _.map(spawnlinks, (l) => l.id);
      if (!_.isEqual(room.memory.spawnlinks, spawnlinkIDs)) {
        log.info(room.name + ": Updating spawn links! " + spawnlinks.length);
        room.memory.spawnlinks = spawnlinkIDs;
      }
    } else {
      room.memory.spawnlinks = undefined;
    }
    const controller = room.controller;
    if (controller) {
      const controllerlinks: StructureLink[] = _.filter(links, (l) => l.pos.findInRange([controller.pos], 3).length);
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
  } else {
    if (room.memory.mininglinks) {
      room.memory.mininglinks = undefined;
    }
    if (room.memory.spawnlinks) {
      room.memory.spawnlinks = undefined;
    }
    if (room.memory.controllerlinks) {
      room.memory.controllerlinks = undefined;
    }
  }
}

function _findBoostLabs(room: Room) {
  const labs: StructureLab[] = room.find<StructureLab>(FIND_STRUCTURES, { filter: (x: Structure) => x.structureType === STRUCTURE_LAB });
  if (labs && labs.length) {
    const availBoost: { [name: string]: string; } = {};
    for (const lab of labs) {
      switch (lab.mineralType) {
        case RESOURCE_CATALYZED_UTRIUM_ACID:
          availBoost[ATTACK] = lab.id;
          break;
        case RESOURCE_CATALYZED_KEANIUM_ALKALIDE:
          availBoost[RANGED_ATTACK] = lab.id;
          break;
        case RESOURCE_CATALYZED_LEMERGIUM_ALKALIDE:
          availBoost[HEAL] = lab.id;
          break;
        case RESOURCE_CATALYZED_GHODIUM_ALKALIDE:
          availBoost[TOUGH] = lab.id;
          break;
      }
    }
    if (_.isEmpty(availBoost)) {
      room.memory.availBoost = undefined;
    } else if (!_.isEqual(room.memory.availBoost, availBoost)) {
      log.info(room.name + ": Updating available boosts!");
      room.memory.availBoost = availBoost;
    }
  }
}
