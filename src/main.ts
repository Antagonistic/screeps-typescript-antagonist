// __PROFILER_ENABLED__ = true;

import * as Config from "./config/config";

import * as CreepManager from "creeps/creepManager";
// import * as FlagManager from "./components/flags/flagManager";
import * as OperationManager from "operation/operationManager";
import * as StateManager from "rooms/stateManager";
import * as StructureManager from "rooms/structureManager";
// import * as WarManager from "./components/war/warManager";

import { log } from "lib/logger/log";
// import * as Profiler from "screeps-profiler";
// import { Profiler } from "./Profiler";
import * as Profiler from "./Profiler";

import { Empire } from "./Empire";

import { ErrorMapper } from "utils/ErrorMapper";

import { commandConsole } from "./commandConsole";

// var Traveler = require('Traveler');

import { Traveler } from "utils/Traveler"


/*if (Config.USE_PROFILER) {
  Profiler.enable();
}*/

// log.info(`Scripts bootstrapped`);
// if (__REVISION__) {
// log.info(`Revision ID: ${__REVISION__}`);
// }

global.Profiler = Profiler.init();
global.cc = commandConsole;

function initMemory() {
  _.defaultsDeep(Memory, {
    cpu: {
      average: Game.cpu.getUsed(),
      history: []
    },
    profiler: {},
    uuid: 0
  });
}

initMemory();

// console.log(__PROFILER_ENABLED__);

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export const loop = ErrorMapper.wrapLoop(() => {
  if (Game.time % 10 === 0) {
    console.log(`Current game tick is ${Game.time}`);
  }

  // Check memory for null or out of bounds custom objects
  if (!Memory.uuid || Memory.uuid > 100) {
    Memory.uuid = 0;
  }

  // empire = new Empire();
  // empire.init();
  // Profiler.start("init");
  global.emp = new Empire();
  const operations = OperationManager.init()
  // Profiler.end("init");

  // Profiler.start("spawn");
  for (const op of operations) {
    op.spawn();
  }
  // Profiler.end("spawn");

  // Profiler.start("work");
  for (const op of operations) {
    op.work();
  }
  // Profiler.end("work")

  // Profiler.start("final");
  for (const op of operations) {
    op.finalize();
  }
  for (const spawn in global.emp.spawnRooms) {
    const logic = global.emp.spawnRooms[spawn].logistics;
    logic.finalize();
  }
  // Profiler.end("final");

  /*
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
  */

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
  // try { Profiler.finalize(); } catch (e) { console.log("error checking Profiler:\n", e.stack); }
});
