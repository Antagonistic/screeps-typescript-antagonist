/*import { ScoutMission } from "operation/missions/ScoutMission";
import { Operation, OperationPriority } from "./Operation";

const FIND_DEPOSITS: FindConstant = 122;

export class DepositOperation extends Operation {
    public deposit?: StructureDeposit;
    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
    }

    public initOperation(): void {
        this.addMission(new ScoutMission(this));

        if (this.room) {
            const deposits = this.room.find(FIND_DEPOSITS);
            if (!deposits || deposits.length === 0) {
                // Deposit decayed, end operation
                this.flag.remove();
            }
        }
    }
    public finalizeOperation(): void {
        ;
    }
};*/
