import { SpawnRoom } from "./rooms/SpawnRoom";
import { WorldMap } from "./rooms/WorldMap";

// export let empire: Empire;

export class Empire implements IEmpire {
  public defaultSpawn: SpawnRoom;
  public spawnRooms: { [roomName: string]: SpawnRoom };
  public map: WorldMap;
  // public operations: { [operationName: string]: Operation };

  constructor() {
    if (!Memory.empire) { Memory.empire = {}; }
    // this.operations = {};
    this.map = new WorldMap();
    this.spawnRooms = this.init();
    this.defaultSpawn = _.sortByOrder(_.toArray(this.spawnRooms), (x: SpawnRoom) => x.rclLevel)[0];
  }

  protected init(): { [roomName: string]: SpawnRoom } {
    // this.map = new WorldMap();
    return this.map.init();
  }

  public getSpawnRoom(roomName: string): SpawnRoom {
    if (roomName == null) { return this.defaultSpawn; }
    if (this.spawnRooms[roomName]) {
      return this.spawnRooms[roomName];
    }
    if (Game.rooms[roomName] && Game.rooms[roomName].memory.spawnRoom && Game.time % 1000 !== 60) {
      const memSpawn = Game.rooms[roomName].memory.spawnRoom!;
      if (this.spawnRooms[memSpawn]) {
        return this.spawnRooms[memSpawn];
      } else {
        Game.rooms[roomName].memory.spawnRoom = undefined;
      }
    }
    let mindist = 999;
    let retSpawn: SpawnRoom = this.defaultSpawn;
    for (const sp in this.spawnRooms) {
      const dist = Game.map.getRoomLinearDistance(roomName, this.spawnRooms[sp].room.name, false);
      if (dist < mindist) {
        mindist = dist;
        retSpawn = this.spawnRooms[sp];
      }
    }
    if (Game.rooms[roomName]) { Game.rooms[roomName].memory.spawnRoom = retSpawn.room.name; }
    return retSpawn;
  }
}

// export const empire: Empire = new Empire();
