
export function run(spawn: Spawn): void {
  // Opportunistic renewal
  if (!spawn.spawning && spawn.room.energyAvailable > 300) {
    const creeps: Creep[] = spawn.pos.findInRange(FIND_MY_CREEPS, 1, {filter:
      (s: Creep) => s.ticksToLive < 1200});
    if (creeps && creeps.length > 0) {
        spawn.renewCreep(creeps[0]);
        // console.log("Opportunistic renew of " + creeps[0].name);
    }
  }
}
