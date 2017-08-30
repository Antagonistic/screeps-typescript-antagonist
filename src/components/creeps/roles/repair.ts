import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {

  if (creepActions.needsRenew(creep)) {
    const spawn = creep.room.find<Spawn>(FIND_MY_SPAWNS);
    if (spawn && spawn.length > 0) {
        creepActions.moveToRenew(creep, spawn[0]);
    }
    return;
  }

  if (creepActions.canWork(creep)) {
    let action: boolean = false;
    action = creepActions.actionRepair(creep, action);
    action = creepActions.actionRepairWall(creep, action);
  } else {
    creepActions.getAnyEnergy(creep);
  }
}
