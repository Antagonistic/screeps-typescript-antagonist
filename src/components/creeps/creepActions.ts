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
export function moveTo(creep: Creep, target: Structure | Creep | RoomPosition, visual: boolean = false): number {
  if (visual) {
    return creep.moveTo(target, {visualizePathStyle: {stroke: "#ffffff"}});
  } else {
    return creep.moveTo(target);
  }
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
  // console.log(creep.name + " needs to renew: " + ret + " - " + creep.ticksToLive);
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
    if (creep.memory.target !== undefined) {
      creep.memory.target = undefined; // Zero out existing targets
    }
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

export function moveToRepair(creep: Creep, target: Structure): void {
  if (creep.repair(target) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target);
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

export function moveToTransfer(creep: Creep, target: Structure | Creep): void {
  if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target.pos);
  }
}

export function moveToAttack(creep: Creep, target: Creep | Structure): void {
  if (creep.attack(target) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target);
  }
}

export function actionMoveToRoom(creep: Creep, action: boolean, roomID?: string) {
  if (action === false) {
    if (!roomID) {
      roomID = creep.memory.room;
    }
    if (roomID) {
      if (creep.room.name !== roomID) {
        moveTo(creep, new RoomPosition(25, 25, roomID));
        return true;
      } else {
        const pos: RoomPosition = creep.pos;
        const x: number = pos.x;
        const y: number = pos.y;
        if (x === 0 || y === 0 || x === 49 || y === 49) {
          creep.moveTo(25, 25);
          return true;
        }
      }
    }
  }
  return action;
}

export function actionMoveToController(creep: Creep, action: boolean) {
  if (action === false) {
    if (creep.room.controller) {
      if (!creep.pos.inRangeTo(creep.room.controller, 1)) {
        moveTo(creep, creep.room.controller);
      }
      return true;
    }
  }
  return action;
}

export function actionUpgrade(creep: Creep, action: boolean): boolean {
  if (action === false) {
    if (creep.room.controller) {
      const target: Controller = creep.room.controller;
      if (creep.upgradeController(target) ===  ERR_NOT_IN_RANGE) {
        creep.moveTo(target);
      }
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
      return true;
    }
  }
  return action;
}

export function actionRepairCache(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const targetId = creep.memory.target;
    if (targetId) {
      const target: Structure | null = Game.getObjectById(targetId);
      if (target) {
        if (target.hits < target.hitsMax) {
          moveToRepair(creep, target);
          return true;
        } else {
          creep.memory.target = undefined;
        }
      } else {
        creep.memory.target = undefined;
      }
    }
  }
  return action;
}

export function actionRepair(creep: Creep, action: boolean,
                             repWalls: boolean = false, factor: number = 3): boolean {
  if (action === false) {
    let targets: Structure[];
    if (repWalls) {
      // Find walls
      targets = creep.room.find<Structure>(FIND_STRUCTURES, {filter:
        (x: Structure) => (x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART) &&
        x.hits < x.hitsMax / factor});
    } else {
      // Find non-walls
      targets = creep.room.find<Structure>(FIND_STRUCTURES, {filter:
        (x: Structure) => x.structureType !== STRUCTURE_WALL && x.structureType !== STRUCTURE_RAMPART &&
        x.hits < x.hitsMax / factor});
    }
    if (targets.length) {
      const salt: number = (creep.memory.uuid || 0) % targets.length;
      // console.log(creep.name + " " + salt + " " + targets.length);
      creep.memory.target = targets[salt].id;
      moveToRepair(creep, targets[salt]);
      return true;
    }
  }
  return action;
}

export function actionFillEnergy(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const spawn: Structure[] = creep.room.find(FIND_MY_SPAWNS, {filter:
       (x: Spawn) => x.energy < x.energyCapacity});
    const extentions: Structure[] = creep.room.find(FIND_MY_STRUCTURES, {filter:
      (x: Structure) => x.structureType === STRUCTURE_EXTENSION &&
      (x as Extension).energy < (x as Extension).energyCapacity});
    const targets: Structure[] = spawn.concat(extentions);
    if (targets.length) {
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

export function actionFillTower(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const towers: StructureTower[] = creep.room.find<StructureTower>(FIND_STRUCTURES, {filter:
      (x: Structure) => x.structureType === STRUCTURE_TOWER && (x as Tower).energy < (x as Tower).energyCapacity});
    if (towers.length) {
      moveToTransfer(creep, towers[0]);
    }
  }
  return action;
}

export function actionFillEnergyStorage(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const storage: StructureStorage | undefined = creep.room.storage;
    if (storage) {
      moveToTransfer(creep, storage);
    }
  }
  return action;
}

export function actionFillUpgrader(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const targets: Creep[] = creep.room.find<Creep>(FIND_MY_CREEPS, {filter:
    (x: Creep) => x.memory.role === "upgrader"});
    if (targets.length) {
      const salt: number = (creep.memory.uuid || 0) % targets.length;
      moveToTransfer(creep, targets[salt]);
      return true;
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
    if (droppedRes.length) {
      if (creep.pickup(droppedRes[0]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(droppedRes[0]);
      } else {
        // Grab from container if nearby
        const minerContainer: Container[] = droppedRes[0].pos.findInRange<Container>(FIND_STRUCTURES, 1, {filter:
          (x: Structure) => x.structureType === STRUCTURE_CONTAINER});
        if (minerContainer.length) {
          let energyNeed: number = creep.carryCapacity - droppedRes[0].amount;
          if (creep.carry.energy) {
            energyNeed -= creep.carry.energy;
          }
          if (energyNeed > 0 && minerContainer[0].store.energy) {
            // There is energy in container
            energyNeed = Math.min(energyNeed, minerContainer[0].store.energy);
            creep.withdraw(minerContainer[0], RESOURCE_ENERGY, energyNeed);
          }
        }
      }
      return true;
    }
  }
  return action;
}

export function actionGetContainerEnergy(creep: Creep, action: boolean, factor: number = 2): boolean {
  if (action === false) {
    const energyCont: Container = creep.pos.findClosestByRange(FIND_STRUCTURES,
      {filter: (x: Container) => x.structureType === STRUCTURE_CONTAINER
        && x.store.energy >= creep.carryCapacity * factor});
    // console.log("energyCont: " + energyCont);
    if (energyCont) {
      // console.log("energyCont[0]: " + energyCont[0]);
      if (creep.withdraw(energyCont, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        creep.moveTo(energyCont);
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
    if (sources.length) {
      const salt: number = (creep.memory.uuid || 0) % sources.length;
      // console.log(creep.name + " " + salt + " " + sources.length);
      // creep.memory.target = sources[salt].id;
      if (creep.harvest(sources[salt]) === ERR_NOT_IN_RANGE) {
        creep.moveTo(sources[salt]);
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
      if (spawn.length) {
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
      if (spawn.length) {
          moveToRecycle(creep, spawn[0]);
      }
      return true;
    }
  }
  return action;
}

export function actionAttackHostile(creep: Creep, action: boolean, target?: Creep) {
  if (action === false) {
    if (!target) {
      const targetFind: Creep | null = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (targetFind) {
        target = targetFind;
      }
    }
    if (target) {
      moveToAttack(creep, target);
      return true;
    }
  }
  return action;
}
