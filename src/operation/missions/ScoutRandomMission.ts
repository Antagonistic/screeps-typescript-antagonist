import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import { BodyFactory } from "creeps/BodyFactory";
import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";
import { EnergyState } from "config/Constants";

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
        this.active = this.isActive();
    }


    public isActive() {
        if (Game.cpu.bucket < 9000) { return false; }
        if (this.spawnRoom.rclLevel < 3) { return false; }
        if (!this.operation.stableOperation) { return false; }
        if (Game.time < this.nextSpawn) { return false; }
        if (this.energyState() === EnergyState.CRITICAL) { return false; }
        return true;
    }

    public initMission(): void {
        ;
    }
    public spawn(): void {
        const maxScout = () => this.active ? 1 : 0;
        this.scouts = this.spawnRole("scoutWalk", maxScout, () => BodyFactory.workerBody(0, 0, 1), 50);
    }
    public work(): void {
        for (const creep of this.scouts) {
            if (creep.memory.highCPU) {
                console.log(`SCOUT: High CPU: ${creep.name}, suiciding!`);
                creep.suicide();
                continue;
            }
            if (creep.memory.home) {
                if (creep.memory.home !== creep.room.name) {
                    creepActions.actionMoveToRoom(creep, false, creep.memory.home);
                    continue;
                }
            }
            // this.processRoomScout(creep.room);
            creep.notifyWhenAttacked(false);
            if (Game.cpu.bucket < 10000) {
                this.memory.nextSpawn = Game.time + 500;
            }
            else {
                this.memory.nextSpawn = Game.time + 20;
            }
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
