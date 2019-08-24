import * as Config from "./config/config";

import * as CreepManager from "./components/creeps/creepManager";
// import * as FlagManager from "./components/flags/flagManager";
import * as OperationManager from "./components/operation/operationManager";
import * as StateManager from "./components/rooms/stateManager";
import * as StructureManager from "./components/rooms/structureManager";
// import * as WarManager from "./components/war/warManager";

import * as Profiler from "screeps-profiler";
import { log } from "lib/logger/log";

import { empire } from "./Empire";

import { ErrorMapper } from "utils/ErrorMapper";

import { commandConsole } from "./commandConsole";

if (Config.USE_PROFILER) {
  Profiler.enable();
}

// log.info(`Scripts bootstrapped`);
// if (__REVISION__) {
// log.info(`Revision ID: ${__REVISION__}`);
// }

global.cc = commandConsole;


// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  if (Game.time % 10 == 0)
    console.log(`Current game tick is ${Game.time}`);

  // Check memory for null or out of bounds custom objects
  if (!Memory.uuid || Memory.uuid > 100) {
    Memory.uuid = 0;
  }

  // empire = new Empire();
  empire.init();
  global.emp = empire;

  // let creeps: Creep[] = [];
  // for (const i in Game.rooms) {
  // const room: Room = Game.rooms[i];
  // const roomCreeps: Creep[] = room.find(FIND_MY_CREEPS);
  // if (roomCreeps && roomCreeps.length) {
  // creeps = creeps.concat(roomCreeps);
  // }
  // }

  let operations = OperationManager.init()
  for (let op of operations) {
    op.spawn();
  }
  for (let op of operations) {
    op.work();
  }
  for (let op of operations) {
    op.finalize();;
  }

  let spawnAction: boolean = false;

  for (const i in Game.rooms) {
    const room: Room = Game.rooms[i];

    // spawnAction = CreepManager.run(room, creeps, spawnAction);
    if (Game.time % 20 === 0) {
      try {
        StateManager.run(room);
      } catch (e) {
        console.log("Error running statemanager!");
        console.log(e.stack);
      }
    }
    try {
      StructureManager.run(room);
    } catch (e) {
      console.log("Error running structuremanager!");
      console.log(e.stack);
    }
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
});
