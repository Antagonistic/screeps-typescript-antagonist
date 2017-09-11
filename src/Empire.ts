import {SpawnRoom} from "./components/rooms/SpawnRoom";
import {WorldMap} from "./components/rooms/WorldMap";

// export let empire: Empire;

export class Empire {
  public spawnRooms: {[roomName: string]: SpawnRoom};
  public map: WorldMap;

  constructor() {
    if (!Memory.empire) Memory.empire = {};
  }

  public init() {
    this.map = new WorldMap();
    this.spawnRooms = this.map.init();
  }
}

export let empire: Empire = new Empire();
