import { LogisticsManager } from "operation/LogisticsManager";
import { GuardMission } from "operation/missions/GuardMission";
import { BuilderMission } from "../missions/BuilderMission";
import { MiningMission } from "../missions/MiningMission";
import { ReserveMission } from "../missions/ReserveMission";
import { ScoutMission } from "../missions/ScoutMission";
import { Operation, OperationPriority } from "./Operation";

export class MiningOperation extends Operation {
    public sources: Source[] = [];
    public logistics: LogisticsManager;
    public active: boolean;

    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
        if (flag.room) {
            this.sources = _.sortBy(flag.room.find(FIND_SOURCES), (s: Source) => s.pos.getRangeTo(flag));
        }
        this.priority = OperationPriority.Low;
        this.logistics = this.spawnRoom.logistics;
        this.logistics.registerOperation(this);
        this.active = this.getActive();
    }

    public getActive() {
        if (this.memory.active === false) { return false; }
        if (!this.spawnRoom || this.spawnRoom.rclLevel < 4) { return false; }
        if (this.spawnRoom.room.memory.noRemote) { return false; }
        if (this.getToHomeRange() > 2) { return false; }
        if (this.room && this.room.controller && this.room.controller.reservation && this.room.controller.reservation.username === "Invader") { return false; }
        return true;
    }

    public finalizeOperation(): void {
        ;
    }
    public initOperation() {
        // if (!this.active) { return; }
        this.addMission(new ScoutMission(this));

        this.addMission(new GuardMission(this));

        for (let i = 0; i < this.sources.length; i++) {
            ;
            this.addMission(new MiningMission(this, "mining" + i, this.sources[i], this.logistics, this.active));
        }

        if (this.room && this.room.controller && this.spawnRoom.room.storage && this.active) {
            this.addMission(new ReserveMission(this));
        }
        // this.addMission(new BuilderMission(this));
    }
}
