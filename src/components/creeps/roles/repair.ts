import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {

  if (creepActions.canWork(creep)) {
    let action: boolean = false;
    action = creepActions.actionRepairCache(creep, action);
    action = creepActions.actionRepair(creep, action, false, 10);
    action = creepActions.actionRepair(creep, action, true, 300000);
    action = creepActions.actionRepair(creep, action, false, 2);
    action = creepActions.actionRepair(creep, action, true, 3000);
    action = creepActions.actionRepair(creep, action, true, 300);
    action = creepActions.actionRepair(creep, action, true, 2);
  } else {
    creepActions.getAnyEnergy(creep);
  }
}

export function getBody(room: Room): string[] | null {
  if (room.energyCapacityAvailable >= 550) {
    return [MOVE, MOVE, MOVE, WORK, WORK, WORK, CARRY, CARRY];
  } else {
    return [MOVE, WORK, WORK, CARRY];
  }
}
