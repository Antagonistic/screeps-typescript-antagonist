import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";

@profile
export class ScoutRandomMission extends Mission {
    public scouts: Creep[] = [];
    public roomName: string;
    public active: boolean;
    public nextSpawn: number;
    constructor(operation: Operation) {
        super(operation, "scoutSurround");
        this.roomName = this.operation.roomName;
        this.nextSpawn = this.memory.nextSpawn || 0;
        this.active = this.spawnRoom.rclLevel >= 3 && this.operation.stableOperation && Game.time >= this.nextSpawn;
    }

    public initMission(): void {
        ;
    }
    public spawn(): void {
        const maxScout = () => this.active ? 1 : 0;
        this.scouts = this.spawnRole("scoutWalk", maxScout, () => this.workerBody(0, 0, 1), 50);
    }
    public work(): void {
        for (const creep of this.scouts) {
            if (creep.memory.home) {
                if (creep.memory.home !== creep.room.name) {
                    creepActions.actionMoveToRoom(creep, false, creep.memory.home);
                    continue;
                }
            }
            // this.processRoomScout(creep.room);
            creep.notifyWhenAttacked(false);
            this.memory.nextSpawn = Game.time + 20;
            const exits = _.values(Game.map.describeExits(creep.room.name)) as string[];
            const exit = _.sample(exits);
            if (Game.map.isRoomAvailable(exit)) {
                creep.memory.home = exit;
                creepActions.actionMoveToRoom(creep, false, creep.memory.home);
            }
        }
    }
    public finalize(): void {
        ;
    }
}
