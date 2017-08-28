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
    creepActions.moveToUpgrade(creep);
  } else {
    creepActions.getAnyEnergy(creep);
  }
}
