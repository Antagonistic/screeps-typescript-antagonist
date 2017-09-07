import * as StateManager from "../stateManager";

export function run(room: Room): void {
  if (room.energyCapacityAvailable > 500) {
    StateManager.stateChange(room, RoomStates.TRANSITION);
  } else if (!room.controller || !room.controller.my) {
    StateManager.stateChange(room, RoomStates.NEUTRAL);
  }
}
