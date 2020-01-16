import { ScoutMission } from "operation/missions/ScoutMission";
import { Operation, OperationPriority } from "./Operation";
import { PowerMission } from "operation/missions/PowerMission";

export class PowerOperation extends Operation {
    public target?: StructurePowerBank;
    public haulTo?: Structure;
    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)

        if (this.spawnRoom.room.storage) {
            this.haulTo = this.spawnRoom.room.storage;
        } else {
            for (const sR in global.emp.spawnRooms) {
                // console.log(global.emp.spawnRooms[sR].room);
                if (global.emp.spawnRooms[sR] && global.emp.spawnRooms[sR].room && global.emp.spawnRooms[sR].room.storage) {
                    this.haulTo = global.emp.spawnRooms[sR].room.storage;
                }
            }
        }
    }

    public initOperation(): void {
        this.addMission(new ScoutMission(this));

        if (this.room) {
            const power = this.room.find<StructurePowerBank>(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_POWER_BANK });
            if (!power || power.length === 0) {
                // Deposit decayed, end operation
                this.flag.remove();
            } else {
                this.target = power[0];
                this.addMission(new PowerMission(this, "power", this.target, this.haulTo));
            }
        }
    }
    public finalizeOperation(): void {
        ;
    }
};
