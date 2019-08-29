import { Operation } from "./Operation";

import { log } from "lib/logger/log";
import { BuilderMission } from "../missions/BuilderMission";
import { EmergencyMission } from "../missions/EmergencyMission";
import { GuardMission } from "../missions/GuardMission";
import { MiningMission } from "../missions/MiningMission";
import { UpgradeMission } from "../missions/UpgradeMission";

import * as StructureManager from "components/rooms/structureManager";

export class ControllerOperation extends Operation {
    public sources: Source[] = [];
    public emergency: boolean;
    public controllerCrate?: StructureContainer;
    public rallyPos: RoomPosition;

    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
        if (flag.room) {
            this.sources = _.sortBy(flag.room.find(FIND_SOURCES), (s: Source) => s.pos.getRangeTo(flag));
        }
        this.emergency = this.memory.emergency === undefined ? true : this.memory.emergency;

        const rallyFlag = Game.flags["rally_" + this.roomName];
        if (rallyFlag) {
            this.rallyPos = rallyFlag.pos;
        } else {
            this.rallyPos = new RoomPosition(25, 25, this.roomName);
        }
        new RoomVisual(this.roomName).circle(this.rallyPos, { radius: 0.5, fill: "#FF2121" });
        // console.log("Emergency: " + this.emergency);
    }

    public initOperation() {
        this.addMission(new EmergencyMission(this, this.emergency));

        for (let i = 0; i < this.sources.length; i++) {
            let active = true;

            this.addMission(new MiningMission(this, "mining" + i, this.sources[i], active))

            if (i === 0) {
                this.addMission(new GuardMission(this));
            }
        }

        this.addMission(new BuilderMission(this));

        this.addMission(new UpgradeMission(this));

        if (Game.time % 50 === 1) {
            console.log("Operation stable: " + this.stableOperation);
            if (this.stableOperation) {
                // this.buildMineRoads();
            }
        }

    }

    public finalizeOperation() {
        this.memory.emergency = this.emergency = (this.spawnRoom.room.find(FIND_MY_CREEPS).length < 6);
        //this.memory.emergency = ;
    }

    private findMinersBySources() {
        for (const source of this.sources) {
            if (source.pos.findInRange(FIND_MY_CREEPS, 1, { filter: (c: Creep) => c.memory.role && c.memory.role === "miner" }).length > 0) {
                return true;
            }
        }
        return false;
    }

    public buildMineRoads() {
        if (this.room) {
            if (this.room.memory.mine_structures) {
                return;
            }
            log.info(this.room.name + ": Placing mining room layouts!");

            const homeSpawn: StructureSpawn[] = this.room.find(FIND_MY_SPAWNS);
            const mineSources: Source[] = this.room.find(FIND_SOURCES);
            if (homeSpawn && homeSpawn.length && mineSources && mineSources.length) {
                for (const s of mineSources) {
                    StructureManager._buildRoad(homeSpawn[0].pos, s.pos, true, true);
                }
                this.room.memory.mine_structures = Game.time;
            }
        }
    }


}

export function initNewControllerOperation(room: Room): void {
    if (room.controller && room.controller.my) {
        const pos: RoomPosition = room.controller.pos;
        const name = room.createFlag(pos.x, pos.y, "controller_" + room.name, 1, 2)
        if (name === ERR_NAME_EXISTS || name === ERR_INVALID_ARGS) {
            log.error("Error initializing new controller operation!")
        }
    }
}

