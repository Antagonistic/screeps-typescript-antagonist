import * as StateManager from "../stateManager";

export function run(room: Room): void {
  if (room.find(FIND_MY_SPAWNS).length > 0) {
    StateManager.stateChange(room, RoomStates.BOOTSTRAP);
  }
  if (!room.memory.home) {
    room.memory.home = Game.spawns.Antagonist.room.name;
  }
}
