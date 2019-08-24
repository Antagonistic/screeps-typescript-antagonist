
export function run(spawn: StructureSpawn): void {
  // Opportunistic renewal
  const State: RoomStates = spawn.room.memory.state;
  if (!spawn.spawning && spawn.room.energyAvailable > 300 && State === RoomStates.STABLE) {
    const creeps: Creep[] = spawn.pos.findInRange(FIND_MY_CREEPS, 1, {
      filter:
        (s: Creep) => s.ticksToLive && s.ticksToLive < 1200
    });
    if (creeps && creeps.length > 0) {
      spawn.renewCreep(creeps[0]);
      // console.log("Opportunistic renew of " + creeps[0].name);
    }
  }
}
