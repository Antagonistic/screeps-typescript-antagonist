import * as StateManager from "../stateManager";

export function run(room: Room): void {
  if (room.find(FIND_MY_SPAWNS).length > 0) {
    StateManager.stateChange(room, RoomStates.BOOTSTRAP);
  } else if (!room.controller || !room.controller.my) {
    StateManager.stateChange(room, RoomStates.NEUTRAL);
  }
}
