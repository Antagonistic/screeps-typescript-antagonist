import * as Config from "../../config/config";

import * as builder from "./roles/builder";
import * as claim from "./roles/claim";
import * as guard from "./roles/guard";
import * as harvester from "./roles/harvester";
import * as hauler from "./roles/hauler";
import * as miner from "./roles/miner";
import * as repair from "./roles/repair";
import * as scout from "./roles/scout";
import * as soldier from "./roles/soldier";
import * as upgrader from "./roles/upgrader";

// import { log } from "../../lib/logger/log";

import { SpawnRoom } from "../rooms/SpawnRoom";

import { empire } from "../../Empire";

import * as StructureManager from "../rooms/structureManager";

/**
 * Initialization scripts for CreepManager module.
 *
 * @export
 * @param {Room} room
 */

export function runCreeps(creeps: Creep[]): void {
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
      case "scout":
        scout.run(creep);
        break;
      case "guard":
        guard.run(creep);
        break;
      case "claim":
        claim.run(creep);
        break;
      case "soldier":
        soldier.run(creep);
        break;
    }
  });
}

export function run(room: Room, creeps: Creep[], spawnAction: boolean): boolean {
  /*let creeps = room.find<Creep>(FIND_MY_CREEPS);
  const remoteRooms: string[] | null = room.memory.remoteRoom;
  if (remoteRooms && remoteRooms.length) {
    for (const remoteRoomName in remoteRooms) {
      const remoteRoom = Game.rooms[remoteRoomName];
      if (remoteRoom) {
        const remoteCreeps = remoteRoom.find<Creep>(FIND_MY_CREEPS);
        if (remoteCreeps.length) {
          console.log ("Remotecreeps len: " + remoteCreeps.length);
          creeps = creeps.concat(remoteCreeps);
        }
      }
    }
  }*/
  // const creepCount = _.size(creeps);

  // const roomCreeps = _.filter(creeps, (c: Creep) => c.memory.room === room.name);

  if (Config.ENABLE_DEBUG_MODE) {
    // log.info(creepCount + " creeps found in the playground.");
  }

  const spawnRoom: SpawnRoom = empire.spawnRooms.W9N38;
  const spawns: StructureSpawn[] = room.find(FIND_MY_SPAWNS);
  const State: RoomStates = room.memory.state as RoomStates;
  if (spawns.length) {
    // for (const spawn of spawns) {
    spawnAction = _spawnAllCreeps(room, spawnRoom, creeps, spawnAction);
    // }
  } else if (room.memory.home && State === RoomStates.MINE) {
    // const homeSpawns: Spawn[] = Game.rooms[room.memory.home].find<Spawn>(FIND_MY_SPAWNS);
    // if (homeSpawns && homeSpawns[0] && !homeSpawns[0].spawning) {
    spawnAction = _spawnRemoteCreeps(room, spawnRoom, creeps, spawnAction);
    // console.log("RemoteSpawn!");
    // }
  }
  return spawnAction;
}

function _spawnAllCreeps(room: Room, spawn: SpawnRoom, creeps: Creep[], spawnAction: boolean): boolean {
  const sources: Source[] = room.find(FIND_SOURCES);
  const State: RoomStates = room.memory.state as RoomStates;
  if (spawn && spawn.availableSpawnCount) {
    spawnAction = guard.build(room, spawn, creeps, spawnAction);

    spawnAction = harvester.build(spawn, creeps, State, spawnAction);
    spawnAction = miner.build(room, spawn, sources, creeps, State, spawnAction);
    spawnAction = hauler.build(room, spawn, sources, creeps, State, spawnAction);

    if (StructureManager.getRoomEnergy(room) >= 1000) {
      spawnAction = builder.build(room, spawn, creeps, State, spawnAction);
      spawnAction = repair.build(room, spawn, creeps, State, spawnAction);
      spawnAction = upgrader.build(room, spawn, creeps, State, spawnAction);

      spawnAction = scout.build(room, spawn, creeps, State, spawnAction);
    }
  }
  return spawnAction;
}

function _spawnRemoteCreeps(room: Room, spawn: SpawnRoom, creeps: Creep[], spawnAction: boolean): boolean {
  const sources: Source[] = room.find(FIND_SOURCES);
  const State: RoomStates = room.memory.state as RoomStates;
  if (spawn && spawn.availableSpawnCount && State === RoomStates.MINE) {
    const hostiles = room.find(FIND_HOSTILE_CREEPS);
    if (hostiles && hostiles.length) {
      // spawnAction = guard.build(room, spawn, creeps, spawnAction);
    } else {
      spawnAction = miner.build(room, spawn, sources, creeps, State, spawnAction, true);
      spawnAction = hauler.build(room, spawn, sources, creeps, State, spawnAction);
      spawnAction = builder.build(room, spawn, creeps, State, spawnAction);
      spawnAction = repair.build(room, spawn, creeps, State, spawnAction);
      spawnAction = claim.build(room, spawn, creeps, State, spawnAction);
      // console.log(spawnAction);
    }
  }
  return spawnAction;
}

/*export function createCreep(spawn: Spawn, bodyParts: string[] | null,
                            role: string, memory?: any, room: Room = spawn.room, creepName?: string): boolean {
  if (bodyParts) {
    let status: number | string = spawn.canCreateCreep(bodyParts, undefined);
    // console.log(status);
    if (status === OK) {

      const uuid: number = Memory.uuid;
      Memory.uuid = uuid + 1;
      if (!creepName) {
        creepName = room.name + " - " + role + uuid;
      } else {
        creepName = creepName + uuid;
      }

      const properties: { [key: string]: any } = {
        home: spawn.room.name,
        role,
        room: room.name,
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

      status = spawn.createCreep(bodyParts, creepName, properties);
    }
    if (typeof status !== "string" && status !== OK && status !== ERR_NOT_ENOUGH_ENERGY) {
      if (Config.ENABLE_DEBUG_MODE) {
        log.info("Failed creating new creep: " + status);
      }
      return false;
    } else  if (status === OK) {
      return true;
    }
  }
  return false;
}*/
