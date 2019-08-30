import { SpawnRoom } from "./components/rooms/SpawnRoom";
import { WorldMap } from "./components/rooms/WorldMap";

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
    this.defaultSpawn = _.sortByOrder(_.toArray(this.spawnRooms), x => x.rclLevel)[0];
  }

  protected init(): { [roomName: string]: SpawnRoom } {
    // this.map = new WorldMap();
    return this.map.init();
  }

  public getSpawnRoom(roomName: string | Room): SpawnRoom {
    if (roomName instanceof Room) { roomName = roomName.name; }
    if (roomName == null) { return this.defaultSpawn; }
    if (this.spawnRooms[roomName]) {
      return this.spawnRooms[roomName];
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
    return retSpawn;
  }
}

// export const empire: Empire = new Empire();
