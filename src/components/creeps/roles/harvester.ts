import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {
  const spawn = creep.room.find<Spawn>(FIND_MY_SPAWNS)[0];

  // if (creepActions.needsRenew(creep)) {
  //  creepActions.moveToRenew(creep, spawn);
  //  return;
  // }
  if (creepActions.canWork(creep)) {
    if (spawn.energy < spawn.energyCapacity) {
      _moveToDropEnergy(creep, spawn);
    } else {
      if (creep.room.controller && creep.room.controller.ticksToDowngrade < 2000) {
        // Reset controller timer if it risks downgrading
        creepActions.moveToUpgrade(creep);
      } else {
        // Feed extentions
        const dropoff: StructureExtension[] = creep.room.find(FIND_MY_STRUCTURES,
          {filter: (x: Structure) => x.structureType === STRUCTURE_EXTENSION
          && (x as StructureExtension).energy < 50});
        if (dropoff && dropoff.length > 0) {
          _moveToDropEnergy(creep, dropoff[0]);
        } else {
          // Feed construction sites
          const build: ConstructionSite[] = creep.room.find(FIND_MY_CONSTRUCTION_SITES);
          if (build && build.length > 0) {
            creepActions.moveToBuildSite(creep, build[0]);
          } else {
            // Last resort, feed controller
            creepActions.moveToUpgrade(creep);
          }
        }
      }
    }
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

function _tryEnergyDropOff(creep: Creep, target: Spawn | Structure): number {
  return creep.transfer(target, RESOURCE_ENERGY);
}

function _moveToDropEnergy(creep: Creep, target: Spawn | Structure): void {
  if (_tryEnergyDropOff(creep, target) === ERR_NOT_IN_RANGE) {
    creepActions.moveTo(creep, target.pos);
  }
}
