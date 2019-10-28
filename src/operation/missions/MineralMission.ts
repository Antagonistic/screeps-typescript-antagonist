import { openAdjacentSpots } from "rooms/roomHelper";
import { Operation } from "../operations/Operation";
import { Mission } from "./mission";

import * as creepActions from "creeps/creepActions";

import * as hauler from "creeps/roles/hauler";
import * as miner from "creeps/roles/miner";

import { posix } from "path";
import { profile } from "Profiler";
import * as roomHelper from "rooms/roomHelper"
import { Traveler } from "utils/Traveler"


@profile
export class MineralMission extends Mission {
    public extractor?: StructureExtractor;
    public miners: Creep[] = [];
    public haulers: Creep[] = [];

    constructor(operation: Operation) {
        super(operation, "mineral");
    }

    public initMission(): void {
        if (this.spawnRoom.rclLevel >= 6) {
            this.extractor = _.first(this.room!.find<StructureExtractor>(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_EXTRACTOR }));
            if (!this.extractor) {
                const mineral = _.first(this.spawnRoom.room.find(FIND_MINERALS));
                if (mineral) {
                    roomHelper.buildIfNotExist(mineral.pos, STRUCTURE_EXTRACTOR);
                }
            }
        }
    }
    public spawn(): void {
        if (this.extractor) {
            const maxMiners = () => 1;
            // this.miners = this.spawnRole(this.name, maxMiners, this.getMinerBody);
        }
    }
    public work(): void {
        if (this.extractor) {
            this.runMiners();
            this.runHaulers();
        }
    }
    public finalize(): void {
        ;
    }

    public getMinerBody = () => {
        if (this.remoteSpawning) { return this.workerBody(6, 2, 3); }
        const minersSupported = 1;
        if (minersSupported === 1) {
            const work = 6;
            return this.workerBody(work, 2, Math.ceil(work / 2));
        } else if (minersSupported === 2) {
            return this.workerBody(3, 1, 2);
        } else { return this.workerBody(2, 1, 1); }
    };

    public runMiners() {
        for (const m of this.miners) {
            ;
        }
    }

    public runHaulers() {
        for (const h of this.haulers) {
            ;
        }
    }

}
