import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {
  // const spawn = creep.room.find<Spawn>(FIND_MY_SPAWNS)[0];

  // if (creepActions.needsRenew(creep)) {
  //  creepActions.moveToRenew(creep, spawn);
  //  return;
  // }
  if (creepActions.canWork(creep)) {
    creepActions.moveToBuild(creep);
  } else {
    creepActions.getAnyEnergy(creep);
  }
}

export function getBody(room: Room): string[] | null {
  const availableEnergy: number = room.energyCapacityAvailable;
  if (availableEnergy >= 650) {
    return [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY, CARRY];
  } else {
    return [MOVE, WORK, WORK, CARRY];
  }
}
