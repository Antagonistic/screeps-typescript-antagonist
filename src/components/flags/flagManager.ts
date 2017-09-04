import RoomStates from "../state/roomStates";

export function run(): void {
  for (const f in Game.flags) {
    const flag: Flag = Game.flags[f];
    const roomState: RoomStates = Memory.rooms[flag.pos.roomName].state;

    console.log(flag.pos.roomName + " state is " + roomState);
    flag.remove();
  }
}
