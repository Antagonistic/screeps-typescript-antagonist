import { Operation } from "operation/operations/Operation";
import { Mission } from "./Mission";

import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";

@profile
export class PairAttackMission extends Mission {
    public target?: Structure | Creep;
    public warrior: Creep[] = [];
    public priest: Creep[] = [];
    constructor(operation: Operation, name: string, target?: Structure | Creep) {
        super(operation, name);
        this.target = target;
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
}
