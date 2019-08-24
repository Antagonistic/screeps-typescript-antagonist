import { Mission } from "./mission";
import { Operation } from "../operations/Operation";
import { openAdjacentSpots } from "components/rooms/roomHelper";

import * as miner from "components/creeps/roles/miner";
import * as hauler from "components/creeps/roles/hauler";

export class MiningMission extends Mission {

    source: Source;
    miners: Creep[] = [];
    carts: Creep[] = [];

    _minersNeeded?: number;

    container?: StructureContainer;
    storage?: StructureStorage;

    constructor(operation: Operation, name: string, source: Source) {
        super(operation, name);
        this.source = source;
    }

    public initMission(): void {
        if (!this.hasVision) { return; }
    }
    public spawn(): void {
        this.miners = this.spawnRole(this.name, this.getMaxMiners(), this.getMinerBody);

        this.carts = this.spawnRole(this.name + "cart", this.getMaxCarts(), this.getCartBody);
    }
    public work(): void {
        for (let m of this.miners) {
            if (!m.memory.sourceID) m.memory.sourceID = this.source.id;
            miner.run(m);
        }
        for (let h of this.carts) {
            hauler.run(h);
        }
    }
    public finalize(): void {
    }

    public getMaxMiners = () => this.minersNeeded;

    public getMinerBody = () => {
        if (this.remoteSpawning) { return this.workerBody(6, 1, 6); }
        let minersSupported = this.minersSupported();
        if (minersSupported === 1) {
            let work = Math.ceil((Math.max(this.source.energyCapacity,
                SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME) / HARVEST_POWER) + 1;
            return this.workerBody(work, 1, Math.ceil(work / 2));
        } else if (minersSupported === 2) {
            return this.workerBody(3, 1, 2);
        } else { return this.workerBody(2, 1, 1); }
    };

    public getCartBody = () => {
        if (this.spawnRoom.energyCapacityAvailable >= 750) {
            // Huge hauler
            return this.workerBody(0, 10, 5);
        } else if (this.spawnRoom.energyCapacityAvailable >= 600) {
            // Big hauler
            return this.workerBody(0, 8, 4);
        } else if (this.spawnRoom.energyCapacityAvailable >= 450) {
            // Medium hauler
            return this.workerBody(0, 6, 3);
        } else {
            // Small hauler
            return this.workerBody(0, 4, 2);
        }
    };

    public getMaxCarts = () => 2;

    get minersNeeded() {
        if (!this._minersNeeded) {
            if (!this.memory.positionCount) { this.memory.positionCount = openAdjacentSpots(this.source.pos, true).length; }

            this._minersNeeded = Math.min(this.minersSupported(), this.memory.positionCount);
        }
        return this._minersNeeded;
    }

    private minersSupported(): number {
        if (this.spawnRoom.energyCapacityAvailable >= 1050 || this.remoteSpawning) {
            return 1;
        } else if (this.spawnRoom.energyCapacityAvailable >= 450) {
            return 2;
        } else {
            return 3;
        }
    }

    findContainer(): StructureContainer {
        const containers = this.source.pos.findInRange<StructureContainer>(FIND_STRUCTURES, 1,
            { filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER });
        // let containers = this.source.pos.findInRange(STRUCTURE_CONTAINER, 1);
        if (!containers || containers.length == 0) {
            this.placeContainer();
        }
        return containers[0];
    }

    placeContainer(): void {

    }
}
