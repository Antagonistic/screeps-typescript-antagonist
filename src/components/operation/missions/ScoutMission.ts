import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import * as creepActions from "components/creeps/creepActions";

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
        this.scouts = this.spawnRole("scout", () => this.room ? 0 : 1, () => this.workerBody(0, 0, 1), 50);
    }
    public work(): void {
        for (const creep of this.scouts) {
            if (creep.ticksToLive && creep.ticksToLive >= 1499) {
                creep.notifyWhenAttacked(false);
            }

            creepActions.moveTo(creep, this.operation.flag.pos);
        }
    }
    public finalize(): void {
        ;
    }
}
