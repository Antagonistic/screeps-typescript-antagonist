import * as Config from "../../config/config";

import * as builder from "./roles/builder";
import * as harvester from "./roles/harvester";
import * as hauler from "./roles/hauler";
import * as miner from "./roles/miner";
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
      // if (!_buildMissingCreeps(room, creeps)) {

      // }
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
    }
  });
}

/**
 * Creates a new creep if we still have enough space.
 *
 * @param {Room} room
 */
/*function _buildMissingCreeps(room: Room, creeps: Creep[]): boolean {
  let bodyParts: string[];

  let isBuilding: boolean = false;

  // Iterate through each creep and push them into the role array.
  const harvesters = _.filter(creeps, (creep) => creep.memory.role === "harvester");

  const spawns: Spawn[] = room.find<Spawn>(FIND_MY_SPAWNS, {
    filter: (spawn: Spawn) => {
      return spawn.spawning === null;
    },
  });

  if (Config.ENABLE_DEBUG_MODE) {
    if (spawns[0]) {
      // log.info("Spawn: " + spawns[0].name);
    }
  }

  if (harvesters.length < 4) {
    if (harvesters.length < 1 || room.energyCapacityAvailable <= 800) {
      bodyParts = [WORK, WORK, CARRY, MOVE];
    } else if (room.energyCapacityAvailable > 800) {
      bodyParts = [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
    }

    _.each(spawns, (spawn: Spawn) => {
      if (spawn.canCreateCreep(bodyParts) === 0) {
        _spawnCreep(spawn, bodyParts, "harvester");
        isBuilding = true;
      }
    });
  }
  return isBuilding;
}*/

const harvesterParts: string[] = [WORK, WORK, CARRY, MOVE];
const minerParts: string[] = [WORK, WORK, WORK, WORK, WORK, MOVE];
const haulerParts: string[] = [CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];

function _buildMiners(room: Room, creeps: Creep[]): boolean {
  const isBuilding: boolean = false;
  const State: RoomStates = room.memory.state as RoomStates;

  const spawn = room.find<Spawn>(FIND_MY_SPAWNS)[0];

  switch (State) {
    case RoomStates.BOOTSTRAP: {
      const harvesters = _.filter(creeps, (creep) => creep.memory.role === "harvester");
      if (harvesters.length < 4) {
        if (spawn.canCreateCreep(harvesterParts) === 0) {
          _spawnCreep(spawn, harvesterParts, "harvester");
          return true;
        }
      }
      break;
    }
    case RoomStates.TRANSITION: {
      const harvesters = _.filter(creeps, (creep) => creep.memory.role === "harvester");
      if (harvesters.length < 2) {
        if (spawn.canCreateCreep(harvesterParts) === 0) {
          _spawnCreep(spawn, harvesterParts, "harvester");
          return true;
        }
      }
      const sources: Source[] = room.find(FIND_SOURCES);
      // for(let i: number = 0; i<sources.length; i++) {
        // const source: Source = sources[i];
      for (const source of sources) {
        if (_spawnMiner(creeps, spawn, source)) {
          return true;
        }
      }
      const _haulers = _.filter(creeps, (creep) => creep.memory.role === "hauler");
      if (_haulers.length < 2) {
        if (spawn.canCreateCreep(haulerParts) === 0) {
          if (_spawnCreep(spawn, haulerParts, "hauler") === 0) {
            return true;
          }
        }
      }
      break;
    }
  }

  return isBuilding;
}

function _spawnMiner(creeps: Creep[], spawn: Spawn, source: Source): boolean {
  const _miner = _.filter(creeps, (creep) => creep.memory.role === "miner" && creep.memory.sourceID === source.id);
  if (!_miner || _miner.length === 0) {
    if (spawn.canCreateCreep(minerParts) === 0) {
      const uuid: number = Memory.uuid;
      Memory.uuid = uuid + 1;
      const role: string = "miner";
      const creepName: string = spawn.room.name + " - " + role + uuid;
      const properties: { [key: string]: any } = {
        cont: false,
        role,
        room: spawn.room.name,
        sourceID: source.id,
        working: false
      };
      spawn.createCreep(minerParts, creepName, properties);
      return true;
    }
  }
  return false;
}

/**
 * Spawns a new creep.
 *
 * @param {Spawn} spawn
 * @param {string[]} bodyParts
 * @param {string} role
 * @returns
 */
function _spawnCreep(spawn: Spawn, bodyParts: string[], role: string) {
  const uuid: number = Memory.uuid;
  let status: number | string = spawn.canCreateCreep(bodyParts, undefined);

  const properties: { [key: string]: any } = {
    role,
    room: spawn.room.name,
    working: false
  };

  status = _.isString(status) ? OK : status;
  if (status === OK) {
    Memory.uuid = uuid + 1;
    const creepName: string = spawn.room.name + " - " + role + uuid;

    log.info("Started creating new creep: " + creepName);
    if (Config.ENABLE_DEBUG_MODE) {
      log.info("Body: " + bodyParts);
    }

    status = spawn.createCreep(bodyParts, creepName, properties);

    return _.isString(status) ? OK : status;
  } else {
    if (Config.ENABLE_DEBUG_MODE) {
      log.info("Failed creating new creep: " + status);
    }

    return status;
  }
}
