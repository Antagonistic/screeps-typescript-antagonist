import * as Config from "../../config/config";

import * as builder from "./roles/builder";
import * as harvester from "./roles/harvester";
import * as hauler from "./roles/hauler";
import * as miner from "./roles/miner";
import * as repair from "./roles/repair";
import * as upgrader from "./roles/upgrader";

import { log } from "../../lib/logger/log";

import RoomStates from "../state/roomStates";

/**
 * Initialization scripts for CreepManager module.
 *
 * @export
 * @param {Room} room
 */
export function run(room: Room): void {
  const creeps = room.find<Creep>(FIND_MY_CREEPS);
  // const creepCount = _.size(creeps);

  if (Config.ENABLE_DEBUG_MODE) {
    // log.info(creepCount + " creeps found in the playground.");
  }

  const spawn: Spawn | null = room.find<Spawn>(FIND_MY_SPAWNS)[0];
  if (spawn && !spawn.spawning) {
    if (!_buildMiners(room, creeps)) {
      if (!_buildBuilders(room, creeps)) {
        if (!_buildRepair(room, creeps)) {
          _buildUpgraders(room, creeps);
        }
      }
    }
  }

  _.each(creeps, (creep: Creep) => {
    switch (creep.memory.role) {
    case "harvester":
      harvester.run(creep);
      break;
    case "builder":
      builder.run(creep);
      break;
    case "upgrader":
      upgrader.run(creep);
      break;
    case "miner":
      miner.run(creep);
      break;
    case "hauler":
      hauler.run(creep);
      break;
    case "repair":
      repair.run(creep);
      break;
    }
  });
}

function _buildMiners(room: Room, creeps: Creep[]): boolean {
  const isBuilding: boolean = false;
  const State: RoomStates = room.memory.state as RoomStates;

  const spawn = room.find<Spawn>(FIND_MY_SPAWNS)[0];

  // Harvesters
  switch (State) {
    case RoomStates.BOOTSTRAP: {
      const harvesters = _.filter(creeps, (creep) => creep.memory.role === "harvester");
      if (harvesters.length < 4) {
        if (_createCreep(spawn, harvester.getBody(), "harvester")) {
          return true;
        }
      }
      break;
    }
    case RoomStates.TRANSITION: {
      const harvesters = _.filter(creeps, (creep) => creep.memory.role === "harvester");
      if (harvesters.length < 2) {
        if (_createCreep(spawn, harvester.getBody(), "harvester")) {
          return true;
        }
      }
      break;
    }
  }

  // Miners
  const sources: Source[] = room.find(FIND_SOURCES);
  switch (State) {
    case RoomStates.TRANSITION:
    case RoomStates.STABLE:
      for (const source of sources) {
        const _miner = _.filter(creeps, (creep) =>
          creep.memory.role === "miner" &&
          creep.memory.sourceID === source.id);
        if (!_miner || _miner.length === 0) {
          if (_createCreep(spawn, miner.getBody(room), "miner", {sourceID: source.id})) {
            return true;
          }
        }
      }
      break;
  }

  // Haulers
  let numHaulers = 0;
  switch (State) {
    case RoomStates.TRANSITION:
      numHaulers = sources.length;
    case RoomStates.STABLE:
      numHaulers = sources.length + 1;
      break;
  }
  const _haulers = _.filter(creeps, (creep) => creep.memory.role === "hauler");
  if (_haulers.length < numHaulers) {
    if (_createCreep(spawn, hauler.getBody(room), "hauler")) {
        return true;
    }
  }
  return isBuilding;
}

function _buildBuilders(room: Room, creeps: Creep[]): boolean {
  const _constructions: ConstructionSite[] = room.find(FIND_MY_CONSTRUCTION_SITES);
  if (_constructions.length > 0) {
    const State: RoomStates = room.memory.state as RoomStates;
    const spawn = room.find<Spawn>(FIND_MY_SPAWNS)[0];
    const _builders = _.filter(creeps, (creep) => creep.memory.role === "builder");
    const buildSum = _.sum(_constructions, (x: ConstructionSite) => (x.progressTotal - x.progress));

    switch (State) {
      case RoomStates.BOOTSTRAP:
      case RoomStates.TRANSITION:
        if (_builders.length < 1) {
          return _createCreep(spawn, builder.getBody(room), "builder");
        }
        break;
      case RoomStates.STABLE:
        let numBuilders = 1;
        if (buildSum > 40000) {
          numBuilders = 3;
        } else if (buildSum > 10000) {
          numBuilders = 2;
        }
        if (_builders.length < numBuilders) {
          return _createCreep(spawn, builder.getBody(room), "builder");
        }
        break;
    }
  } else {
    // No more need for builders, recycle them
    const _builders = _.filter(creeps, (creep) => creep.memory.role === "builder");
    for (const _builder of _builders) {
      _builder.memory.recycle = true;
    }
  }
  return false;
}

function _buildRepair(room: Room, creeps: Creep[]): boolean {
  const State: RoomStates = room.memory.state as RoomStates;
  switch (State) {
    case RoomStates.STABLE:
      const spawn = room.find<Spawn>(FIND_MY_SPAWNS)[0];
      const _reps = _.filter(creeps, (creep) => creep.memory.role === "repair");
      let numReps = 1;
      const walls: StructureWall[] = room.find(FIND_STRUCTURES, {filter: (x: Structure) =>
        x.structureType === STRUCTURE_WALL});
      if (walls.length > 0) {
        numReps = 3;
      }
      if (_reps.length < numReps) {
        return _createCreep(spawn, repair.getBody(room), "repair");
      }
      break;
  }
  return false;
}

function _buildUpgraders(room: Room, creeps: Creep[]): boolean {
  let numUpgraders: number = 1;
  const _upgraders = _.filter(creeps, (creep) => creep.memory.role === "upgrader");
  const spawn = room.find<Spawn>(FIND_MY_SPAWNS)[0];
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
    return _createCreep(spawn, upgrader.getBody(room), "upgrader");
  }
  return false;
}

function _createCreep(spawn: Spawn, bodyParts: string[] | null, role: string, memory?: any): boolean {
  if (bodyParts) {
    const status: number = spawn.canCreateCreep(bodyParts, undefined);
    if (status === OK) {

      const uuid: number = Memory.uuid;
      Memory.uuid = uuid + 1;
      const creepName: string = spawn.room.name + " - " + role + uuid;

      const properties: { [key: string]: any } = {
        role,
        room: spawn.room.name,
        uuid,
        working: false,
      };
      if (memory) {
        _.assign(properties, memory);
      }

      log.info("Started creating new creep: " + creepName);
      if (Config.ENABLE_DEBUG_MODE) {
        log.info("Body: " + bodyParts);
      }

      spawn.createCreep(bodyParts, creepName, properties);
    }
    if (status !== OK) {
      // if (Config.ENABLE_DEBUG_MODE) {
        // log.info("Failed creating new creep: " + status);
      // }
      return false;
    } else {
      return true;
    }
  }
  return false;
}
