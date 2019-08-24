import { SpawnRoom } from "./components/rooms/SpawnRoom";
import { WorldMap } from "./components/rooms/WorldMap";

// export let empire: Empire;

export class Empire implements IEmpire {
  public spawnRooms: { [roomName: string]: SpawnRoom };
  public map: WorldMap;
  // public operations: { [operationName: string]: Operation };

  constructor() {
    if (!Memory.empire) Memory.empire = {};
    // this.operations = {};
    this.spawnRooms = {};
    this.map = new WorldMap();
  }

  public init(): void {
    // this.map = new WorldMap();
    this.spawnRooms = this.map.init();
  }

  getSpawnRoom(roomName: string | null): SpawnRoom {
    if (roomName == null) return this.spawnRooms[0];
    if (this.spawnRooms[roomName]) {
      return this.spawnRooms[roomName];
    }
    return this.spawnRooms[0];
  }
}

export const empire: Empire = new Empire();
