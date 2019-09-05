import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import * as creepActions from "creeps/creepActions";

export class RefillMission extends Mission {
    public haulers: Creep[] = [];
    constructor(operation: Operation) {
        super(operation, "refill");
    }

    public initMission(): void {
        ;
    } public spawn(): void {
        const numCarts = (): number => this.room && this.room.storage ? 1 : 0;
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
            let action: boolean = false;
            action = creepActions.actionRecycle(creep, action);

            if (!action && creepActions.canWork(creep)) {
                action = creepActions.actionFillCache(creep, action);
                // action = creepActions.actionMoveToRoom(creep, action, creep.memory.home);
                action = creepActions.actionFillEnergy(creep, action);
                action = creepActions.actionFillTower(creep, action);
                // action = creepActions.actionFillBufferChest(creep, action);
                // action = creepActions.actionFillEnergyStorage(creep, action);
                action = creepActions.actionFillBuilder(creep, action);
                action = creepActions.actionFillUpgrader(creep, action);
                // action = creepActions.actionBuild(creep, action);
                // action = creepActions.actionUpgrade(creep, action);
                if (!action) { creepActions.moveTo(creep, this.operation.rallyPos); };
                // action = creepActions.actionRally(creep, action);
            } else {
                // action = creepActions.actionMoveToRoom(creep, action);
                // action = creepActions.actionGetDroppedEnergy(creep, action, true);
                // action = creepActions.actionGetContainerEnergy(creep, action, 2, true);
                action = creepActions.actionGetStorageEnergy(creep, action);
            }
        }
    }


}
