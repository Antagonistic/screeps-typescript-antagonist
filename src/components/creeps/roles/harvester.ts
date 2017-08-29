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
    let action: boolean = false;
    action = creepActions.actionFillEnergy(creep, action);
    if (creep.room.controller && creep.room.controller.ticksToDowngrade < 2000) {
      action = creepActions.actionUpgrade(creep, action);
    }
    action = creepActions.actionBuild(creep, action);
    action = creepActions.actionUpgrade(creep, action);
  } else {
    if (!creepActions.getAnyEnergy(creep)) {
      const energySource = creep.room.find<Source>(FIND_SOURCES_ACTIVE);
      if (energySource) {
        _moveToHarvest(creep, energySource[0]);
      }
    }
  }
}

function _tryHarvest(creep: Creep, target: Source): number {
  return creep.harvest(target);
}

function _moveToHarvest(creep: Creep, target: Source): void {
  if (_tryHarvest(creep, target) === ERR_NOT_IN_RANGE) {
    creepActions.moveTo(creep, target.pos);
  }
}
