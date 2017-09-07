
export function run(room: Room): void {
  if (room.find(FIND_MY_SPAWNS).length > 0) {
    room.memory.state = RoomStates.BOOTSTRAP;
  } else if (!room.controller || !room.controller.my) {
    room.memory.state = RoomStates.NEUTRAL;
  }
}
