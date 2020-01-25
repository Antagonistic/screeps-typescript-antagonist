import { ScoutMission } from "operation/missions/ScoutMission";
import { Operation, OperationPriority } from "./Operation";
import { Traveler } from "utils/Traveler";

const FIND_DEPOSITS: FindConstant = 122;

export class InvaderOperation extends Operation {
    public core?: StructureInvaderCore;
    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
    }

    public initOperation(): void {
        if (this.room) {
            const core = this.room.find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_INVADER_CORE });
            if (!core || core.length === 0) {
                // Invader decayed, end operation
                this.flag.remove();
            } else {
                if (this.getToHomeRange() <= 2) {
                    this.addMission(new ScoutMission(this));
                }
            }
        }
    }
    public finalizeOperation(): void {
        ;
    }
};
