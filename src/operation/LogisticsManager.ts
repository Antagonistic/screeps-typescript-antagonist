import { SpawnRoom } from "rooms/SpawnRoom";
import { MiningMission } from "./missions/MiningMission";
import { ControllerOperation } from "./operations/ControllerOperation";
import { Operation } from "./operations/Operation";


export class LogisticsManager {
    public spawnRoom: SpawnRoom;
    public room: Room;
    public operations: Operation[] = [];
    public E: number;
    public C: number;
    public S: number;
    public storage: StructureStorage | undefined;
    public links: StructureLink[] = [];
    public haslinks: boolean;
    constructor(spawnRoom: SpawnRoom) {
        this.spawnRoom = spawnRoom;
        this.room = spawnRoom.room;
        this.E = this.spawnRoom.availableSpawnEnergy;
        this.C = this.spawnRoom.energyCapacityAvailable;
        this.storage = this.room.storage;
        this.S = (this.storage) ? this.storage.store.energy : 0;
        this.links = this.room.find<StructureLink>(FIND_MY_STRUCTURES, { filter: x => x.structureType === STRUCTURE_LINK });
        this.haslinks = this.links.length > 0;
    }

    public registerOperation(operation: Operation) {
        this.operations.push(operation);
    }

    public report(): void {
        const con = this.room.controller;
        const levelPart = con ? (con.progress / con.progressTotal) * 100 : 0;
        console.log("Logistics report for spawnRoom " + this.room.name + " Level " + this.spawnRoom.rclLevel + "." + levelPart);
        console.log("E: " + this.E + "/" + this.C + "  S: " + this.S);
        for (const op of this.operations) {
            console.log(" - " + op.name);
            for (const _m in op.missions) {
                const m = op.missions[_m];
                console.log("  * " + m.name);
                if (m instanceof MiningMission) { this.reportMiningMission(m); }
            }
        }
    }

    public reportMiningMission(m: MiningMission): void {
        const numWork = _.sum(m.miners, (x: Creep) => x.getActiveBodyparts(WORK));
        const numCarry = _.sum(m.carts, (x: Creep) => x.getActiveBodyparts(CARRY));
        console.log("   Stable? : " + m.stableMission);
        console.log("   Miners  : " + m.miners.length + " W: " + numWork);
        console.log("   Haulers : " + m.carts.length + " C: " + numCarry);
    }

    public finalize(): void {
        if (this.operations.length === 0) {
            // No operations for this spawngroup? Fix it!
            ControllerOperation.initNewControllerOperation(this.room, this.spawnRoom.spawns[0].pos);
        }
    }

}
