import { BodyFactory } from "creeps/BodyFactory";
import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";
import { Operation } from "../operations/Operation";
import { Mission } from "./mission";

@profile
export class EmergencyMission extends Mission {

    public emergencyminers: Creep[] = [];

    public emergency: boolean;

    constructor(operation: Operation, emergency: boolean) {
        super(operation, "emergencyMiner")
        this.emergencyminers = [];
        this.emergency = emergency;
    }
    public initMission(): void {
        // console.log("emergencyMission!")
    }

    public finalize(): void {
        // console.log("emergencyMission! " + this.emergency);
    }

    public spawn(): void {
        this.emergencyminers = this.spawnRole("harvester", this.getMaxHarvesters, () => BodyFactory.workerBody(2, 1, 1), { role: "hauler" }, 0);
    }

    public getMaxHarvesters = () => this.emergency ? 2 : 0;

    public work(): void {
        // for (let i = 0; i < this.emergencyminers.length; i++) {
        for (const c of this.emergencyminers) {
            this.harvestWork(c);
        }
    }

    public harvestWork(c: Creep): void {
        let action: boolean = false;
        action = creepActions.actionRecycle(c, action);

        if (creepActions.canWork(c)) {
            action = creepActions.actionFillEnergy(c, action);
            if (c.room.controller && c.room.controller.ticksToDowngrade < 2000) {
                action = creepActions.actionUpgrade(c, action);
            }
            action = creepActions.actionRepair(c, action, false, 8);
            action = creepActions.actionBuild(c, action);
            action = creepActions.actionUpgrade(c, action);
        } else {
            if (c.room.storage && c.room.storage.store.energy > 1000) {
                action = creepActions.actionGetStorageEnergy(c, action);
            }
            action = creepActions.actionGetDroppedEnergy(c, action, true);
            action = creepActions.actionGetContainerEnergy(c, action, 4);
            action = creepActions.actionGetLinkEnergy(c, action);
            action = creepActions.actionGetSourceEnergy(c, action, 2);
        }
    }
}
