import { SpawnRoom } from "rooms/SpawnRoom";
import { ControllerOperation } from "./operations/ControllerOperation";
import { Operation } from "./operations/Operation";

import { MineralMission } from "./missions/MineralMission";
import { MiningMission } from "./missions/MiningMission";
import { UpgradeMission } from "./missions/UpgradeMission";

import * as creepActions from "creeps/creepActions";
import * as layoutManager from "rooms/layoutManager";
import * as roadHelper from "rooms/roadHelper";
import { BuilderMission } from "./missions/BuilderMission";

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
        if (Game.time % 5008 === 0) {
            this.room.memory.dest = undefined;
        }
    }

    public needRefill() {
        if (this.room.storage && this.room.find(FIND_MY_CREEPS, { filter: x => x.memory.role === "refill" }).length === 0) {
            return true;
        }
        return false;
    }

    public registerOperation(operation: Operation) {
        this.operations.push(operation);
    }

    public getDestinations(): RoomPosition[] {
        if (this.room.memory.dest && this.room.memory.dest.length > 0) {
            return this.room.memory.dest;
        }
        const dest: RoomPosition[] = [];
        for (const op of this.operations) {
            console.log('Checking ' + op.type + ' ' + op.name);
            for (const _m in op.missions) {
                const m = op.missions[_m];
                if (m instanceof MiningMission) {
                    console.log('  Checking ' + m.name);
                    if (m.source) {
                        dest.push(m.source.pos);
                    }
                }
                if (m instanceof UpgradeMission) {
                    if (m.container) {
                        dest.push(m.container.pos);
                    }
                }
                if (m instanceof MineralMission) {
                    if (m.mineral) {
                        dest.push(m.mineral.pos);
                    }
                }
            }
        }
        this.room.memory.dest = dest;
        return dest;
    }

    public getRoads(): RoomPosition[] {
        let controllerOp = null;
        for (const op of this.operations) {
            if (op instanceof ControllerOperation) {
                controllerOp = op;
                break;
            }
        }
        let roads: RoomPosition[] = [];
        if (controllerOp) {
            const center = controllerOp.flag.pos;
            roads = roads.concat(layoutManager.getRoads(this.room));
            const destinations = this.getDestinations();
            for (const d of destinations) {
                const road = roadHelper.pavePath(d, center, 3);
                const _road = _.filter(road, { roomName: this.room.name })
                this.room.visual.poly(_road);

                roads = roads.concat(road);
            }
        }
        roads = _.uniq(roads);
        return roads;
    }

    public buildRoads() {
        const roads = this.getRoads();
        const construct = roadHelper.getUnbuiltRoads(roads);
        if (construct.length > 0) {
            if (Object.keys(Game.constructionSites).length < 60) {
                for (const r of construct) {
                    r.createConstructionSite(STRUCTURE_ROAD);
                }
            }
        }
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
                if (m instanceof UpgradeMission) { this.reportUpgraderMission(m); }
                if (m instanceof BuilderMission) { this.reportBuilderMission(m); }
            }
        }
    }

    public reportMiningMission(m: MiningMission): void {
        const numWork = _.sum(m.miners, (x: Creep) => x.getActiveBodyparts(WORK));
        const numCarry = _.sum(m.carts, (x: Creep) => x.getActiveBodyparts(CARRY));
        console.log("   Stable?   : " + m.stableMission);
        console.log("   Link?     : " + m.isLink);
        console.log("   Miners    : " + m.miners.length + " W: " + numWork);
        console.log("   Haulers   : " + m.carts.length + " C: " + numCarry);
    }

    public reportUpgraderMission(m: UpgradeMission): void {
        const numWork = _.sum(m.upgraders, (x: Creep) => x.getActiveBodyparts(WORK));
        const numCarry = _.sum(m.haulers, (x: Creep) => x.getActiveBodyparts(CARRY));
        console.log("   Link?     : " + m.isLink);
        console.log("   Upgraders : " + m.upgraders.length + " W: " + numWork);
        console.log("   Haulers   : " + m.haulers.length + " C: " + numCarry);
    }

    public reportBuilderMission(m: BuilderMission): void {
        const numBuild = _.sum(m.builders, (x: Creep) => x.getActiveBodyparts(WORK));
        const numPave = _.sum(m.pavers, (x: Creep) => x.getActiveBodyparts(WORK));
        console.log("   Builders  : " + m.builders.length + " W: " + numBuild);
        console.log("   Pavers    : " + m.pavers.length + " C: " + numPave);
    }

    public finalize(): void {
        if (this.operations.length === 0) {
            // No operations for this spawngroup? Fix it!
            console.log("No operations for this spawngroup? Fix it!");
            ControllerOperation.initNewControllerOperation(this.room, this.spawnRoom.spawns[0].pos);
        }
    }

}
