import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {

  let action: boolean = false;
  // action = creepActions.actionRenew(creep, action);

  if (!action && creepActions.canWork(creep)) {
    action = creepActions.actionUpgrade(creep, action);
  } else {
    creepActions.getAnyEnergy(creep, 6);
  }
}
