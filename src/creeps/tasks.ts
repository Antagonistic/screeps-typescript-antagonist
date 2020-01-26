import { TargetAction } from "config/config";
import * as creepActions from "creeps/creepActions";


export function taskAttackHostile(creep: Creep, target?: Creep | Structure | undefined) {
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
}


export function moveToRoom(creep: Creep, roomName: string) {
    if (!creep.action) {
        if (creep.room.name !== roomName) {
            const exitDir = creep.room.findExitTo(roomName);
            const exit = creep.pos.findClosestByRange(exitDir as FindConstant);
            creepActions.moveTo(creep, exit as RoomPosition, true);
            creep.action = true;
        }
    }
}


export function recycle(creep: Creep) {
    ;
}
