import { TerminalNetwork } from "market/TerminalNetwork";
import { profile } from "Profiler";
import { roomHelper } from "rooms/roomHelper";
import { Traveler } from "utils/Traveler";
import { SpawnRoom } from "./SpawnRoom";
import { RoomLayout } from "layout/RoomLayout";
import { RoomPlanner } from "layout/RoomPlanner";

@profile
export class WorldMap implements WorldMap {
  constructor(termNetwork: TerminalNetwork) {
    this.termNetwork = termNetwork;
  }
  public spawnGroups: { [roomName: string]: SpawnRoom } = {};
  public controlledRooms: { [roomName: string]: Room } = {};
  public sphere: string[] = [];
  public termNetwork: TerminalNetwork;

  // public foesMap: {[roomName: string]: RoomMemory } = {};
  // public foesRooms: Room[] = [];

  public init(): { [roomName: string]: SpawnRoom } {
    // const spawnGroups: { [roomName: string]: SpawnRoom } = {};
    if (!Memory.rooms) { Memory.rooms = {} };

    for (const roomName in Game.rooms) {
      const memory = Memory.rooms[roomName];
      const room = Game.rooms[roomName];
      // console.log('processing ' + roomName);
      if (room.controller) {
        if (room.controller.my) {
          // Update my room
          this.controlledRooms[roomName] = room;
          if (room.find(FIND_MY_SPAWNS).length > 0) {
            this.spawnGroups[roomName] = new SpawnRoom(room);
            if (room.memory.remoteRoom) { this.sphere = this.sphere.concat(room.memory.remoteRoom); }
          }
          if (room.terminal) {
            this.termNetwork.registerTerminal(room.terminal);
          }
        }
      }
    }
    for (const roomName in Game.rooms) {
      const memory = Memory.rooms[roomName];
      const room = Game.rooms[roomName];
      this.processSeenRoom(room);
    }
    /*for (const roomName in Memory.rooms) {
      const memory = Memory.rooms[roomName];
      if (memory.hostile) {

      }
    }*/
    for (const _sR in this.spawnGroups) {
      this.doObserver(this.spawnGroups[_sR].room);
    }
    return this.spawnGroups;
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
      if (!Memory.rooms[r]) { Memory.rooms[r] = { structures: {} } }
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
    spawn.room.memory.neighbors = neighbors;
    return remoteList;
  }

  public processRoomCache(room: Room) {
    const mem = room.memory;
    if ((room.UUID + Game.time) % 1000 === 0) {
      if (room.controller && room.controller.my) {
        // Owned room
        // if (room.memory.layoutTime && Game.time >= room.memory.layoutTime) {
        let layout = new RoomLayout(room.name);
        if (!layout.data.valid) {
          layout = new RoomPlanner(room.name);
        }
        if (layout.data.valid) {
          layout.applyLayout();
        } else {
          console.log(`ROOMPLANNER: No valid layout for ${room.print} core room!`);
        }
        // layoutManager.applyLayouts(room);
        if (room.memory.dest && room.memory.dest.length > 0) {
          const center = room.storage || _.head(room.find(FIND_MY_SPAWNS));
        }
        // }
        room.memory.dest = undefined;
        room.memory.controllerBattery = undefined;
      } else {
        // Other
      }
    }
  }

  public processSeenRoom(room: Room) {
    if (!room) { return; }
    const roomName = room.name;
    Traveler.updateRoomStatus(room);
    this.processRoomCache(room);
    room.memory.lastSeen = Game.time;
    if (room.memory.sourcesPos === undefined) {
      const source = room.sortedSources;
      if (source && source.length > 0) {
        room.memory.sourcesPos = source.map(x => x.pos);
      } else {
        room.memory.sourcesPos = null;
      }
    }
    if (room.memory.controllerPos === undefined) {
      if (room.controller) {
        room.memory.controllerPos = room.controller.pos;
        if (room.controller.owner) {
          room.memory.owner = room.controller.owner.username;
        } else {
          delete room.memory.owner;
        }
      } else {
        room.memory.controllerPos = null;
      }
    }
    if (room.memory.mineralInfo === undefined) {
      const mineral = _.head(room.find(FIND_MINERALS));
      if (mineral) {
        room.memory.mineralInfo = { pos: mineral.pos, type: mineral.mineralType, density: mineral.density };
      } else {
        room.memory.mineralInfo = null;
      }
    }
    if (!room.memory.center) {
      if (room.controller) {
        room.memory.center = roomHelper.getSpotCandidate1(room.controller.pos) || roomHelper.findClosestPlainTile(new RoomPosition(25, 25, room.name));
      } else {
        room.memory.center = roomHelper.findClosestPlainTile(new RoomPosition(25, 25, room.name));
      }
    }
    if (!room.memory.neighbors) {
      room.memory.neighbors = [];
      _.each(Object.values(Game.map.describeExits(room.name)), x => {
        if (x) { room.memory.neighbors?.push(x); }
      });
    }

    if (room.controller) {
      if (room.controller.my) {
        // Update my room
        if (room.find(FIND_MY_SPAWNS).length > 0) {
          if (Game.time % 1000 === 673) { this.expandInfluence(this.spawnGroups[roomName]); }
        }
      } else if (room.controller.owner && !room.controller.my) {

        room.memory.hostile = true;
      } else {
        if (room.find(FIND_HOSTILE_STRUCTURES, { filter: x => x.structureType === STRUCTURE_INVADER_CORE }).length > 0) {
          this.processInvaderRoom(room);
        } else {
          const flags = room.flags;
          if (!_.any(flags, x => x.name.indexOf('controller') > -1 || x.name.indexOf('mining') > -1 || x.name.indexOf('source') > -1)) {
            // this.remoteMineCandidate(room);
          }
        }
      }
    } else {
      // Non-controller room
      // this.processNonControlRoom(room);
    }
  }

  public remoteMineCandidate(room: Room) {
    const sources = room.find(FIND_SOURCES);
    // potential remote mining
    if (sources.length > 0) {

      // console.log('Room ' + room.name + ' a possible remote mining candidate');
      if (room.memory.home) {
        if (room.dangerousHostiles.length === 0 &&
          !room.owner && !room.reserved) {
          const spawnRoom = global.emp.getSpawnRoom(room.memory.home) as SpawnRoom;
          if (spawnRoom.room.memory.neighbors && spawnRoom.room.memory.neighbors.find(x => x === room.name)) {
            // Neighbor clear room!
            if (sources.length > 2) {
              room.createFlag(25, 25, "source_" + room.name + 'S');
            } else {
              room.createFlag(25, 25, "mining_" + room.name + 'M');
            }
            console.log('Creating remote mining room ' + room.name);
          }
        }
      }
    }
  }

  public processNonControlRoom(room: Room) {
    const type = roomHelper.roomType(room.name);
    room.memory.type = type;
    if (type === 'SK') {
      if (this.isNeighborToSpawn(room) && !_.any(room.flags, x => x.name.indexOf('source') > -1)) {
        room.createFlag(25, 25, 'source_' + room.name + 'S');
        console.log('Creating remote SK room ' + room.name);
      }
    }
    if (type === 'ALLEY') {
      const deposits = room.find(FIND_DEPOSITS);
      if (deposits && deposits.length > 0) {
        if (!_.any(room.flags, x => x.name.indexOf('deposit') > -1)) {
          room.createFlag(deposits[0].pos, 'deposit_' + room.name + 'D');
          console.log('Creating remote deposit room ' + room.name);
        }
      }
      const power = room.find(FIND_DEPOSITS);
      if (power && power.length > 0) {
        if (!_.any(room.flags, x => x.name.indexOf('power') > -1)) {
          room.createFlag(power[0].pos, 'power_' + room.name + 'P');
          console.log('Creating remote power room ' + room.name);
        }
      }
    }
  }

  public processInvaderRoom(room: Room) {
    const core = _.head(room.find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_INVADER_CORE }));
    if (core) {
      if (!_.any(room.flags, x => x.name.indexOf('invader') > -1)) {
        room.createFlag(core.pos, 'invader_' + room.name + 'I');
        console.log('Creating remote invader room ' + room.name);
      }
    }
  }

  public isNeighborToSpawn(room: Room): boolean {
    if (!room.memory.home) { return false; }
    const spawnRoom = this.spawnGroups[room.memory.home];
    if (spawnRoom && spawnRoom.room.memory.neighbors && spawnRoom.room.memory.neighbors.find(x => x === room.name)) {
      return true;
    }
    return false;
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

}
