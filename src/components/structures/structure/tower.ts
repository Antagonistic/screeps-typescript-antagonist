
export function run(tower: Tower): void {
  const hostiles: Creep[] = tower.room.find(FIND_HOSTILE_CREEPS);
  if (hostiles && hostiles.length > 0) {
    const hostile: Creep = tower.pos.findClosestByRange(hostiles);
    if (hostile) {
      tower.attack(hostile);
    }
  }
}
