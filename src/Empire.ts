import {SpawnRoom} from "./components/rooms/SpawnRoom";
import {WorldMap} from "./components/rooms/WorldMap";

// export let empire: Empire;

export class Empire implements IEmpire {
  public spawnRooms: {[roomName: string]: SpawnRoom};
  public map: WorldMap;
  public operations: {[operationName: string]: IOperation};

  constructor() {
    if (!Memory.empire) Memory.empire = {};
    this.operations = {};
  }

  public init(): void {
    this.map = new WorldMap();
    this.spawnRooms = this.map.init();
  }
}

export const empire: Empire = new Empire();
