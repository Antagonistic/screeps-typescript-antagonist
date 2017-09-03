import RoomStates from "../roomStates";

export function run(room: Room): void {
  const creeps = room.find<Creep>(FIND_MY_CREEPS);
  const numMiners = _.filter(creeps, (creep) => creep.memory.role === "miner").length;
  const numHaulers = _.filter(creeps, (creep) => creep.memory.role === "hauler").length;
  if (numMiners > 0 && numHaulers > 0) {
    room.memory.state = RoomStates.STABLE;
  } else if (!room.controller || !room.controller.my) {
    room.memory.state = RoomStates.NEUTRAL;
  } else if (room.energyCapacityAvailable <= 500) {
    room.memory.state = RoomStates.BOOTSTRAP;
  }
}
