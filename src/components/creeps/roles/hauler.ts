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
                if (structure.structureType === STRUCTURE_STORAGE) {
                    const storage: Storage = structure as Storage;
                    if (storage) {
                        if (storage.store.energy) {
                            return storage.store.energy < storage.storeCapacity;
                        }
                    }
                }
                return false;
            }
        });
    }
    if (targets.length > 0) {
      if (creep.transfer(targets[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(targets[0], {visualizePathStyle: {stroke: "#ffffff"}});
      }
    }
  } else {
    action = creepActions.actionGetDroppedEnergy(creep, action, true);
    action = creepActions.actionGetContainerEnergy(creep, action, 4);
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
