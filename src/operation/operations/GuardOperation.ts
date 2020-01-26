import { GuardMission } from "operation/missions/GuardMission";
import { ScoutMission } from "operation/missions/ScoutMission";
import { Operation, OperationPriority } from "./Operation";

const FIND_DEPOSITS: FindConstant = 122;

export class GuardOperation extends Operation {
    public deposit?: Deposit;
    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
    }

    public initOperation(): void {
        this.addMission(new ScoutMission(this));

        this.addMission(new GuardMission(this, true));
    }
    public finalizeOperation(): void {
        ;
    }
};
