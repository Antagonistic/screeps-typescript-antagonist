import { MiningMission } from "../missions/MiningMission";
import { ScoutMission } from "../missions/ScoutMission";
import { Operation } from "./Operation";
import { BuilderMission } from "../missions/BuilderMission";
import { ReserveMission } from "../missions/ReserveMission";

export class MiningOperation extends Operation {
    public sources: Source[] = [];

    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
        if (flag.room) {
            this.sources = _.sortBy(flag.room.find(FIND_SOURCES), (s: Source) => s.pos.getRangeTo(flag));
        }
    }

    public finalizeOperation(): void {
        ;
    }
    public initOperation() {
        if (!this.spawnRoom || this.spawnRoom.rclLevel < 4) { return; }
        this.addMission(new ScoutMission(this));
        if (this.room && this.room.controller) {
            this.addMission(new ReserveMission(this));
        }
        for (let i = 0; i < this.sources.length; i++) {
            ;
            this.addMission(new MiningMission(this, "mining" + i, this.sources[i], true));
        }
        // this.addMission(new BuilderMission(this));
    }
}
