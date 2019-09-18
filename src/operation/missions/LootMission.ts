import { Operation } from "operation/operations/Operation";
import { Mission } from "./Mission";

import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";

@profile
export class LootMission extends Mission {
    public carts: Creep[] = [];
    public target?: Structure;
    public haulTo?: Structure;
    constructor(operation: Operation, name: string, target?: Structure, haulTo?: Structure) {
        super(operation, name);
        this.target = target;
        this.haulTo = haulTo;
    }

    public initMission(): void {
        ;
    }

    public spawn(): void {
        const needCart = () => this.room && this.target && this.haulTo ? 1 : 0;
        this.carts = this.spawnRole("cart", needCart, this.getCartBody, { role: "hauler", energyTarget: this.target });
    }
    public work(): void {
        for (const h of this.carts) {
            if (_.sum(h.carry) < h.carryCapacity) {
                if (this.target && this.target.pos) {
                    // h.say("LOOT!");
                    creepActions.moveToWithdrawAll(h, this.target);
                } else {
                    h.suicide();
                }
            } else {
                if (_.sum(h.carry) > 0) {
                    h.say("Booty!");
                    creepActions.actionTransfer(h, false, this.haulTo);
                }
            }
        }
    }

    public finalize(): void {
        ;

    }

}
