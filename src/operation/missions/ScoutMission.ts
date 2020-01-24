import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";

@profile
export class ScoutMission extends Mission {
    public scouts: Creep[] = [];
    public roomName: string;
    constructor(operation: Operation) {
        super(operation, "scout");
        this.roomName = this.operation.roomName;
    }

    public initMission(): void {
        ;
    }
    public spawn(): void {
        const getMax = () => !this.room && this.spawnRoom.rclLevel <= 2 ? 0 : 1;
        this.scouts = this.spawnRole("scout", getMax, () => this.workerBody(0, 0, 1), 50);
    }
    public work(): void {
        for (const creep of this.scouts) {
            creep.room.memory.lastSeen = Game.time;
            if (!creep.memory.inPosition) {
                if (creep.ticksToLive && creep.ticksToLive >= 1499) {
                    creep.notifyWhenAttacked(false);
                }
                if (creep.pos.isEqualTo(this.operation.flag.pos)) {
                    creep.memory.inPosition = true;
                } else {
                    creepActions.moveTo(creep, this.operation.flag.pos);
                }
            }
        }
    }
    public finalize(): void {
        ;
    }
}
