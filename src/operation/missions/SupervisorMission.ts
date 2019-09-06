import { LogisticsManager } from "operation/LogisticsManager";
import { Operation } from "../operations/Operation";
import { Mission } from "./mission";


export class EmergencyMission extends Mission {
    public logistics: LogisticsManager;
    public supers: Creep[] = [];
    constructor(operation: Operation, logistics: LogisticsManager) {
        super(operation, "supervisor");
        this.logistics = logistics;
    }
    public initMission(): void {
        ;
    }
    public spawn(): void {
        const numSuper = (): number => {
            return this.logistics.storage ? 1 : 0;
        }
        const superBody = (): BodyPartConstant[] {
            const carryparts = Math.min((this.logistics.C / 50) - 1, 15);
            return this.workerBody(0, carryparts, 1);
        }
        this.supers = this.spawnRole("super", numSuper, superBody, { role: "super" }, 0);
    }
    public work(): void {
        ;
    }
    public finalize(): void {
        ;
    }

}
