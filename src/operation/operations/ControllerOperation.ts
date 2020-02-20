import { Operation, OperationPriority } from "./Operation";

// import { log } from "lib/logger/log";
import { LogisticsManager } from "operation/LogisticsManager";

import { ClaimMission } from "operation/missions/ClaimMission";
import { IgorMission } from "operation/missions/IgorMission";
import { LinkMission } from "operation/missions/LinkMission";
import { MineralMission } from "operation/missions/MineralMission";
import { ScoutMission } from "operation/missions/ScoutMission";
import { ScoutRandomMission } from "operation/missions/ScoutRandomMission";
import { SupervisorMission } from "operation/missions/SupervisorMission";
import { BuilderMission } from "../missions/BuilderMission";
import { EmergencyMission } from "../missions/EmergencyMission";
import { GuardMission } from "../missions/GuardMission";
import { MiningMission } from "../missions/MiningMission";
import { RefillMission } from "../missions/RefillMission";
import { UpgradeMission } from "../missions/UpgradeMission";

export class ControllerOperation extends Operation {
    public sources: Source[] = [];
    public emergency: boolean;
    public controllerCrate?: StructureContainer;
    public logistics: LogisticsManager;

    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
        if (flag.room) {
            this.sources = _.sortBy(flag.room.find(FIND_SOURCES), (s: Source) => s.pos.getRangeTo(flag));
            flag.room.memory.center = flag.room.storage?.pos || flag.pos;
        }
        this.emergency = this.memory.emergency === undefined ? true : this.memory.emergency;
        this.logistics = this.spawnRoom.logistics;
        this.logistics.registerOperation(this);
        this.priority = OperationPriority.OwnedRoom;

        new RoomVisual(this.roomName).circle(this.rallyPos, { radius: 0.5, fill: "#FF2121" });
        // console.log("Emergency: " + this.emergency);
    }

    public initOperation() {
        if (this.remoteSpawning) {
            this.addMission(new ScoutMission(this));
            this.addMission(new GuardMission(this));
            this.addMission(new ClaimMission(this));
            this.addMission(new BuilderMission(this, this.logistics));
        } else {
            this.addMission(new EmergencyMission(this, this.emergency && !this.remoteSpawning));
            this.addMission(new GuardMission(this));

            for (let i = 0; i < this.sources.length; i++) {
                this.addMission(new MiningMission(this, "mining" + i, this.sources[i], this.logistics))
            }

            this.addMission(new RefillMission(this));

            this.addMission(new SupervisorMission(this, this.logistics));

            // if (Game.time % 5 === 3) {
            this.addMission(new LinkMission(this));
            // }

            this.addMission(new BuilderMission(this, this.logistics));

            this.addMission(new UpgradeMission(this, this.logistics));

            this.addMission(new IgorMission(this));

            this.addMission(new ScoutRandomMission(this));

            if (this.spawnRoom.rclLevel >= 6) {
                this.addMission(new MineralMission(this));
            }

            if (Game.time % 50 === 1) {
                if (this.room) {
                    if (!this.stableOperation) {
                        console.log(this.room.print + " Operation stable: " + this.stableOperation);
                    }
                }
                if (this.stableOperation) {
                    // this.buildMineRoads();
                }
            }
        }
    }

    public spawn(): void {
        /*if (!this.remoteSpawning && this.stableOperation && Game.time % 1000 === 135 && Game.cpu.bucket > 5000 && this.room) {
            layoutManager.run(this.room, -1, true);
        }*/
        super.spawn();
    }


    public finalizeOperation() {
        this.memory.emergency = this.emergency = (this.spawnRoom.room.find(FIND_MY_CREEPS).length < 4 && this.spawnRoom.availableSpawnEnergy < 900) || this.spawnRoom.room.find(FIND_MY_CREEPS).length === 0;
        // this.memory.emergency = ;
    }

    private findMinersBySources() {
        for (const source of this.sources) {
            if (source.pos.findInRange(FIND_MY_CREEPS, 1, { filter: (c: Creep) => c.memory.role && c.memory.role === "miner" }).length > 0) {
                return true;
            }
        }
        return false;
    }

    public static initNewControllerOperation(room: Room, pos?: RoomPosition): void {
        if (room.controller && room.controller.my) {
            if (!pos) {
                pos = room.controller.pos;
            }
            const name = room.createFlag(pos.x, pos.y, "controller_" + room.name, 1, 2)
            if (name === ERR_NAME_EXISTS || name === ERR_INVALID_ARGS) {
                console.log("Error initializing new controller operation!")
            }
        }
    }

}



