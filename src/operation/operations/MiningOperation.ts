import { LogisticsManager } from "operation/LogisticsManager";
import { BuilderMission } from "../missions/BuilderMission";
import { MiningMission } from "../missions/MiningMission";
import { ReserveMission } from "../missions/ReserveMission";
import { ScoutMission } from "../missions/ScoutMission";
import { Operation, OperationPriority } from "./Operation";

export class MiningOperation extends Operation {
    public sources: Source[] = [];
    public logistics: LogisticsManager;

    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
        if (flag.room) {
            this.sources = _.sortBy(flag.room.find(FIND_SOURCES), (s: Source) => s.pos.getRangeTo(flag));
        }
        this.priority = OperationPriority.Low;
        this.logistics = this.spawnRoom.logistics;
        this.logistics.registerOperation(this);
    }

    public finalizeOperation(): void {
        ;
    }
    public initOperation() {
        if (!this.spawnRoom || this.spawnRoom.rclLevel < 4) { return; }
        this.addMission(new ScoutMission(this));

        for (let i = 0; i < this.sources.length; i++) {
            ;
            this.addMission(new MiningMission(this, "mining" + i, this.sources[i], true));
        }

        if (this.room && this.room.controller && this.spawnRoom.room.storage) {
            this.addMission(new ReserveMission(this));
        }
        // this.addMission(new BuilderMission(this));
    }
}
