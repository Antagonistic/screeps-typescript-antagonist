import { profile } from "Profiler";
import * as harvester from "../../creeps/roles/harvester";
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
        this.emergencyminers = this.spawnRole("harvester", this.getMaxHarvesters, () => this.workerBody(2, 1, 1), { role: "hauler" }, 0);
    }

    public getMaxHarvesters = () => this.emergency ? 2 : 0;

    public work(): void {
        // for (let i = 0; i < this.emergencyminers.length; i++) {
        for (const c of this.emergencyminers) {
            this.harvestWork(c);
        }
    }


    public harvestWork(c: Creep): void {
        harvester.run(c);
    }


}
