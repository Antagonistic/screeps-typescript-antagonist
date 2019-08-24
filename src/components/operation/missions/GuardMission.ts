import { Mission } from "./Mission";
import { Operation } from "../operations/Operation";

import * as guard from "components/creeps/roles/guard";

export class GuardMission extends Mission {
    defenders: Creep[] = [];
    constructor(operation: Operation) {
        super(operation, "Guard");
    }
    public initMission(): void {
    }
    public spawn(): void {
        this.defenders = this.spawnRole("defender", this.getMaxGuards(), this.defenderBody);
    }
    public work(): void {
        for (let g of this.defenders) {
            guard.run(g);
        }
    }
    public finalize(): void {
    }

    public getMaxGuards = () => {
        if (!this.room) return 0;
        const hostiles = this.room.find(FIND_HOSTILE_CREEPS);
        if (hostiles && hostiles.length) {
            return 1;
        }
        return 0;
    }

    defenderBody = (): BodyPartConstant[] => {
        return this.configBody({ [TOUGH]: 1, [ATTACK]: 1, [MOVE]: 2 });
    }
}
