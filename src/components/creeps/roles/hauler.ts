import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {

  let action: boolean = false;

  if (!action && creepActions.canWork(creep)) {
    action = creepActions.actionFillEnergy(creep, action);
    action = creepActions.actionFillTower(creep, action);
    action = creepActions.actionFillEnergyStorage(creep, action);
  } else {
    action = creepActions.actionGetDroppedEnergy(creep, action, true);
    action = creepActions.actionGetContainerEnergy(creep, action, 3);
  }
}

export function getBody(room: Room): string[] | null {
    if (room.energyCapacityAvailable > 600) {
        // Big hauler
        return [MOVE, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY];
    } else {
        // Small hauler
        return [MOVE, MOVE, CARRY, CARRY, CARRY, CARRY];
    }

  }
