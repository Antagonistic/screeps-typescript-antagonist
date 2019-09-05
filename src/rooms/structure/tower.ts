
export function run(tower: StructureTower, hostiles: Creep[] | void): void {
  if (hostiles && hostiles.length > 0) {
    const hostileHealer: Creep | null = tower.pos.findClosestByRange(hostiles, {
      filter:
        (c: Creep) => c.getActiveBodyparts(HEAL) > 0
    });
    if (hostileHealer) {
      tower.attack(hostileHealer);
      return;
    }
    const hostile: Creep | null = tower.pos.findClosestByRange(hostiles);
    if (hostile) {
      tower.attack(hostile);
    }
  }
}
