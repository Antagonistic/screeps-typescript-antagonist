import { TargetAction } from "config/config";
import * as creepActions from "creeps/creepActions";
import { buildHelper } from "rooms/buildHelper";

export const task = {
    attackHostile(creep: Creep, target?: Creep | Structure | undefined) {
        if (!creep.action) {
            if (!target) {
                const targetFind: Creep | null = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
                if (targetFind) {
                    target = targetFind;
                }
            }
            if (!target) {
                const targetFind: Structure | null = creep.pos.findClosestByRange(FIND_HOSTILE_STRUCTURES);
                if (targetFind) {
                    target = targetFind;
                }
            }
            if (target) {
                if (creep.getActiveBodyparts(RANGED_ATTACK)) {
                    creep.setTarget(target, TargetAction.ATTACK_RANGED);
                } else if (creep.getActiveBodyparts(ATTACK)) {
                    creep.setTarget(target, TargetAction.ATTACK);
                }
            }
        }
    },

    refill(creep: Creep) {
        if (!creep.action) {
            const room = creep.room;
            const targets = room.find(FIND_MY_STRUCTURES, {
                filter: x =>
                    (x.structureType === STRUCTURE_SPAWN || x.structureType === STRUCTURE_EXTENSION || x.structureType === STRUCTURE_TOWER)
                    && x.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });
            if (targets.length > 0) {
                const target: Structure | null = creep.pos.findClosestByRange(targets);
                if (target) {
                    creep.setTarget(target, TargetAction.DEPOSITENERGY);
                }
            }
        }
    },

    praise(creep: Creep, ) {
        if (!creep.action) {
            if (creep.room.controller && creep.room.controller.my && creep.room.controller.level < 8) {
                creep.setTarget(creep.room.controller, TargetAction.PRAISE);
            }
        }
    },

    praiseEmergency(creep: Creep, ) {
        if (!creep.action) {
            if (creep.room.controller && creep.room.controller.my && creep.room.controller.ticksToDowngrade < 2000) {
                creep.setTarget(creep.room.controller, TargetAction.PRAISE);
            }
        }
    },

    priorityWall(creep: Creep) {
        if (!creep.action) {
            const walls = creep.room.find(FIND_STRUCTURES, { filter: x => (x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART) && x.hits < 100 });
            if (walls && walls.length > 0) {
                creep.setTarget(walls[0], TargetAction.REPAIR);
            }
        }
    },

    getEnergyStorage(creep: Creep, minEnergy: number = 10000) {
        if (!creep.action) {
            if (creep.room.storage) {
                const storage: StructureStorage = creep.room.storage;
                const energy: number | undefined = storage.store.energy;
                if (energy && energy > minEnergy) {
                    creep.setTarget(storage, TargetAction.WITHDRAWENERGY);
                }
            }
        }
    },

    moveToRoom(creep: Creep, roomName: string) {
        if (!creep.action) {
            if (creep.room.name !== roomName) {
                const exitDir = creep.room.findExitTo(roomName);
                const exit = creep.pos.findClosestByRange(exitDir as FindConstant);
                creepActions.moveTo(creep, exit as RoomPosition, true);
                creep.action = true;
            }
        }
    },

    roadRepair(creep: Creep, room?: Room) {
        if (!creep.action && room) {
            const res = buildHelper.getRoadRep(room);
            if (res) {
                creep.setTarget(res, TargetAction.REPAIR);
            }
        }
    },

    roadConstruct(creep: Creep, room?: Room) {
        if (!creep.action && room) {
            const res = buildHelper.getRoadCon(room);
            if (res) {
                creep.setTarget(res, TargetAction.BUILD);
            }
        }
    },

}
