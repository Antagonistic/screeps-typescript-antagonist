import { SpawnRoom } from "./SpawnRoom";

export class WorldMap implements IWorldMap {
  public controlledRooms: { [roomName: string]: Room } = {};

  // public foesMap: {[roomName: string]: RoomMemory } = {};
  // public foesRooms: Room[] = [];

  public init(): { [roomName: string]: SpawnRoom } {
    const spawnGroups: { [roomName: string]: SpawnRoom } = {};
    for (const roomName in Game.rooms) {
      const memory = Memory.rooms[roomName];
      const room = Game.rooms[roomName];

      if (room) {
        // this.updateMemory(room);
        if (room.controller && room.controller.my) {
          // this.radar(room);
          this.controlledRooms[roomName] = room;
          if (room.find(FIND_MY_SPAWNS).length > 0) {
            spawnGroups[roomName] = new SpawnRoom(room);
          }
        }
      }
    }
    return spawnGroups;
  }


  public expandInfluence(spawn: SpawnRoom) {
    const originName = spawn.room.name;
    const level = spawn.rclLevel;
    const neighbors = _.values(Game.map.describeExits(originName)) as string[];
    let range = 1;
    if (level >= 6) { range = 2; }
    const rooms = WorldMap.findRoomsInRange(originName, range);
    const remoteList = [];
    for (const r of rooms) {
      remoteList.push(r);
      if (!Memory.rooms[r].spawns) { Memory.rooms[r].spawns = []; };
      if (Memory.rooms[r].home) {
        if (Memory.rooms[r].home === originName) {
          Memory.rooms[r].homelevel = level;
          continue;
        }
      } else {
        if (Memory.rooms[r].homelevel! < level) {
          Memory.rooms[r].home = originName;
          Memory.rooms[r].homelevel = level;
          continue;
        }
      }

    }
  }

  /**
	  * Lists all rooms up to a given distance away, including roomName
	  */
  public static findRoomsInRange(roomName: string, depth: number): string[] {
    return _.flatten(_.values(this.recursiveRoomSearch(roomName, depth)));
  }

	/**
	 * Lists all rooms up at a given distance away, including roomName
	 */
  public static findRoomsAtRange(roomName: string, depth: number): string[] {
    return this.recursiveRoomSearch(roomName, depth)[depth];
  }

	/**
	 * Recursively enumerate all rooms from a root node using depth first search to a maximum depth
	 */
  public static recursiveRoomSearch(roomName: string, maxDepth: number): { [depth: number]: string[] } {
    const visitedRooms = this._recursiveRoomSearch(roomName, 0, maxDepth, {});
    const roomDepths: { [depth: number]: string[] } = {};
    for (const room in visitedRooms) {
      const depth = visitedRooms[room];
      if (!roomDepths[depth]) {
        roomDepths[depth] = [];
      }
      roomDepths[depth].push(room);
    }
    return roomDepths;
  }

	/**
	 * The recursive part of recursiveRoomSearch. Yields inverted results mapping roomName to depth.
	 */
  private static _recursiveRoomSearch(roomName: string, depth: number, maxDepth: number,
    visited: { [roomName: string]: number }): { [roomName: string]: number } {
    if (visited[roomName] === undefined) {
      visited[roomName] = depth;
    } else {
      visited[roomName] = Math.min(depth, visited[roomName]);
    }
    const neighbors = _.values(Game.map.describeExits(roomName)) as string[];
    if (depth < maxDepth) {
      for (const neighbor of neighbors) {
        // Visit the neighbor if not already done or if this would be a more direct route
        if (visited[neighbor] === undefined || depth + 1 < visited[neighbor]) {
          this._recursiveRoomSearch(neighbor, depth + 1, maxDepth, visited);
        }
      }
    }
    return visited;
  }

	/**
	 * Get the type of the room
	 */
  /*public static roomType(roomName: string): 'SK' | 'CORE' | 'CTRL' | 'ALLEY' {
    const coords = this.getRoomCoordinates(roomName);
    if (coords.x % 10 === 0 || coords.y % 10 === 0) {
      return ROOMTYPE_ALLEY;
    } else if (coords.x % 10 != 0 && coords.x % 5 === 0 && coords.y % 10 != 0 && coords.y % 5 === 0) {
      return ROOMTYPE_CORE;
    } else if (coords.x % 10 <= 6 && coords.x % 10 >= 4 && coords.y % 10 <= 6 && coords.y % 10 >= 4) {
      return ROOMTYPE_SOURCEKEEPER;
    } else {
      return ROOMTYPE_CONTROLLER;
    }
  }*/
}
