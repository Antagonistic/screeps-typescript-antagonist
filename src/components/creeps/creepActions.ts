import * as Config from "../../config/config";

// import { log } from "../../lib/logger/log";

/**
 * Shorthand method for `Creep.moveTo()`.
 *
 * @export
 * @param {Creep} creep
 * @param {(Structure | RoomPosition)} target
 * @returns {number}
 */
export function moveTo(creep: Creep, target: Structure | RoomPosition): number {
  return creep.moveTo(target);
}

/**
 * Returns true if the `ticksToLive` of a creep has dropped below the renew
 * limit set in config.
 *
 * @export
 * @param {Creep} creep
 * @returns {boolean}
 */
export function needsRenew(creep: Creep): boolean {
  if (creep.memory.renew) {
    return true;
  }
  if (creep.ticksToLive < Config.DEFAULT_MIN_LIFE_BEFORE_NEEDS_REFILL) {
    creep.memory.renew = true;
    return true;
  }
  return false;
}

/**
 * Moves a creep to a designated renew spot (in this case the spawn).
 *
 * @export
 * @param {Creep} creep
 * @param {Spawn} spawn
 */
export function moveToRenew(creep: Creep, spawn: Spawn): void {
  const ret = spawn.renewCreep(creep);
  console.log(creep.name + " needs to renew: " + ret + " - " + creep.ticksToLive);
  if (ret === ERR_NOT_IN_RANGE) {
    creep.moveTo(spawn);
  } else if (ret === OK) {
    if (creep.ticksToLive >= Config.DEFAULT_MAX_LIFE_WHILE_NEEDS_REFILL) {
      creep.memory.renew = undefined;
    }
  } else if (ret === ERR_FULL) {
    creep.memory.renew = undefined;
  }
}

export function moveToRecycle(creep: Creep, spawn: Spawn): void {
  const ret = spawn.recycleCreep(creep);
  console.log(creep.name + " needs to retire: " + ret);
  if (ret === ERR_NOT_IN_RANGE) {
    creep.moveTo(spawn);
  }
}

/**
 * Attempts transferring available resources to the creep.
 *
 * @export
 * @param {Creep} creep
 * @param {RoomObject} roomObject
 */
export function getEnergy(creep: Creep, roomObject: RoomObject): void {
  const energy: Resource = roomObject as Resource;

  if (energy) {
    if (creep.pos.isNearTo(energy)) {
      creep.pickup(energy);
    } else {
      moveTo(creep, energy.pos);
    }
  }
}

/**
 * Returns true if a creep's `working` memory entry is set to true, and false
 * otherwise.
 *
 * @export
 * @param {Creep} creep
 * @returns {boolean}
 */
export function canWork(creep: Creep): boolean {
  const working = creep.memory.working;
  if (working && _.sum(creep.carry) === 0) {
    creep.memory.working = false;
    return false;
  } else if (!working && _.sum(creep.carry) === creep.carryCapacity) {
    creep.memory.working = true;
    return true;
  } else {
    return creep.memory.working;
  }
}

export function getAnyEnergy(creep: Creep, factor: number = 2, canMine: boolean = false): boolean {
  let action: boolean = false;
  if (creep.carry.energy === 0) {
    action = actionGetStorageEnergy(creep, action, factor);
  }
  action = actionGetContainerEnergy(creep, action, factor);
  action = actionGetDroppedEnergy(creep, action);
  if (canMine) {
    action = actionGetSourceEnergy(creep, action, factor * 2);
  }
  return action;
}

export function getStoredEnergy(creep: Creep, factor: number = 4): boolean {
  let action: boolean = false;
  action = actionGetStorageEnergy(creep, action, factor);
  action = actionGetContainerEnergy(creep, action, factor);
  return action;
}

export function moveToUpgrade(creep: Creep): void {
  const controller: Controller | void = creep.room.controller;
  if (controller && creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    moveTo(creep, controller.pos);
  }
}

export function moveToBuildSite(creep: Creep, target: ConstructionSite): void {
  if (creep.build(target) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target.pos);
  }
}

export function moveToBuild(creep: Creep): void {
  const target: ConstructionSite = creep.pos.findClosestByRange<ConstructionSite>(FIND_MY_CONSTRUCTION_SITES);
  if (target) {
    if (creep.build(target) === ERR_NOT_IN_RANGE) {
      moveTo(creep, target.pos);
    }
  }
}

export function actionUpgrade(creep: Creep, action: boolean): boolean {
  if (action === false) {
    if (creep.room.controller) {
      const target: Controller = creep.room.controller;
      if (creep.upgradeController(target) ===  ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      // console.log(creep.name + " upgrading!");
      return true;
    }
  }
  return action;
}

export function actionBuild(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const target: ConstructionSite = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES);
    if (target) {
      if (creep.build(target) === ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
      // console.log(creep.name + " building!");
      return true;
    }
  }
  return action;
}

export function actionRepair(creep: Creep, action: boolean): boolean {
  if (action === false) {
    // Find critically damaged
    const critical: Structure = creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {filter:
      (x: Structure) => x.structureType !== STRUCTURE_WALL && x.structureType !== STRUCTURE_RAMPART &&
      x.hits < x.hitsMax / 10});
    if (critical) {
      if (creep.repair(critical) === ERR_NOT_IN_RANGE) {
        creep.moveTo(critical, {visualizePathStyle: {stroke: "#ffffff"}});
        return true;
      }
    }
    const damaged: Structure = creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {filter:
      (x: Structure) => x.structureType !== STRUCTURE_WALL && x.structureType !== STRUCTURE_RAMPART &&
      x.hits < x.hitsMax / 3});
    if (damaged) {
      if (creep.repair(damaged) === ERR_NOT_IN_RANGE) {
        creep.moveTo(damaged);
        return true;
      }
    }
  }
  return false;
}

export function actionRepairWall(creep: Creep, action: boolean): boolean {
  if (action === false) {
    // Find critically damaged
    const critical: Structure = creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {filter:
      (x: Structure) => (x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART) &&
      x.hits < x.hitsMax / 300000});
    if (critical) {
      // creep.say("wall: " + critical.pos.x + "," + critical.pos.y);
      if (creep.repair(critical) === ERR_NOT_IN_RANGE) {
        creep.moveTo(critical, {visualizePathStyle: {stroke: "#ffffff"}});
        return true;
      }
    }
    const damaged: Structure = creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {filter:
      (x: Structure) => (x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART) &&
      x.hits < x.hitsMax / 3000});
    if (damaged) {
      if (creep.repair(damaged) === ERR_NOT_IN_RANGE) {
        creep.moveTo(damaged);
        return true;
      }
    }
    const damaged2: Structure = creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {filter:
      (x: Structure) => (x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART) &&
      x.hits < x.hitsMax / 300});
    if (damaged2) {
      if (creep.repair(damaged2) === ERR_NOT_IN_RANGE) {
        creep.moveTo(damaged2);
        return true;
      }
    }
    const damaged3: Structure = creep.pos.findClosestByRange<Structure>(FIND_STRUCTURES, {filter:
      (x: Structure) => (x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART) &&
      x.hits < x.hitsMax / 3});
    if (damaged3) {
      if (creep.repair(damaged3) === ERR_NOT_IN_RANGE) {
        creep.moveTo(damaged3);
        return true;
      }
    }
  }
  return false;
}

export function actionFillEnergy(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const spawn: Structure[] = creep.room.find(FIND_MY_SPAWNS, {filter:
       (x: Spawn) => x.energy < x.energyCapacity});
    const extentions: Structure[] = creep.room.find(FIND_MY_STRUCTURES, {filter:
      (x: Structure) => x.structureType === STRUCTURE_EXTENSION &&
      (x as Extension).energy < (x as Extension).energyCapacity});
    const targets: Structure[] = spawn.concat(extentions);
    if (targets.length > 0) {
      const target: Structure = creep.pos.findClosestByRange(targets);
      if (target) {
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(target);
        }
        // console.log(creep.name + " filling energy!");
        return true;
      }
    }
  }
  return action;
}

export function actionGetDroppedEnergy(creep: Creep, action: boolean, scavange?: boolean): boolean {
  if (action === false) {
      // Find dropped resources
    let numPickup: number = creep.carryCapacity;
    if (scavange) {
      numPickup = 10;
    }
    const droppedRes: Resource[] = creep.room.find<Resource>(FIND_DROPPED_RESOURCES,
      {filter: (x: Resource) => x.resourceType === RESOURCE_ENERGY
        && x.amount >= numPickup});
    if (droppedRes && droppedRes.length > 0) {
      if (creep.pickup(droppedRes[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(droppedRes[0]);
      }
      return true;
    }
  }
  return action;
}

export function actionGetContainerEnergy(creep: Creep, action: boolean, factor: number): boolean {
  if (action === false) {
    const energyCont: Container[] = creep.pos.findClosestByRange(FIND_STRUCTURES,
      {filter: (x: Container) => x.structureType === STRUCTURE_CONTAINER
        && x.store[RESOURCE_ENERGY] >= creep.carryCapacity * factor});
    if (energyCont && energyCont.length > 0) {
      if (creep.withdraw(energyCont[0], RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(energyCont[0]);
      }
      return true;
    }
  }
  return action;
}

export function actionGetSourceEnergy(creep: Creep, action: boolean, factor: number = 1): boolean {
  if (action === false) {
    const sources: Source[] = creep.room.find(FIND_SOURCES_ACTIVE, {filter:
      (x: Source) => x.energy >= creep.carryCapacity * factor});
    if (sources && sources.length > 0) {
      if (creep.harvest(sources[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[0]);
      }
    }
  }
  return action;
}

export function actionGetStorageEnergy(creep: Creep, action: boolean, factor: number = 1): boolean {
  if (action === false) {
    if (creep.room.storage) {
      const storage: StructureStorage = creep.room.storage;
      const energy: number | undefined = storage.store.energy;
      if (energy && energy > creep.carryCapacity * factor) {
        if (creep.withdraw(storage, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          creep.moveTo(storage);
        }
        return true;
      }
    }
  }
  return action;
}

export function actionRenew(creep: Creep, action: boolean) {
  if (action === false) {
    if (needsRenew(creep)) {
      const spawn = creep.room.find<Spawn>(FIND_MY_SPAWNS);
      if (spawn && spawn.length > 0) {
          moveToRenew(creep, spawn[0]);
      }
      return true;
    }
  }
  return action;
}

export function actionRecycle(creep: Creep, action: boolean) {
  if (action === false) {
    if (creep.memory.recycle) {
      const spawn = creep.room.find<Spawn>(FIND_MY_SPAWNS);
      if (spawn && spawn.length > 0) {
          moveToRecycle(creep, spawn[0]);
      }
      return true;
    }
  }
  return action;
}
