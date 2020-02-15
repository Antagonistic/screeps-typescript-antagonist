// import * as CreepManager from "./components/creeps/creepManager";
// import * as soldier from "./components/creeps/roles/soldier";

import { roomHelper } from "./rooms/roomHelper"

// import { log } from "./lib/logger/log";

// import { empire } from "./Empire";

import { Empire } from "Empire";
import { SpawnRoom } from "./rooms/SpawnRoom";

import * as viking from 'utils/viking';

import { MarketManager } from "market/MarketManager";
import { LogisticsManager } from "operation/LogisticsManager";
import { buildHelper } from "rooms/buildHelper";
import { defenceHelper } from "rooms/defenceHelper";
import { layoutManager } from "rooms/layoutManager";

function getRoom(roomName: string) {
  return Game.rooms[roomName];
}

function getLogistics(roomName: string) {
  return (global.emp.spawnRooms[roomName].logistics as LogisticsManager);
}
function getSpawnRoom(roomName: string) {
  return global.emp.spawnRooms[roomName];
}

function getFlag(flagName: string) {
  return Game.flags[flagName];
}

const defaultRoom = "W16S29";

export const commandConsole = {
  ping(): void {
    console.log("PONG!");
  },
  /*getState(roomName: string = defaultRoom): void {
    const room = Game.rooms[roomName];
    if (room) {
      const state: RoomStates = room.memory.state;
      if (state) {
        console.log(state);
      }
    }
  },*/
  clearFlags() {
    for (const _f in Game.flags) {
      if (_f.indexOf('invader') > 0) { Game.flags[_f].remove(); }
      if (_f.indexOf('deposit') > 0) { Game.flags[_f].remove(); }
      if (_f.indexOf('power') > 0) { Game.flags[_f].remove(); }
      if (_f.indexOf('mining') > 0) { Game.flags[_f].remove(); }
    }
  },
  defenceTest(roomName: string = defaultRoom) {
    const room = getRoom(roomName);
    const layoutObjects = _.flatten(Object.values(room.memory.structures)) as UnserializedRoomPosition[];
    const simResult = defenceHelper.assaultRampartSim(room, layoutObjects);
    if (simResult === true) {
      return true;
    }
    if (simResult === false) {
      return true;
    }
    for (const p of simResult) {
      const pos = roomHelper.deserializeRoomPosition(p);
      if (pos) {
        // pos.createConstructionSite(STRUCTURE_RAMPART);
        room.visual.circle(p.x, p.y);
      }
    }
    return `success ${simResult.length} created`
  },
  defenceClear(roomName: string = defaultRoom, all: boolean = false) {
    const room = getRoom(roomName);
    for (const r of room.find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_RAMPART || x.structureType === STRUCTURE_WALL })) {
      if (!all) {
        if (room.controller) { if (r.pos.inRangeTo(room.controller, 3)) { continue; } }
        for (const s of room.find(FIND_SOURCES)) {
          if (r.pos.inRangeTo(s, 3)) { continue; }
        }
        if (r.pos.lookForStructure(STRUCTURE_STORAGE)) { continue; }
        if (r.pos.lookForStructure(STRUCTURE_TERMINAL)) { continue; }
        if (r.pos.lookForStructure(STRUCTURE_SPAWN)) { continue; }
        if (r.pos.lookForStructure(STRUCTURE_POWER_SPAWN)) { continue; }
        if (r.pos.lookForStructure(STRUCTURE_LAB)) { continue; }
        if (r.pos.lookForStructure(STRUCTURE_CONTAINER)) { continue; }
        if (r.pos.lookForStructure(STRUCTURE_LINK)) { continue; }
        if (r.pos.lookForStructure(STRUCTURE_TOWER)) { continue; }
      }
      r.destroy();
    }
  },
  report(roomName?: string): void {
    for (const _sR in global.emp.spawnRooms) {
      if (roomName && global.emp.spawnRooms[_sR].room.name !== roomName) { continue; }
      global.emp.spawnRooms[_sR].logistics.report();
    }
  },
  runBuild(roomName: string = defaultRoom, runOnce: boolean = true): void {
    const room = getRoom(roomName);
    if (room) {
      if (runOnce) {
        buildHelper.runIterativeBuild(room, getSpawnRoom(roomName));
      }
      else {
        buildHelper.runBuildStructure(room, runOnce, true, true);
      }
    }
  },
  runBuildRoad(roomName: string = defaultRoom) {
    if (global.emp.spawnRooms[roomName]) {
      return getLogistics(roomName).buildRoads();
    } else {
      console.log('Could not find logistics for ' + roomName);
      console.log('Valid options: ' + Object.keys(global.emp.spawnRooms));
    }
    return 0;
  },
  setSupervisorPos(pos?: LightRoomPos[], roomName: string = defaultRoom) {
    if (!pos || pos.length === 0) { Game.rooms[roomName].memory.supervisor = undefined; return; }
    Game.rooms[roomName].memory.supervisor = [];
    for (const sup of pos) {
      Game.rooms[roomName].memory.supervisor!.push({ x: sup.x, y: sup.y });
    }
  },
  clearConstruct() {
    for (const _c in Game.constructionSites) {
      const construct = Game.constructionSites[_c];
      if (construct && construct.progress === 0) {
        construct.remove();
      }
    }
  },
  showCost(roomName: string = defaultRoom) {
    const matrix = roomHelper.createPathfindingMatrix(roomName);
    if (typeof matrix !== "boolean") {
      roomHelper.displayCostMatrix(matrix, roomName, true);
      console.log('shown');
      return 0;
    } else {
      console.log('could not create matrix');
      return 1;
    }
  },
  visual(roomName: string = defaultRoom, withCost: boolean = false) {
    if (global.emp.spawnRooms[roomName]) {
      if (withCost) { this.showCost(roomName); }
      return getLogistics(roomName).getRoads();
    } else {
      console.log('Could not find logistics for ' + roomName);
      console.log('Valid options: ' + Object.keys(global.emp.spawnRooms));
    }
    return 0;
  },
  sellEnergy(roomName: string = defaultRoom, amount: number = -1) {
    if (amount === -1) {
      const room = Game.rooms[roomName];
      if (!room) {
        console.log('Could not find room ' + roomName);
        return 1;
      }
      amount = room.terminal!.store.energy * 0.8;
    }
    return Game.market.createOrder({ type: ORDER_SELL, resourceType: RESOURCE_ENERGY, price: 0.003, totalAmount: amount, roomName });
  },
  layoutCoord(x: number, y: number, roomName: string = defaultRoom) {
    return JSON.stringify(layoutManager.layoutCoord(getRoom(roomName), x, y));
  },
  addLayout(flagName: string, layout: string) {
    const flag = getFlag(flagName);
    if (!flag) { return "invalid flag"; }
    // const room = flag!.room;
    // if (!room) { return "no room visibility"; }
    const roomName = flag.pos.roomName;
    if (!Memory.rooms[roomName]) { Memory.rooms[roomName] = { structures: {} } }
    const mem = Memory.rooms[roomName];
    if (mem.layout) {
      if (_.any(mem.layout, x => x.flagName === flagName && x.name === layout)) { return "already added"; }
    } else {
      mem.layout = [];
    }
    mem.layout.push({ name: layout, flagName });
    return "success"
  },
  clearLayout(roomName: string) {
    const room = getRoom(roomName);
    if (!room) { return "invalid room"; }
    room.memory.layout = undefined;
    return "success";
  },
  listLayout(roomName: string = defaultRoom) {
    const room = getRoom(roomName);
    if (!room) { return "invalid room"; }
    if (!room.memory.layout || room.memory.layout.length === 0) {
      return "empty layout";
    }
    for (const l of room.memory.layout) {
      console.log(JSON.stringify(l));
    }
    return "success";
  },
  runMarket(realRun: boolean = false) {
    return new MarketManager().run(realRun);
  },
  fireSale(realRun: boolean = false, roomName?: string) {
    return new MarketManager().fireSale(realRun, roomName);
  },
  assignRoom(creepId: string, roomName: string) {
    const creep: Creep | null = Game.getObjectById(creepId);
    if (creep) {
      creep.memory.room = roomName;
      return true;
    } else {
      const creepByName: Creep = Game.creeps[creepId];
      if (creepByName) {
        creepByName.memory.room = roomName;
        return true;
      }
    }
    return false;
  },
  testExpand() {
    for (const _sR in global.emp.spawnRooms) {
      const influence = global.emp.map.expandInfluence(global.emp.spawnRooms[_sR]);
      console.log(_sR + "  " + influence.length);
    }
    return "success";
  },
  vis(roomName: string = defaultRoom) {
    // const room = getRoom(roomName);
    if (!Memory.rooms[roomName]) {
      return "no room";
    }
    Memory.rooms[roomName].visual = true;
    const room = getRoom(roomName);
    if (room) { layoutManager.applyLayouts(room); }
    // room.memory.visual = true;
    return "success";
  },
  visOff() {
    for (const m in Memory.rooms) {
      const mem = Memory.rooms[m];
      mem.visual = undefined;
    }
  },
  debugOff() {
    for (const c in Memory.creeps) {
      const mem = Memory.creeps[c];
      mem.debug = undefined;
    }
  },
  myResources(hide: boolean = false) {
    return viking.myResources(hide);
  }
};
