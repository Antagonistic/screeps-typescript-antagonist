// import * as CreepManager from "./components/creeps/creepManager";
// import * as soldier from "./components/creeps/roles/soldier";

import * as roomHelper from "./rooms/roomHelper"

import { log } from "./lib/logger/log";

// import { empire } from "./Empire";

import { Empire } from "Empire";
import { SpawnRoom } from "./rooms/SpawnRoom";

import { LogisticsManager } from "operation/LogisticsManager";
import * as layout from "rooms/layoutManager";

export const commandConsole = {
  ping(): void {
    console.log("PONG!");
  },
  getState(roomName: string): void {
    const room = Game.rooms[roomName];
    if (room) {
      const state: RoomStates = room.memory.state;
      if (state) {
        console.log(state);
      }
    }
  },
  report(): void {
    for (const _sR in global.emp.spawnRooms) {
      global.emp.spawnRooms[_sR].logistics.report();
    }
  },
  runBuild(flagName: string, rcl: number = -1): void {
    if (Game.flags[flagName]) {
      const f = Game.flags[flagName];
      if (f.room) {
        layout.run(f.room, f.pos, rcl);
      }
    }
  },
  runBuildRoad(roomName: string) {
    if (global.emp.spawnRooms[roomName]) {
      return (global.emp.spawnRooms[roomName].logistics as LogisticsManager).buildRoads();
    } else {
      console.log('Could not find logistics for ' + roomName);
      console.log('Valid options: ' + Object.keys(global.emp.spawnRooms));
    }
    return 0;
  },
  setSupervisorPos(roomName: string, pos?: LightRoomPos[]) {
    if (!pos || pos.length === 0) { Game.rooms[roomName].memory.supervisor = undefined; return; }
    Game.rooms[roomName].memory.supervisor = [];
    for (const sup of pos) {
      Game.rooms[roomName].memory.supervisor!.push({ x: sup.x, y: sup.y });
    }
  },
  clearConstruct() {
    for (const _c in Game.constructionSites) {
      const construct = Game.constructionSites[_c];
      if (construct) {
        construct.remove();
      }
    }
  },
  showCost(roomName: string) {
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
  visual(roomName: string, withCost: boolean = false) {
    if (global.emp.spawnRooms[roomName]) {
      if (withCost) { this.showCost(roomName); }
      return (global.emp.spawnRooms[roomName].logistics as LogisticsManager).getRoads();
    } else {
      console.log('Could not find logistics for ' + roomName);
      console.log('Valid options: ' + Object.keys(global.emp.spawnRooms));
    }
    return 0;
  },
  // spawnSoldier(roomName: string, subrole: string = "archer", roomTarget?: string): boolean {
  //   const room = Game.rooms[roomName];
  //   if (room) {
  //     const spawn: SpawnRoom = empire.spawnRooms.W9N38;
  //     if (spawn && spawn.availableSpawnCount) {
  //       // const spawn: Spawn = spawns[0];
  //       if (spawn.availableSpawnCount) {
  //         let creepRoom: Room = room;
  //         if (roomTarget) {
  //           const rT: Room = Game.rooms[roomTarget];
  //           if (rT && Game.map.isRoomAvailable(roomTarget)) {
  //             creepRoom = rT;
  //           }
  //         }
  //         if (soldier.build(creepRoom, spawn, subrole, "null", false)) {
  //           log.info("Soldier spawned: " + subrole);
  //           return true;
  //         }
  //       }
  //     }
  //   }
  //   return false;
  // },
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
  }
  // newSquad() {
  //   if (!Memory.squads) {
  //     Memory.squads = {};
  //   }
  //   const squad: Squad = { name: "squad1", composition: { archer: 2, brawler: 1 }, members: [], assignedRoom: "W22N34" };
  //   console.log("Squad " + squad.name + " created.");
  //   Memory.squads[squad.name] = squad;
  // },
  // clearSquads() {
  //   for (const name in Memory.creeps) {
  //     if (Game.creeps[name]) {
  //       if (Memory.creeps[name].squad) {
  //         Memory.creeps[name].recycle = true;
  //       }
  //     }
  //   }
  //   Memory.squads = {};
  // }
};
