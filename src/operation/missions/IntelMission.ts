import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";

@profile
export class IntelMission extends Mission {
    public scouts: Creep[] = [];
    public roomName: string;
    public active: boolean;
    constructor(operation: Operation) {
        super(operation, "scoutSurround");
        this.roomName = this.operation.roomName;
        this.active = false;
    }

    public initMission(): void {
        if (this.spawnRoom.room.memory.remoteRoom) {
            const unassigned = this.scouts.filter(x => !x.memory.home);
            const watchedRooms = this.scouts.filter(x => x.memory.home).map(x => x.memory.home);
            // for(const r of this.spawnRoom.roo)
        }
    }
    public spawn(): void {
        this.scouts = this.spawnRole("scout", () => this.room ? 0 : 1, () => this.workerBody(0, 0, 1), 50);
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
