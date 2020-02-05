import { LogisticsManager } from "operation/LogisticsManager";
import { BuilderMission } from "operation/missions/BuilderMission";
import { ClaimMission } from "operation/missions/ClaimMission";
import { EmergencyMission } from "operation/missions/EmergencyMission";
import { GuardMission } from "operation/missions/GuardMission";
import { MiningMission } from "operation/missions/MiningMission";
import { ScoutMission } from "operation/missions/ScoutMission";
import { UpgradeMission } from "operation/missions/UpgradeMission";
import { Operation, OperationPriority } from "./Operation";

export class SnakeOperation extends Operation {
    public sources: Source[] = [];
    public logistics: LogisticsManager;
    public emergency: boolean;

    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
        if (flag.room) {
            this.sources = _.sortBy(flag.room.find(FIND_SOURCES), (s: Source) => s.pos.getRangeTo(flag));
        }

        this.logistics = this.spawnRoom.logistics;
        this.logistics.registerOperation(this);
        this.priority = OperationPriority.OwnedRoom;
        this.emergency = false;
        this.stableOperation = true;
    }

    public initOperation(): void {
        if (this.remoteSpawning) {
            this.addMission(new ScoutMission(this));
            this.addMission(new GuardMission(this));
            this.addMission(new ClaimMission(this));
            this.addMission(new BuilderMission(this, this.logistics, false));
        } else {
            this.addMission(new EmergencyMission(this, this.emergency));
            this.addMission(new GuardMission(this));

            for (let i = 0; i < this.sources.length; i++) {
                this.addMission(new MiningMission(this, "mining" + i, this.sources[i], this.logistics))
            }

            this.addMission(new BuilderMission(this, this.logistics, false));

            this.addMission(new UpgradeMission(this));
        }
    }
    public finalizeOperation(): void {
        ;
    }
}
