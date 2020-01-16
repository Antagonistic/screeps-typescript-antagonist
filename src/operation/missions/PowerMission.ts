import { Operation } from "operation/operations/Operation";
import { Mission } from "./Mission";

import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";
import { PairAttackMission } from "./PairAttackMission";

@profile
export class PowerMission extends PairAttackMission {
    public carts: Creep[] = [];
    public target?: StructurePowerBank;
    public haulTo?: Structure;
    constructor(operation: Operation, name: string, target?: StructurePowerBank, haulTo?: Structure) {
        super(operation, name);
        this.target = target;
        this.haulTo = haulTo;
    }

    public initMission(): void {
        ;
    }

    public spawn(): void {
        ;
    }

    public work(): void {
        ;
    }

    public finalize(): void {
        ;
    }

    public getWarriorBody() {
        ;
    }

    public getPriestBody() {
        ;
    }
}
