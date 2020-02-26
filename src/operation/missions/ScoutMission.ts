import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import { BodyFactory } from "creeps/BodyFactory";
import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";
import { EnergyState } from "config/Constants";

@profile
export class ScoutMission extends Mission {
    public scouts: Creep[] = [];
    public roomName: string;
    public active: boolean;
    constructor(operation: Operation, active: boolean = true) {
        super(operation, "scout");
        this.roomName = this.operation.roomName;
        this.active = active;
        if (this.energyState() === EnergyState.CRITICAL) { this.active = false; }
    }

    public initMission(): void {
        ;
    }
    public getMax() {
        if (!this.active) { return 0; }
        if (this.room) { return 0; }
        if (this.spawnRoom.rclLevel < 3) { return 0; }
        return 1;
    }
    public spawn(): void {
        this.scouts = this.spawnRole("scout", () => this.getMax(), () => BodyFactory.workerBody(0, 0, 1), 50);
    }
    public work(): void {
        for (const creep of this.scouts) {
            creep.room.memory.lastSeen = Game.time;
            if (!creep.memory.inPosition) {
                if (creep.ticksToLive && creep.ticksToLive >= 1499) {
                    creep.notifyWhenAttacked(false);
                }
                if (creep.pos.isNearTo(this.operation.flag.pos)) {
                    creep.memory.inPosition = true;
                } else {
                    creepActions.moveTo(creep, this.operation.flag.pos, false);
                }
            }
            // if (Game.time % 25 === 0) { this.processRoomScout(creep.room); }
        }
    }
    public finalize(): void {
        ;
    }
}
