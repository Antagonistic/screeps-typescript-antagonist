// __PROFILER_ENABLED__ = true;

import './proto/Creep';
import './proto/Misc';
import './proto/Room';
import './proto/RoomPosition';
import './proto/RoomVisual';

import * as Config from "./config/config";

// import * as FlagManager from "./components/flags/flagManager";
import * as OperationManager from "operation/operationManager";
// import * as StructureManager from "rooms/structureManager";
// import * as WarManager from "./components/war/warManager";

// import { log } from "lib/logger/log";
// import * as Profiler from "screeps-profiler";
// import { Profiler } from "./Profiler";
import * as Profiler from "./Profiler";

import 'utils/viking'

import { Empire } from "./Empire";

import { ErrorMapper } from "utils/ErrorMapper";

import { commandConsole } from "./commandConsole";

// var Traveler = require('Traveler');

import { AutoLayout } from "rooms/AutoLayout";
import { AutoSnakeLayout } from "rooms/AutoSnakeLayout";
import { HUD } from "rooms/HUD";
import { LayoutVisualizer } from "rooms/layoutVisualizer";
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

global.lastMemoryTick = undefined;

function tryInitSameMemory() {
  if (global.lastMemoryTick && global.LastMemory && Game.time === (global.lastMemoryTick + 1)) {
    delete global.Memory
    global.Memory = global.LastMemory
    RawMemory._parsed = global.LastMemory
  } else {
    // tslint:disable-next-line:no-unused-expression
    Memory;
    global.LastMemory = RawMemory._parsed
  }
  global.lastMemoryTick = Game.time
}

// console.log(__PROFILER_ENABLED__);

// When compiling TS to JS and bundling with rollup, the line numbers and file names in error messages change
// This utility uses source maps to get the line numbers and file names of the original, TS source code
export function unwrappedLoop() {
  tryInitSameMemory();

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
  global.emp.init();
  const operations = OperationManager.init()
  // Profiler.end("init");

  // Profiler.start("spawn");
  for (const op of operations) {
    // console.log(op.name + " " + op.priority);
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


  for (const i in Game.rooms) {
    const room: Room = Game.rooms[i];
    if (room.memory.visual) {
      new LayoutVisualizer(room.name).run();
      // new AutoSnakeLayout(room.name).run(true);
    }
  }

  // Automatically delete memory of missing creeps
  for (const name in Memory.creeps) {
    if (!(name in Game.creeps)) {
      delete Memory.creeps[name];
    }
  }
  new HUD().run();
  // try { Profiler.finalize(); } catch (e) { console.log("error checking Profiler:\n", e.stack); }
};

export const loop = ErrorMapper.wrapLoop(unwrappedLoop);
