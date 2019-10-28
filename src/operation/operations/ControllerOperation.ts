import { Operation } from "./Operation";

import { log } from "lib/logger/log";
import { BuilderMission } from "../missions/BuilderMission";
import { EmergencyMission } from "../missions/EmergencyMission";
import { GuardMission } from "../missions/GuardMission";
import { MiningMission } from "../missions/MiningMission";
import { UpgradeMission } from "../missions/UpgradeMission";

import { LogisticsManager } from "operation/LogisticsManager";
import { ClaimMission } from "operation/missions/ClaimMission";
import { LinkMission } from "operation/missions/LinkMission";
import { MineralMission } from "operation/missions/MineralMission";
import { ScoutMission } from "operation/missions/ScoutMission";
import { SupervisorMission } from "operation/missions/SupervisorMission";
import * as StructureManager from "rooms/structureManager";
import { RefillMission } from "../missions/RefillMission";

export class ControllerOperation extends Operation {
    public sources: Source[] = [];
    public emergency: boolean;
    public controllerCrate?: StructureContainer;
    public logistics: LogisticsManager;

    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
        if (flag.room) {
            this.sources = _.sortBy(flag.room.find(FIND_SOURCES), (s: Source) => s.pos.getRangeTo(flag));
        }
        this.emergency = this.memory.emergency === undefined ? true : this.memory.emergency;
        this.logistics = this.spawnRoom.logistics;
        this.logistics.registerOperation(this);

        new RoomVisual(this.roomName).circle(this.rallyPos, { radius: 0.5, fill: "#FF2121" });
        // console.log("Emergency: " + this.emergency);
    }

    public initOperation() {
        if (this.remoteSpawning) {
            this.addMission(new ScoutMission(this));
            this.addMission(new ClaimMission(this));
            this.addMission(new BuilderMission(this));
        } else {
            this.addMission(new EmergencyMission(this, this.emergency && !this.remoteSpawning));

            for (let i = 0; i < this.sources.length; i++) {

                this.addMission(new MiningMission(this, "mining" + i, this.sources[i]))

                if (i === 0) {
                    this.addMission(new GuardMission(this));
                }
            }

            this.addMission(new RefillMission(this));

            this.addMission(new SupervisorMission(this, this.logistics));

            if (Game.time % 5 === 3) {
                this.addMission(new LinkMission(this));
            }

            this.addMission(new BuilderMission(this));

            this.addMission(new UpgradeMission(this));

            if (this.spawnRoom.rclLevel >= 6) {
                this.addMission(new MineralMission(this));
            }

            if (Game.time % 50 === 1) {
                console.log("Operation stable: " + this.stableOperation);
                if (this.stableOperation) {
                    // this.buildMineRoads();
                }
            }
        }
    }


    public finalizeOperation() {
        this.memory.emergency = this.emergency = (this.spawnRoom.room.find(FIND_MY_CREEPS).length < 4);
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
                log.error("Error initializing new controller operation!")
            }
        }
    }

}



