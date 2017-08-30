import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {

  if (creepActions.needsRenew(creep)) {
    const spawn = creep.room.find<Spawn>(FIND_MY_SPAWNS)[0];
    creepActions.moveToRenew(creep, spawn);
    return;
  }

  if (creepActions.canWork(creep)) {
    let targets: Structure[] = creep.room.find<Spawn>(FIND_STRUCTURES, {
      filter: (structure: Structure) => {
          return (structure.structureType === STRUCTURE_SPAWN) &&
              (structure as Spawn).energy < (structure as Spawn).energyCapacity;
      }
    });
    if (!targets || targets.length === 0) {
      targets = creep.room.find<Extension>(FIND_STRUCTURES, {
        filter: (structure: Structure) => {
            return (structure.structureType === STRUCTURE_EXTENSION) &&
              (structure as Extension).energy < (structure as Extension).energyCapacity;
        }
      });
    }
    if (!targets || targets.length === 0) {
        targets = creep.room.find<Tower>(FIND_STRUCTURES, {
            filter: (structure: Structure) => {
                return (structure.structureType === STRUCTURE_TOWER) &&
                    (structure as Tower).energy < (structure as Tower).energyCapacity;
            }
        });
    }
    if (!targets || targets.length === 0) {
        targets = creep.room.find<Storage>(FIND_STRUCTURES, {
            filter: (structure: Structure) => {
                return (structure.structureType === STRUCTURE_STORAGE) &&
                    (structure as Storage) !== undefined &&
                    (structure as Storage).store &&
                    (structure as Storage).store[RESOURCE_ENERGY] &&
                    (structure as Storage).store[RESOURCE_ENERGY] < (structure as Storage).storeCapacity;
            }
        });
    }
    if (targets.length > 0) {
      if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], {visualizePathStyle: {stroke: "#ffffff"}});
      }
    }
  } else {
    let action: boolean = false;
    action = creepActions.actionGetDroppedEnergy(creep, action, true);
    action = creepActions.actionGetContainerEnergy(creep, action, 4);
  }
}
