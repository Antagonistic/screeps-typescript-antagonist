import RoomStates from "../roomStates";

export function run(room: Room): void {
  if (room.energyCapacityAvailable >= 500) {
    room.memory.state = RoomStates.TRANSITION;
  } else if (!room.controller || !room.controller.my) {
    room.memory.state = RoomStates.NEUTRAL;
  }
}
