
export function run(tower: Tower, hostiles: Creep[] | void): void {
  if (hostiles && hostiles.length > 0) {
    const hostile: Creep = tower.pos.findClosestByRange(hostiles);
    if (hostile) {
      tower.attack(hostile);
    }
  }
}
