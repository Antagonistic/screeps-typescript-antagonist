
export function run(): void {
  for (const f in Game.flags) {
    const flag: Flag = Game.flags[f];
    const roomState: RoomStates = Memory.rooms[flag.pos.roomName].state;
    const roomName: string = flag.pos.roomName;

    if (flag.name.toLowerCase() === "rally") {
      if (!Memory.rooms[roomName]) {
        Memory.rooms[roomName] = {};
      }
      Memory.rooms[roomName].rally = flag.pos;
      console.log("Rally location updated");
    }

    if (Memory.squads && Memory.squads[flag.name]) {
      Memory.squads[flag.name].assignedRoom = roomName;
      if (!Memory.rooms[roomName]) {
        Memory.rooms[roomName] = {};
      }
      Memory.rooms[roomName].rally = flag.pos;
      console.log("Squad " + flag.name + " rally location updated");
    }

    if (flag.name === "attack") {
      return;
    }

    console.log(flag.pos.roomName + " state is " + roomState);
    flag.remove();
  }
}
