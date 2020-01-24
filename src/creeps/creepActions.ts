import * as Config from "config/config";
import { profile } from "Profiler";
import { getRally } from "rooms/roomHelper";
import * as roomHelper from "rooms/roomHelper"
import { Traveler } from "utils/Traveler";

// import { log } from "../../lib/logger/log";

/**
 * Shorthand method for `Creep.moveTo()`.
 *
 * @export
 * @param {Creep} creep
 * @param {(Structure | RoomPosition)} target
 * @returns {number}
 */
export function moveTo(creep: Creep, target: Structure | Creep | RoomPosition, exact: boolean = false): number {
  if (creep.pos.x === 0) {
    creep.move(RIGHT);
    return OK;
  }
  if (creep.pos.y === 0) {
    creep.move(BOTTOM);
    return OK;
  }
  if (creep.pos.x === 49) {
    creep.move(LEFT);
    return OK;
  }
  if (creep.pos.y === 49) {
    creep.move(TOP);
    return OK;
  }
  if (exact) {
    // return creep.moveTo(target, { visualizePathStyle: { stroke: "#ffffff" }, range: 1 });
    return Traveler.travelTo(creep, target, { range: 0, ignoreCreeps: true });
  } else {
    // return creep.moveTo(target, { range: 1 });
    return Traveler.travelTo(creep, target, { range: 1, ignoreCreeps: true });
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
export function needsRenew(creep: Creep, renewLow: number = Config.DEFAULT_MIN_LIFE_BEFORE_NEEDS_REFILL): boolean {
  if (creep.memory.renew) {
    return true;
  }
  if (creep.ticksToLive && creep.ticksToLive < renewLow) {
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
export function moveToRenew(creep: Creep, spawn: StructureSpawn): void {
  const ret = spawn.renewCreep(creep);
  // console.log(creep.name + " needs to renew: " + ret + " - " + creep.ticksToLive);
  if (ret === ERR_NOT_IN_RANGE) {
    moveTo(creep, spawn);
  } else if (ret === OK) {
    if (creep.ticksToLive && creep.ticksToLive >= Config.DEFAULT_MAX_LIFE_WHILE_NEEDS_REFILL) {
      creep.memory.renew = undefined;
    }
  } else if (ret === ERR_FULL) {
    creep.memory.renew = undefined;
  }
}

export function moveToRecycle(creep: Creep, spawn: StructureSpawn): void {
  const ret = spawn.recycleCreep(creep);
  // console.log(creep.name + " needs to retire: " + ret);
  if (ret === ERR_NOT_IN_RANGE) {
    moveTo(creep, spawn);
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
    creep.memory.energyTarget = undefined;
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

export function moveToPickup(creep: Creep, target: Resource) {
  if (creep.pickup(target) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target.pos, false);
  }
}

export function moveToUpgrade(creep: Creep): void {
  const controller: StructureController | void = creep.room.controller;
  if (controller && creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    moveTo(creep, controller.pos);
  }
}

export function moveToBuildSite(creep: Creep, target: ConstructionSite): void {
  if (creep.build(target) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target.pos, false);
  } else { yieldRoad(creep, target); }
}

export function moveToRepair(creep: Creep, target: Structure): void {
  if (creep.repair(target) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target, false);
  } else { yieldRoad(creep, target); }
}

export function moveToBuild(creep: Creep, target?: ConstructionSite | null): void {
  if (!target) {
    target = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES);
  }
  if (target) {
    if (creep.build(target) === ERR_NOT_IN_RANGE) {
      moveTo(creep, target.pos);
    } else { yieldRoad(creep, target); }
  }
}

export function moveToTransfer(creep: Creep, target: AnyStoreStructure | Creep): void {
  if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target.pos);
  }
}

export function moveToTransferAll(creep: Creep, target: AnyStoreStructure | Creep): void {
  if (creep.pos.isNearTo(target.pos)) {
    for (const resourceType in creep.store) {
      creep.transfer(creep, resourceType as ResourceConstant);
    }
  } else {
    moveTo(creep, target.pos);
  }

}

export function moveToWithdrawAll(creep: Creep, target: AnyStoreStructure | Tombstone | Ruin): boolean {
  if (_.sum(creep.carry) >= creep.carryCapacity) { return false; }
  if (creep.pos.isNearTo(target.pos)) {
    // console.log(target.structureType);
    if (target instanceof StructureContainer || target instanceof StructureStorage || target instanceof StructureTerminal || target instanceof Tombstone) {
      for (const resourceType in target.store) {
        creep.say("get store");
        creep.withdraw(target, resourceType as ResourceConstant);
      }
    }
    if (target instanceof Creep) {
      for (const resourceType in target.carry) {
        creep.say("get creep");
        target.transfer(creep, resourceType as ResourceConstant);
      }
    }
    if (target instanceof StructureLab || target instanceof StructureExtension || target instanceof StructureSpawn || target instanceof StructureLink) {
      creep.say("get struct");
      creep.withdraw(target, RESOURCE_ENERGY);
    }
  } else {
    moveTo(creep, target.pos);
  }
  return true;
}

export function moveToWithdraw(creep: Creep, target: AnyStoreStructure | Tombstone | Ruin, type: ResourceConstant = RESOURCE_ENERGY): void {
  if (creep.withdraw(target, type) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target.pos);
  }
}

export function moveToAttack(creep: Creep, target: Creep | Structure): void {
  if (creep.attack(target) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target);
  }
}

export function moveToRangedAttack(creep: Creep, target: Creep | Structure): void {
  const range: number = creep.pos.getRangeTo(target.pos);
  if (range > 3) {
    moveTo(creep, target, false);
  } else if (range < 3) {
    const path = PathFinder.search(creep.pos, { pos: target.pos, range: 3 }, { flee: true });
    creep.moveByPath(path.path);
  }
  creep.rangedAttack(target);
}

export function moveToHeal(creep: Creep, target: Creep): void {
  if (creep.heal(target) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target.pos, false);
  }
}

export function moveToReserve(creep: Creep, target: StructureController): void {
  if (creep.reserveController(target) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target, false);
  }
}

export function moveToClaim(creep: Creep, target: StructureController): void {
  if (creep.claimController(target) === ERR_NOT_IN_RANGE) {
    moveTo(creep, target, false);
  }
}

export function moveToBoost(creep: Creep, lab: StructureLab) {
  if (lab.boostCreep(creep) === ERR_NOT_IN_RANGE) {
    moveTo(creep, lab, false);
  }
}

export function actionMoveToRoom(creep: Creep, action: boolean, roomID?: string | any) {
  if (action === false) {
    if (!roomID) {
      roomID = creep.memory.room;
    }
    if (roomID) {
      if (roomID.name) {
        roomID = roomID.name;
      }
      if (creep.room.name !== roomID) {
        const exitDir = creep.room.findExitTo(roomID);
        const exit = creep.pos.findClosestByRange(exitDir as FindConstant);
        moveTo(creep, exit as RoomPosition, true);
        return true;
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
      const target: StructureController = creep.room.controller;
      if (creep.upgradeController(target) === ERR_NOT_IN_RANGE) {
        moveTo(creep, target);
      } else {
        yieldRoad(creep, creep.room.controller, true);
      }
      // creep.moveTo(target);
      return true;
    }
  }
  return action;
}

export function actionBuildStill(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const targets: ConstructionSite[] | null = creep.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 3);
    if (targets && targets.length > 0) {
      creep.build(targets[0]);
      return true;
    }
  }
  return action;
}

export function actionBuild(creep: Creep, action: boolean, target?: ConstructionSite | null): boolean {
  if (action === false) {
    if (!target) {
      target = creep.pos.findClosestByRange(FIND_MY_CONSTRUCTION_SITES);
    }
    if (target) {
      moveToBuildSite(creep, target);
      creep.memory.target = target.id;
      return true;
    }
  }
  return action;
}

export function actionBuildRepairCache(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const targetId = creep.memory.target;
    if (targetId) {
      const target: Structure | ConstructionSite | null = Game.getObjectById<Structure | ConstructionSite>(targetId);
      if (target) {
        if (target instanceof Structure) {
          if (target.hits < target.hitsMax) {
            moveToRepair(creep, target);
            return true;
          } else {
            creep.memory.target = undefined;
          }
        }
        if (target instanceof ConstructionSite) {
          moveToBuild(creep, target);
          return true;
        }
      } else {
        creep.memory.target = undefined;
      }
    }
  }
  return action;
}

export function actionRepairCache(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const targetId = creep.memory.target;
    if (targetId) {
      const target: Structure | null = Game.getObjectById<Structure>(targetId);
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

export function actionRepairCritical(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const targets: Structure[] = creep.room.find(FIND_STRUCTURES, {
      filter:
        (x: Structure) => (x.structureType === STRUCTURE_SPAWN ||
          x.structureType === STRUCTURE_EXTENSION ||
          x.structureType === STRUCTURE_TOWER ||
          x.structureType === STRUCTURE_STORAGE ||
          x.structureType === STRUCTURE_TERMINAL ||
          x.structureType === STRUCTURE_LAB)
          && x.hits < x.hitsMax
    });
    if (targets && targets.length) {
      const salt: number = (creep.memory.uuid || 0) % targets.length;
      creep.memory.target = targets[salt].id;
      moveToRepair(creep, targets[salt]);
      return true;
    }
  }
  return action;
}

export function actionRepairStill(creep: Creep, action: boolean, factor: number = 2): boolean {
  if (action === false) {
    const targets = creep.pos.findInRange<Structure>(FIND_STRUCTURES, 3, {
      filter:
        (x: Structure) => ((x.hits < x.hitsMax / factor) || x.hits === 1)
    });
    if (targets && targets.length > 0) {
      creep.repair(targets[0]);
      return true;
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
      targets = creep.room.find<Structure>(FIND_STRUCTURES, {
        filter:
          (x: Structure) => (x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART) &&
            ((x.hits < x.hitsMax / factor) || x.hits === 1)
      });
    } else {
      // Find non-walls
      targets = creep.room.find<Structure>(FIND_STRUCTURES, {
        filter:
          (x: Structure) => x.structureType !== STRUCTURE_WALL && x.structureType !== STRUCTURE_RAMPART &&
            x.hits < x.hitsMax / factor
      });
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

export function actionRepairRoad(creep: Creep, action: boolean, factor: number = 3): boolean {
  if (action === false) {
    const targets: Structure[] = creep.room.find<Structure>(FIND_STRUCTURES, {
      filter:
        (x: Structure) => (x.structureType === STRUCTURE_ROAD) &&
          x.hits < (x.hitsMax / factor)
    });
    if (targets && targets.length) {
      const target = _.min(targets, (t) => t.hits);
      creep.memory.target = target.id;
      moveToRepair(creep, target);
      return true;
    }
  }
  return action;
}

export function actionRepairWeakestWall(creep: Creep, action: boolean, maxHits: number = 500000): boolean {
  if (action === false) {
    const targets: Structure[] = creep.room.find<Structure>(FIND_STRUCTURES, {
      filter:
        (x: Structure) => (x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART) &&
          x.hits < maxHits
    });
    if (targets && targets.length) {
      const target = _.min(targets, (t) => t.hits);
      creep.memory.target = target.id;
      moveToRepair(creep, target);
      return true;
    }
  }
  return action;
}

export function actionTransferStill(creep: Creep, action: boolean, target?: Structure | Creep | null): boolean {
  if (action === false) {
    if (target || creep.memory.target) {
      if (!target) {
        target = Game.getObjectById<Structure | Creep>(creep.memory.target!);
      }
      if (target && creep.pos.isNearTo(target)) {
        // if (creep.transfer(target, RESOURCE_ENERGY)) {
        // transfer all resources
        for (const resourceType in creep.carry) {
          creep.transfer(target, resourceType as ResourceConstant);
        }
        return true;
      }
      // }
    }
  }
  return action;
}

export function actionTransfer(creep: Creep, action: boolean, target?: Structure | AnyCreep): boolean {
  if (action === false) {
    if (target || creep.memory.target) {
      if (!target) {
        const obj = Game.getObjectById<Structure | Creep>(creep.memory.target!);
        if (obj != null) {
          target = obj;
        }
      }
      if (target) {
        if (creep.pos.isNearTo(target.pos)) {
          // const ret = creep.transfer(target, RESOURCE_ENERGY);
          // if (ret === OK) {
          // transfer all resources
          for (const resourceType in creep.carry) {
            // creep.say(resourceType);
            if (creep.transfer(target, resourceType as ResourceConstant) === ERR_FULL) {
              return false;
            }
          }
        } else {
          moveTo(creep, target.pos);
        }
        return true;
      }
    }
  }
  return action;
}

export function actionFillCache(creep: Creep, action: boolean): boolean {
  if (action === false) {
    if (creep.memory.target) {
      const obj = Game.getObjectById(creep.memory.target);
      if (obj) {
        if (obj instanceof StructureSpawn || obj instanceof StructureTower) {
          if (obj.energy < obj.energyCapacity) {
            moveToTransfer(creep, obj);
            return true;
          } else {
            creep.memory.target = undefined;
          }
        }
        if (obj instanceof StructureContainer || obj instanceof StructureStorage) {
          if (_.sum(obj.store) < obj.storeCapacity - 10) {
            moveToTransfer(creep, obj);
            return true;
          } else {
            creep.memory.target = undefined;
          }
        }
        if (obj instanceof Creep) {
          if (_.sum(obj.carry) < obj.carryCapacity - 10) {
            moveToTransfer(creep, obj);
            return true;
          } else {
            creep.memory.target = undefined;
          }
        }
      } else {
        creep.memory.target = undefined;
      }
    }
  }
  return action;
}

export function actionGetEnergyCache(creep: Creep, action: boolean): boolean {
  if (!action) {
    if (creep.memory.energyTarget) {
      const target = Game.getObjectById(creep.memory.energyTarget) as _HasRoomPosition | null;
      if (target && target.pos) {
        if (creep.pos.isNearTo(target.pos)) {
          if (target instanceof Resource) {
            creep.pickup(target);
            creep.say("Get drop");
          }
          if (target instanceof StructureStorage || target instanceof StructureContainer || target instanceof StructureTerminal || target instanceof Tombstone || target instanceof Ruin || target instanceof StructureLink) {
            creep.withdraw(target, RESOURCE_ENERGY);
            creep.say("Get store");
          }
          if (target instanceof Creep) {
            target.transfer(creep, RESOURCE_ENERGY);
            creep.say("Get creep");
          }
          if (target instanceof Source) {
            if (_.sum(creep.carry) < creep.carryCapacity) {
              creep.harvest(target);
              creep.say("Get Source");
              return true;
            }
          }
          creep.memory.energyTarget = undefined;
        } else {
          // creep.say("" + target.pos.x + "," + target.pos.y);
          moveTo(creep, target.pos);
        }
        return true;
      } else { creep.memory.energyTarget = undefined; }
    }
  }
  return action;
}

export function actionFillEnergy(creep: Creep, action: boolean, room?: Room): boolean {
  if (action === false) {
    if (!room) { room = creep.room; }
    const spawn: Structure[] = room.find(FIND_MY_SPAWNS, {
      filter:
        (x: StructureSpawn) => x.energy < x.energyCapacity
    });
    const extentions: Structure[] = room.find(FIND_MY_STRUCTURES, {
      filter:
        (x: Structure) => x.structureType === STRUCTURE_EXTENSION &&
          (x as StructureExtension).energy < (x as StructureExtension).energyCapacity
    });
    const targets: Structure[] = spawn.concat(extentions);
    if (targets.length) {
      const target: Structure | null = creep.pos.findClosestByRange(targets);
      if (target) {
        creep.memory.target = target.id;
        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          moveTo(creep, target);
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
    const towers: StructureTower[] = creep.room.find<StructureTower>(FIND_STRUCTURES, {
      filter:
        (x: Structure) => x.structureType === STRUCTURE_TOWER && (x as StructureTower).energy < (x as StructureTower).energyCapacity
    });
    if (towers.length) {
      creep.memory.target = towers[0].id;
      moveToTransfer(creep, towers[0]);
      return true;
    }
  }
  return action;
}

export function actionFillEnergyStorage(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const storage: StructureStorage | undefined = creep.room.storage;
    if (storage && storage.room.controller!.level >= 4) {
      creep.memory.target = storage.id;
      moveToTransfer(creep, storage);
      return true;
    }
  }
  return action;
}

export function actionFillBuilder(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const targets: Creep[] = creep.room.find(FIND_MY_CREEPS, {
      filter:
        (x: Creep) => x.memory.role === "builder" && x.carry.energy < (3 * x.carryCapacity / 4)
    });
    if (targets.length) {
      const salt: number = (creep.memory.uuid || 0) % targets.length;
      creep.memory.target = targets[salt].id;
      moveToTransfer(creep, targets[salt]);
      return true;
    }
  }
  return action;
}

export function actionFillRefiller(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const targets: Creep[] = creep.room.find(FIND_MY_CREEPS, {
      filter:
        (x: Creep) => x.memory.role === "refill" && x.carry.energy < (x.carryCapacity / 2)
    });
    if (targets.length) {
      const salt: number = (creep.memory.uuid || 0) % targets.length;
      creep.memory.target = targets[salt].id;
      moveToTransfer(creep, targets[salt]);
      return true;
    }
  }
  return action;
}

export function actionFillUpgrader(creep: Creep, action: boolean): boolean {
  if (action === false) {
    const targets: Creep[] = creep.room.find(FIND_MY_CREEPS, {
      filter:
        (x: Creep) => x.memory.role === "upgrader" && x.carry.energy < (x.carryCapacity / 2)
    });
    if (targets.length) {
      const salt: number = (creep.memory.uuid || 0) % targets.length;
      creep.memory.target = targets[salt].id;
      moveToTransfer(creep, targets[salt]);
      return true;
    }
  }
  return action;
}

export function actionFillBufferChest(creep: Creep, action: boolean): boolean {
  if (action === false) {
    if (creep.room.memory.bufferChests) {
      const chestIDs: string[] = creep.room.memory.bufferChests;
      for (const id of chestIDs) {
        const chest: StructureContainer | null = Game.getObjectById(id);
        if (chest && ((chest.store.energy || 0) + (_.sum(chest.store) || 0)) < chest.storeCapacity) {
          creep.memory.target = chest.id;
          moveToTransfer(creep, chest);
          return true;
        }
      }
    }
  }
  return action;
}

export function actionFillBattery(creep: Creep, action: boolean): boolean {
  if (action === false) {
    if (creep.room.memory.battery) {
      const chest: StructureContainer | null = Game.getObjectById(creep.room.memory.battery);
      if (chest && ((_.sum(chest.store) || 0)) < chest.storeCapacity) {
        creep.memory.target = chest.id;
        moveToTransfer(creep, chest);
        return true;
      }
    }
  }
  return action;
}

export function actionFillControllerBattery(creep: Creep, action: boolean): boolean {
  if (action === false) {
    if (creep.room.memory.controllerBattery) {
      const chest: StructureContainer | StructureLink | null = Game.getObjectById(creep.room.memory.controllerBattery);
      if (chest && (chest.store.getFreeCapacity() > 400)) {
        creep.memory.target = chest.id;
        moveToTransfer(creep, chest);
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
    const droppedRes: Resource | null = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES,
      {
        filter: (x: Resource) => x.resourceType === RESOURCE_ENERGY
          && x.amount >= numPickup
      });
    if (droppedRes) {
      if (creep.pickup(droppedRes) === ERR_NOT_IN_RANGE) {
        moveTo(creep, droppedRes.pos);
        creep.memory.energyTarget = droppedRes.id;
      } else {
        // Grab from container if nearby
        const minerContainer: StructureContainer[] = droppedRes.pos.findInRange<StructureContainer>(FIND_STRUCTURES, 1, {
          filter:
            (x: Structure) => x.structureType === STRUCTURE_CONTAINER
        });
        if (minerContainer.length) {
          let energyNeed: number = creep.carryCapacity - droppedRes.amount;
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

export function actionGetContainerEnergy(creep: Creep, action: boolean,
  factor: number = 2, useBuffer?: boolean): boolean {
  if (action === false) {
    const energyCont: StructureContainer[] = creep.room.find<StructureContainer>(FIND_STRUCTURES,
      {
        filter: (x: StructureContainer) => x.structureType === STRUCTURE_CONTAINER
          && x.store.energy >= creep.carryCapacity * factor
      });
    // console.log("energyCont: " + energyCont);
    if (energyCont && energyCont.length) {
      if (!useBuffer) {
        const buf: string[] | undefined = creep.room.memory.bufferChests;
        if (buf && buf.length) {
          const nonBuffer = _.filter(energyCont, (x) => !_.includes(buf, x.id));
          if (nonBuffer && nonBuffer.length) {
            // console.log(nonBuffer);
            const salt: number = (creep.memory.uuid || 0) % nonBuffer.length;
            moveToWithdraw(creep, nonBuffer[salt]);
            creep.memory.energyTarget = nonBuffer[salt].id;
            return true;
          }
        }
      } else {
        const salt: number = (creep.memory.uuid || 0) % energyCont.length;
        moveToWithdraw(creep, energyCont[salt]);
        creep.memory.energyTarget = energyCont[salt].id;
        return true;
      }
    }
  }
  return action;
}

export function actionGetSourceEnergy(creep: Creep, action: boolean, factor: number = 1): boolean {
  if (action === false) {
    const sources: Source[] = creep.room.find(FIND_SOURCES_ACTIVE, {
      filter:
        (x: Source) => x.energy >= creep.carryCapacity * factor
    });
    if (sources.length) {
      const salt: number = (creep.memory.uuid || 0) % sources.length;
      // console.log(creep.name + " " + salt + " " + sources.length);
      // creep.memory.target = sources[salt].id;
      if (creep.harvest(sources[salt]) === ERR_NOT_IN_RANGE) {
        creep.memory.energyTarget = sources[salt].id;
        moveTo(creep, sources[salt].pos);
      }
    }
  }
  return action;
}

export function actionGetBatteryEnergy(creep: Creep, action: boolean, factor: number = 1): boolean {
  if (action === false) {
    if (creep.room.memory.battery) {
      const obj = Game.getObjectById(creep.room.memory.battery);

      if (obj) {
        if (obj instanceof StructureContainer) {
          if (obj.store.energy < creep.carryCapacity) { return false; }
        }
        if (obj instanceof StructureStorage) {
          if (obj.store.energy < creep.carryCapacity * factor) {
            return false;
          }
        }
        moveToWithdraw(creep, obj as AnyStoreStructure);
        return true;
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
          moveTo(creep, storage);
          creep.memory.energyTarget = storage.id;
        }
        return true;
      }
    }
  }
  return action;
}

export function actionRenew(creep: Creep, action: boolean, renewLow?: number) {
  if (action === false) {
    if (needsRenew(creep, renewLow)) {
      const spawn = creep.room.find(FIND_MY_SPAWNS);
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
      const spawn = creep.room.find(FIND_MY_SPAWNS);
      if (spawn.length) {
        moveToRecycle(creep, spawn[0]);
        return true;
      } else {
        return actionMoveToRoom(creep, action, creep.memory.home);
      }
    }
  }
  return action;
}

export function actionAttackFlag(creep: Creep, action: boolean) {
  if (action === false) {
    const attackFlag: Flag | null = creep.pos.findClosestByRange(FIND_FLAGS, {
      filter:
        (x: Flag) => x.name.substr(0, 3) === "att"
    });
    if (attackFlag) {
      const path = creep.pos.findPathTo(attackFlag.pos, { ignoreDestructibleStructures: true });
      const lookCreep = creep.room.lookForAt(LOOK_CREEPS, path[0].x, path[0].y);
      if (lookCreep && lookCreep.length) {
        if (!lookCreep[0].my) {
          return actionAttackHostile(creep, action, lookCreep[0]);
        }
      }
      const lookStruct = creep.room.lookForAt(LOOK_STRUCTURES, path[0].x, path[0].y);
      if (lookStruct && lookStruct.length) {
        return actionAttackStructure(creep, action, lookStruct[0]);
      }
      moveTo(creep, attackFlag.pos);
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
      if (creep.getActiveBodyparts(RANGED_ATTACK)) {
        moveToRangedAttack(creep, target);
      } else if (creep.getActiveBodyparts(ATTACK)) {
        moveToAttack(creep, target);
      }

      // console.log(creep.name + " attacking " + target.body);
      return true;
    }
  }
  return action;
}

export function actionAttackStructure(creep: Creep, action: boolean, target?: Structure) {
  if (action === false) {
    if (!target) {
      const targetFind: Structure | null = creep.pos.findClosestByRange<Structure>(FIND_HOSTILE_STRUCTURES);
      if (targetFind) {
        target = targetFind;
      }
    }
    if (target) {
      if (creep.getActiveBodyparts(RANGED_ATTACK)) {
        moveToRangedAttack(creep, target);
      } else if (creep.getActiveBodyparts(ATTACK)) {
        moveToAttack(creep, target);
      }
    }
  }
  return action;
}

export function actionHealFriendly(creep: Creep, action: boolean, target?: Creep): boolean {
  if (action === false) {
    if (!target) {
      const targets: Creep[] = creep.pos.findInRange(FIND_MY_CREEPS, 1, { filter: (x: Creep) => x.hits < x.hitsMax });
      if (targets && targets.length) {
        target = targets[0];
      } else {
        return false;
      }
    }

  }
  return action;
}

export function actionReserve(creep: Creep, action: boolean) {
  if (action === false) {
    const controller = creep.room.controller;
    if (controller) {
      moveToReserve(creep, controller);
    }
  }
  return action;
}

export function actionClaim(creep: Creep, action: boolean) {
  if (action === false) {
    const controller = creep.room.controller;
    if (controller) {
      moveToClaim(creep, controller);
    }
  }
  return action;
}

export function actionRally(creep: Creep, action: boolean) {
  if (action === false) {
    if (!creep.room.memory.rally) {
      moveTo(creep, new RoomPosition(25, 25, creep.room.name));
    } else {
      moveTo(creep, new RoomPosition(creep.room.memory.rally.x, creep.room.memory.rally.y, creep.room.name));
    }
    creep.say('🍺');
    return true;
  }
  return action;
}

export function actionBoost(creep: Creep, action: boolean) {
  if (action === false || creep.memory.isBoosted) {
    const availBoost = creep.room.memory.availBoost;
    if (availBoost) {
      for (const body of creep.body) {
        if (!body.boost && availBoost[body.type]) {
          const lab: StructureLab | null = Game.getObjectById(availBoost[body.type]);
          if (lab) {
            moveToBoost(creep, lab);
          }
        }
      }
    }
  }
  return action;
}

export function yieldRoad(creep: Creep, target: { pos: RoomPosition }, allowSwamps = true): number {
  const isOffRoad = creep.pos.lookForStructure(STRUCTURE_ROAD) === undefined;
  if (isOffRoad) { return OK };

  let swampPosition;
  // find movement options
  const direction = creep.pos.getDirectionTo(target);
  for (let i = -2; i <= 2; i++) {
    let relDirection = direction + i;
    relDirection = roomHelper.clampDirection(relDirection);
    const position = creep.pos.getPositionAtDirection(relDirection);
    if (!position.inRangeTo(target, 3)) { continue; }
    if (position.lookFor(LOOK_STRUCTURES).length > 0) { continue; }
    if (!position.isPassible()) { continue; }
    if (roomHelper.isNearExit(position, 0)) { continue; }
    if (position.lookFor(LOOK_TERRAIN)[0] === "swamp") {
      swampPosition = position;
      continue;
    }
    return creep.move(relDirection as DirectionConstant);
  }
  if (swampPosition && allowSwamps) {
    return creep.move(creep.pos.getDirectionTo(swampPosition));
  }
  return creep.travelTo(target);
};
