import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import * as creepActions from "creeps/creepActions";
import { task } from "creeps/tasks";
import { profile } from "Profiler";

@profile
export class RefillMission extends Mission {
    public haulers: Creep[] = [];
    constructor(operation: Operation) {
        super(operation, "refill");
    }

    public initMission(): void {
        ;
    } public spawn(): void {
        const numCarts = (): number => this.room && this.spawnRoom.rclLevel >= 4 && this.room.storage ? 1 : 0;
        this.haulers = this.spawnRole(this.name + "cart", numCarts, this.getCartBody, { role: "refill" }, 10);
    }
    public work(): void {
        this.runRefill();
    }
    public finalize(): void {
        ;
    }

    public runRefill(): void {
        for (const creep of this.haulers) {
            creep.actionTarget();
            if (!creep.action) {
                if (creepActions.canWork(creep)) {
                    task.refill(creep);
                    if (!creep.action && creep.store.energy < creep.store.getCapacity() / 2) {
                        task.getEnergyStorage(creep, 0); // Nothing to do, go refill
                    }
                } else {
                    task.getEnergyStorage(creep, 0);
                    if (!creep.action && creep.store.energy > 50 && creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
                        // Rather than rally on empty storage, refill what you have to refill
                        task.refill(creep);
                    }
                }
                creep.rally();
            }
        }
    }
}
