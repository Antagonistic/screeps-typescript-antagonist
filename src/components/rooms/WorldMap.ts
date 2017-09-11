import {SpawnRoom} from "./SpawnRoom";

export class WorldMap {
  public controlledRooms: {[roomName: string]: Room } = {};

  // public foesMap: {[roomName: string]: RoomMemory } = {};
  // public foesRooms: Room[] = [];

  public init(): {[roomName: string]: SpawnRoom } {
    const spawnGroups: {[roomName: string]: SpawnRoom } = {};
    for (const roomName in Memory.rooms) {
      // const memory = Memory.rooms[roomName];
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

      // if (this.diplomat.allies[memory.owner]) {
      //   this.allyMap[roomName] = memory;
      //   if (room) { this.allyRooms.push(room); }
      // }
      // if (this.diplomat.foes[memory.owner]) {
      //   this.foesMap[roomName] = memory;
      //   if (room) { this.foesRooms.push(room); }
      // }
      // if (memory.nextTrade) {
      //   this.tradeMap[roomName] = memory;
      //   if (room) { this.tradeRooms.push(room); }
      // }
    }
    return spawnGroups;
  }
}
