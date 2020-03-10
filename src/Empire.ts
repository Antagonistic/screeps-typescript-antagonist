import { TerminalNetwork } from "market/TerminalNetwork";
import { profile } from "Profiler";
import { SpawnRoom } from "./rooms/SpawnRoom";
import { WorldMap } from "./rooms/WorldMap";

// export let empire: Empire;

@profile
export class Empire {
  public defaultSpawn: SpawnRoom;
  public spawnRooms: { [roomName: string]: SpawnRoom } = {};
  public map: WorldMap;
  public termNetwork: TerminalNetwork;
  // public operations: { [operationName: string]: Operation };

  constructor() {
    if (!Memory.empire) { Memory.empire = {}; }
    if (!Memory.sign) { Memory.sign = "FooBar"; }
    // this.operations = {};
    this.termNetwork = new TerminalNetwork();
    this.map = new WorldMap(this.termNetwork);
    // this.spawnRooms = this.init();
    this.defaultSpawn = _.sortByOrder(_.toArray(this.spawnRooms), (x: SpawnRoom) => x.rclLevel)[0];
  }

  public init(): { [roomName: string]: SpawnRoom } {
    // this.map = new WorldMap();
    this.spawnRooms = this.map.init();
    return this.spawnRooms;
  }

  public getSpawnRoom(roomName: string, minRCL?: number): SpawnRoom {
    if (roomName == null) { return this.defaultSpawn; }
    if (this.spawnRooms[roomName]) {
      return this.spawnRooms[roomName];
    }
    if (Memory.rooms[roomName] && Memory.rooms[roomName].spawnRoom && (Game.time % 1000 !== 60)) {
      const memSpawn = Memory.rooms[roomName].spawnRoom!;
      if (this.spawnRooms[memSpawn]) {
        return this.spawnRooms[memSpawn];
      } else {
        Memory.rooms[roomName].spawnRoom = undefined;
      }
    }
    let minroomdist = 999;
    let retSpawn: SpawnRoom = this.defaultSpawn;
    for (const sp in this.spawnRooms) {
      if (minRCL) {
        if (this.spawnRooms[sp].rclLevel < minRCL) { continue; }
      }
      // const dist = Game.map.getRoomLinearDistance(roomName, this.spawnRooms[sp].room.name, false);
      const route = Game.map.findRoute(roomName, this.spawnRooms[sp].room.name);
      if (route === -2) { continue; }
      if (route.length < minroomdist) {
        minroomdist = route.length;
        retSpawn = this.spawnRooms[sp];
      }
    }
    if (Memory.rooms[roomName] && Memory.rooms[roomName].spawnRoom != retSpawn.room.name) {
      console.log(`EMPIRE: Spawnroom for ${roomName} is set to ${retSpawn.room.print}`);
    }
    Memory.rooms[roomName].spawnRoom = retSpawn.room.name;

    return retSpawn;
  }
}

// export const empire: Empire = new Empire();
