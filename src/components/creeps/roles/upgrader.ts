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

export function getBody(room: Room): string[] | null {
  const energyAvailable: number = room.energyCapacityAvailable;
  if (energyAvailable < 600) {
    return [WORK, WORK, CARRY, MOVE];
  } else {
    return [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
  }
}
