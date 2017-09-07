
export function run(tower: Tower, hostiles: Creep[] | void): void {
  if (hostiles && hostiles.length > 0) {
    const hostileHealer: Creep = tower.pos.findClosestByRange(hostiles, {filter:
      (c: Creep) => c.getActiveBodyparts(HEAL) > 0});
    if (hostileHealer) {
      tower.attack(hostileHealer);
      return;
    }
    const hostile: Creep = tower.pos.findClosestByRange(hostiles);
    if (hostile) {
      tower.attack(hostile);
    }
  }
}
