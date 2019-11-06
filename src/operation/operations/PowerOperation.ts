import { ScoutMission } from "operation/missions/ScoutMission";
import { Operation, OperationPriority } from "./Operation";

export class PowerOperation extends Operation {
    public powersource?: StructurePowerBank;
    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
    }

    public initOperation(): void {
        this.addMission(new ScoutMission(this));

        if (this.room) {
            const power = this.room.find<StructurePowerBank>(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_POWER_BANK });
            if (!power || power.length === 0) {
                // Deposit decayed, end operation
                this.flag.remove();
            } else {
                this.powersource = power[0];
            }
        }
    }
    public finalizeOperation(): void {
        ;
    }
};
