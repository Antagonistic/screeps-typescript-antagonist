
import RoomStates from "./components/state/roomStates";

// import * as CreepManager from "./components/creeps/creepManager";
import * as soldier from "./components/creeps/roles/soldier";

import { log } from "./lib/logger/log";

export const commandConsole = {
  ping() {
    console.log("PONG!");
  },
  getState(roomName: string): void {
    const room = Game.rooms[roomName];
    if (room) {
      const state: RoomStates = room.memory.state;
      if (state) {
        console.log(RoomStates[state]);
      }
    }
  },
  spawnSoldier(roomName: string, subrole: string = "archer", roomTarget?: string): boolean {
    const room = Game.rooms[roomName];
    if (room) {
      const spawns: Spawn[] = room.find(FIND_MY_SPAWNS);
      if (spawns && spawns.length) {
        const spawn: Spawn = spawns[0];
        if (!spawn.spawning) {
          let creepRoom: Room = room;
          if (roomTarget) {
            const rT: Room = Game.rooms[roomTarget];
            if (rT && Game.map.isRoomAvailable(roomTarget)) {
              creepRoom = rT;
            }
          }
          if (soldier.build(creepRoom, spawn, subrole, null, false)) {
            log.info("Soldier spawned: " + subrole);
            return true;
          }
        }
      }
    }
    return false;
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
  newSquad() {
    if (!Memory.squads) {
      Memory.squads = {};
    }
    const squad: Squad = {name: "squad1", composition: {archer: 2, brawler: 1}, members: [], assignedRoom: "W22N34"};
    console.log("Squad " + squad.name + " created.");
    Memory.squads[squad.name] = squad;
  },
  clearSquads() {
    for (const name in Memory.creeps) {
      if (Game.creeps[name]) {
        if (Memory.creeps[name].squad) {
          Memory.creeps[name].recycle = true;
        }
      }
    }
    Memory.squads = {};
  }
};
