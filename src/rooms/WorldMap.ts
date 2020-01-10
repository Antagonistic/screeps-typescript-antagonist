import { profile } from "Profiler";
import { SpawnRoom } from "./SpawnRoom";

@profile
export class WorldMap implements WorldMap {
  public controlledRooms: { [roomName: string]: Room } = {};
  public sphere: string[] = [];

  // public foesMap: {[roomName: string]: RoomMemory } = {};
  // public foesRooms: Room[] = [];

  public init(): { [roomName: string]: SpawnRoom } {
    const spawnGroups: { [roomName: string]: SpawnRoom } = {};
    for (const roomName in Game.rooms) {
      if (!Memory.rooms) { Memory.rooms = {} };
      const memory = Memory.rooms[roomName];
      const room = Game.rooms[roomName];

      if (room) {
        // this.updateMemory(room);
        room.memory.lastSeen = Game.time;
        if (room.controller && room.controller.my) {
          this.controlledRooms[roomName] = room;
          if (room.find(FIND_MY_SPAWNS).length > 0) {
            spawnGroups[roomName] = new SpawnRoom(room);
            if (room.memory.remoteRoom) { this.sphere = this.sphere.concat(room.memory.remoteRoom); }
            if (Game.time % 1000 === 673) { this.expandInfluence(spawnGroups[roomName]); }
          }
        }
      }
    }
    for (const _sR in spawnGroups) {
      this.doObserver(spawnGroups[_sR].room);
    }
    return spawnGroups;
  }


  public expandInfluence(spawn: SpawnRoom): string[] {
    const originName = spawn.room.name;
    const level = spawn.rclLevel;
    const neighbors = _.values(Game.map.describeExits(originName)) as string[];
    let range = 1;
    if (level >= 6) { range = 2; }
    if (level >= 8) { range = 4; }
    const rooms = WorldMap.findRoomsInRange(originName, range);
    const remoteList = [];
    for (const r of rooms) {
      // remoteList.push(r);
      if (!Memory.rooms[r]) { Memory.rooms[r] = {}; }
      if (Game.rooms[r]) { Memory.rooms[r].lastSeen = Game.time; }
      // if (!Memory.rooms[r].spawns) { Memory.rooms[r].spawns = []; };
      if (Memory.rooms[r].home) {
        if (Memory.rooms[r].home === originName) {
          Memory.rooms[r].homelevel = level;
          remoteList.push(r);
          continue;
        } else {
          const oldRoute = Game.map.findRoute(r, Memory.rooms[r].home!);
          const newRoute = Game.map.findRoute(r, spawn.room);
          if (newRoute !== -2 && oldRoute !== -2) {
            if (newRoute.length < oldRoute.length) {
              Memory.rooms[r].home = originName;
              Memory.rooms[r].homelevel = level;
              remoteList.push(r);
            }
          }
        }
      } else {
        Memory.rooms[r].home = originName;
        Memory.rooms[r].homelevel = level;
        remoteList.push(r);
      }
    }
    spawn.room.memory.remoteRoom = remoteList;
    return remoteList;
  }

  public doObserver(room: Room) {
    if (!room.controller || !room.controller.my || room.controller.level < 8) { return; }
    const obsrv = room.find<StructureObserver>(FIND_MY_STRUCTURES, { filter: x => x.structureType === STRUCTURE_OBSERVER });
    if (!obsrv || obsrv.length === 0) { return; }
    if (!room.memory.nextScan) { room.memory.nextScan = 0; }
    if (room.memory.nextScan > Game.time) { return; }
    // console.log('NextScan: ' + room.name + ' ' + this.sphere.length);
    const _ob = obsrv[0];
    if (!this.sphere) { return; }
    const target = _.findLast(this.sphere, x => (Memory.rooms[x].lastSeen || 0) < Game.time - 1000);
    if (target) {
      console.log('Observing room ' + target + ': ' + _ob.observeRoom(target));
    }
    room.memory.nextScan = Game.time + _.random(25, 55);
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
