import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import 'config/config'

import { TargetAction } from "config/config";
import * as creepActions from "creeps/creepActions";
import { LogisticsManager } from "operation/LogisticsManager";
import { profile } from "Profiler";
import * as layoutManager from "rooms/layoutManager";
import * as roadHelper from "rooms/roadHelper";
import * as roomHelper from "rooms/roomHelper";

export const PRIORITY_BUILD: string[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_TOWER,
    STRUCTURE_EXTENSION,
    STRUCTURE_LAB,
    // STRUCTURE_ROAD,
    STRUCTURE_CONTAINER,
    STRUCTURE_LINK,
    STRUCTURE_STORAGE
];

export const PRIORITY_REPAIR: string[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_TOWER,
    STRUCTURE_EXTENSION,
    STRUCTURE_LAB,
    STRUCTURE_LINK,
    STRUCTURE_STORAGE
];

@profile
export class BuilderMission extends Mission {

    public builders: Creep[] = [];
    public pavers: Creep[] = [];
    public roadsites: ConstructionSite[] = [];
    public sites: ConstructionSite[] = [];
    public prioritySites: ConstructionSite[] = [];
    public logistics: LogisticsManager;

    public destination?: RoomPosition;
    public destI: number;
    public roadSite?: ConstructionSite | StructureRoad | StructureContainer;
    public roadI: number;

    // public roadRepIds: Id<StructureRoad | StructureContainer>;
    public roadRepTime: number;
    public roadConstruct?: ConstructionSite | null;

    public buildDestRoads: boolean;

    public active: boolean;

    constructor(operation: Operation, logistics: LogisticsManager, buildDestRoads: boolean = true) {
        super(operation, "builder")
        this.buildDestRoads = buildDestRoads;
        this.logistics = logistics;
        if (!this.memory.destI) { this.memory.destI = 0; }
        this.destI = this.memory.destI;
        if (!this.memory.roadI) { this.memory.roadI = 0; }
        this.roadI = this.memory.roadI;
        this.active = this.hasEnergy();
        // this.roadRepIds = this.getRoadRepList();
        if (!this.memory.roadRepTime) {
            this.memory.roadRepTime = Game.time + 2000;
        }
        this.roadRepTime = this.memory.roadRepTime;
    }
    public initMission(): void {
        if (this.room) {
            this.sites = this.room.find(FIND_CONSTRUCTION_SITES,
                { filter: (x: ConstructionSite) => x.structureType !== STRUCTURE_ROAD });
            this.roadsites = this.room.find(FIND_CONSTRUCTION_SITES,
                { filter: (x: ConstructionSite) => x.structureType === STRUCTURE_ROAD });
            this.prioritySites = _.filter(this.sites, s => PRIORITY_BUILD.indexOf(s.structureType) > -1);
            this.destination = this.memory.destination;
            // console.log(this.sites.length);
        }
    }
    public spawn(): void {
        this.builders = this.spawnRole(this.name, this.maxBuilders, this.builderBody, { role: "builder" });
        this.pavers = this.spawnRole(this.name + "paver", this.maxPavers, this.builderBody, { role: "builder" });
    }
    public work(): void {
        // for (const b of this.builders) {
        //     if (b.carry.energy > 10) { b.memory.working = true; }
        //     builder.run(b);
        // }
        this.runBuilders();
        this.runPavers2();
        this.runTowers();
    }
    public finalize(): void {
        // Create new sites
        if (!this.remoteSpawning && this.room && this.operation.stableOperation) {
            const wait = Game.cpu.bucket <= 10000 ? 300 : 50;
            if (this.roadsites.length <= 1) {
                if (!this.memory.nextBuildRoad || this.memory.nextBuildRoad <= Game.time) {
                    this.getRoadConstruct()
                    this.getRoadRepList();
                    if (layoutManager.makeNextBuildSite(this.room, true)) {
                        this.memory.nextBuildRoad = Game.time + wait;
                    } else {
                        this.memory.nextBuildRoad = Game.time + wait * 5;
                    }
                }
            }
            if (this.sites.length <= 1) {
                if (!this.memory.nextBuildSite || this.memory.nextBuildSite <= Game.time) {
                    if (layoutManager.makeNextBuildSite(this.room, false)) {
                        this.memory.nextBuildSite = Game.time + wait;
                    } else {
                        this.memory.nextBuildSite = Game.time + wait * 5;
                    }
                }
            }
        }
    }

    public needMason() {
        if (this.memory.needMasonTimer && this.memory.needMasonTimer > Game.time) {
            if (this.memory.needMason === undefined) { this.memory.needMasonTimer = undefined; return false; }
            return this.memory.needMason;
        }
        if (this.room) { roomHelper.getRoomWallLevel(this.room, true) }
        const hasRepSite = this.RepTarget(false, true);
        if (hasRepSite) {
            this.memory.needMason = true;
        } else {
            this.memory.needMason = false;
        }
        this.memory.needMasonTimer = Game.time + 500;
    }

    public hasEnergy(): boolean {
        if (!this.room) { return false; }
        if (this.room.dangerousHostiles.length > 0) { return false; }
        if (this.room.controller && this.room.controller.level > 5 && this.room.storage) {
            if (this.room.storage.store.energy > 5000) {
                return true;
            }
        } else {
            if (this.operation.stableOperation) { return true; }
        }
        return false;
    }

    public getNextDestination() {
        const destinations = this.logistics.getDestinations();
        this.destI = this.destI + 1;
        if (this.destI > destinations.length) { this.destI = 0; }
        this.memory.destI = this.destI;
        this.destination = this.memory.destination = undefined;
        this.memory.roadRepIds = undefined;
        this.memory.roadConstruct = undefined;
        return this.getDestination();
    }

    public getDestination() {
        if (this.destination) { return this.destination; }
        if (this.memory.destination) {
            this.destination = this.memory.destination;
        }
        const destinations = this.logistics.getDestinations();
        if (this.destI >= destinations.length) { this.memory.destI = this.destI = 0; }
        this.memory.destination = this.destination = destinations[this.destI];
        // console.log(JSON.stringify(destinations[0]) + ' ' + this.destI);
        return this.destination;
    }

    public getRoadRepList() {
        if (!this.memory.roadRepIds) {
            if (!this.buildDestRoads) {
                if (this.room) { this.memory.roadRepIds = roadHelper.repRoadsListIdsRoom(this.room) };
            } else {
                this.memory.roadRepIds = roadHelper.repRoadsListIds(this.operation.flag.pos, this.getDestination());
            }
        }

        return this.memory.roadRepIds;
    }

    public getNextRoadRep(): StructureRoad | null {
        if (!this.memory.roadRepIds) {
            this.memory.roadRepIds = this.getRoadRepList();
        }
        if (this.memory.roadRepIds.length === 0) { return null; }
        const roadId = _.first(this.memory.roadRepIds) as Id<StructureRoad>;
        const r = Game.getObjectById(roadId);
        if (r === null || r.hits >= r.hitsMax) {
            this.memory.roadRepIds = _.tail(this.memory.roadRepIds);
            return this.getNextRoadRep();
        }
        return r;
    }

    public getRoadConstruct(): ConstructionSite | undefined | null {
        if (this.roadConstruct) { return this.roadConstruct; }
        if (!this.buildDestRoads) { return null; }
        if (this.memory.roadConstruct) {
            const r = Game.getObjectById(this.memory.roadConstruct);
            if (r === null) {
                this.memory.roadConstruct = undefined;
            }
            this.roadConstruct = r as ConstructionSite;
            return this.roadConstruct;
        }
        if (this.memory.roadConstruct === null) {
            this.roadConstruct = null;
        }
        if (this.memory.roadConstruct === undefined) {
            const r = roadHelper.getNextUnbuiltRoad(this.operation.flag.pos, this.getDestination());
            // console.log('ret: ' + JSON.stringify(r));
            if (r === null) {
                this.memory.roadConstruct = null;
                this.roadConstruct = null;
                return null;
            }
            if (r instanceof RoomPosition) {
                if (Object.keys(Game.constructionSites).length < 50) {
                    r.createConstructionSite(STRUCTURE_ROAD);
                } else {
                    this.memory.roadConstruct = null;
                    this.roadConstruct = null;
                    return null;
                }
            }
            if (r instanceof ConstructionSite) {
                this.memory.roadConstruct = r.id;
                this.roadConstruct = r;
            }
        }
        return this.roadConstruct;
    }

    public maxBuilders = (): number => {
        if (!this.active) { return 0; }
        if (this.spawnRoom.rclLevel <= 2) { return 2; }
        if (this.remoteSpawning && this.spawnRoom.rclLevel <= 5) { return 2; }
        if (this.sites.length > 0 || this.needMason()) { return 1; }
        return 0;
    }

    public maxPavers = (): number => {
        if (!this.active) { return 0; }
        if (this.room && this.spawnRoom.rclLevel >= 4 && !this.room.memory.noRemote) {
            return 1;
        }
        if (this.room && this.roadsites.length !== 0) {
            return 1;
        }
        if (this.getRoadRepList().length > 0) {
            return 1;
        }
        return 0;
    }

    public builderBody = (): BodyPartConstant[] => {
        if (this.remoteSpawning) { return this.workerBodyOffRoad(); }
        return this.workerBodyRoad();
    }

    public towerRepairSite(tower: StructureTower, sites: Structure[]): boolean {
        for (const site of sites) {
            switch (site.structureType) {
                case STRUCTURE_CONTAINER:
                    // case STRUCTURE_ROAD:
                    if (site.hits < site.hitsMax / 2) {
                        tower.repair(site);
                        return true;
                    }
                    continue;
                case STRUCTURE_RAMPART:
                case STRUCTURE_WALL:
                    if (site.hits < 10000) {
                        tower.repair(site);
                        return true;
                    }
                    continue;
                case STRUCTURE_EXTENSION:
                case STRUCTURE_EXTRACTOR:
                case STRUCTURE_LAB:
                case STRUCTURE_LINK:
                case STRUCTURE_NUKER:
                case STRUCTURE_OBSERVER:
                case STRUCTURE_SPAWN:
                case STRUCTURE_STORAGE:
                case STRUCTURE_TERMINAL:
                case STRUCTURE_TOWER:
                    tower.repair(site);
                    return true;
                default:
                    continue;
            }
        }
        return false;
    }

    public runTowers() {
        if (!this.room) { return; }
        if (Game.time % 5 !== 4) { return; }
        const towers: StructureTower[] = this.room.find<StructureTower>(FIND_MY_STRUCTURES, { filter: x => x.structureType === STRUCTURE_TOWER });
        if (towers && towers.length > 0) {
            const sites = this.room.find(FIND_STRUCTURES, { filter: x => x.hits < x.hitsMax });
            const hostiles = this.room.find(FIND_HOSTILE_CREEPS);
            if (!(hostiles && hostiles.length > 0) && sites && sites.length > 0) {
                for (const t of towers) {
                    if (t.energy === t.energyCapacity) {
                        if (this.towerRepairSite(t, sites)) {

                            // return;
                        }
                    }
                }
            }
        }
    }

    public RepTarget(includeRoad: boolean = false, includeWall: boolean = false) {
        if (!this.room) { return undefined; }
        const structures = this.room.find(FIND_STRUCTURES, { filter: x => x.hits < x.hitsMax });
        if (structures && structures.length > 0) {
            const priority = _.filter(structures, x => PRIORITY_REPAIR.indexOf(x.structureType) > -1);
            if (priority.length > 0) {
                return priority[0];
            }
            if (includeRoad) {
                const roads = structures.filter(x => (x.structureType === STRUCTURE_ROAD || x.structureType === STRUCTURE_CONTAINER) && x.hits < x.hitsMax / 2);
                if (roads.length > 0) {
                    return _.min(roads, x => x.hits / x.hitsMax);
                }
            }
            if (includeWall) {
                const repWallLevel = roomHelper.getRoomWallLevel(this.room!);
                const walls = structures.filter(x => (x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART) && x.hits < repWallLevel);;
                if (walls.length > 0) {
                    return _.min(walls, x => x.hits);
                }
            }
        }
        return undefined;
    }

    public runPavers2() {
        for (const b of this.pavers) {
            if (b.memory.debug && !b.action) {
                console.log('debugging ' + b.name);
                console.log('target ' + b.target);
                console.log('this.memory.roadRepIds ' + JSON.stringify(this.memory.roadRepIds || 'none'));
                console.log('this.memory.roadConstruct ' + this.memory.roadConstruct);
                console.log('this.memory.destination ' + JSON.stringify(this.memory.destination));
                console.log('this.roadsites.length ' + JSON.stringify(this.roadsites.length));
            }
            if (!b.action) {
                if (b.working) {
                    b.actionTarget();
                    if (b.action) { continue; }
                    if (this.needEmergencyRefill()) {
                        b.action = creepActions.actionFillEnergy(b, b.action, this.spawnRoom.room);
                        if (b.action) { continue; }
                    }
                    const container = this.prioritySites.find(x => x.structureType === STRUCTURE_CONTAINER)
                    if (container) {
                        // Build existing roads first
                        b.setTarget(container, TargetAction.BUILD);
                        continue;
                    }
                    if (this.roadsites.length > 0) {
                        // Build existing roads first
                        b.setTarget(this.roadsites[0], TargetAction.BUILD);
                        continue;
                    }
                    const site = this.getRoadConstruct();
                    if (b.memory.debug) {
                        console.log('site ' + site + ' ');
                        console.log('this.roadConstruct ' + this.roadConstruct);
                    }
                    if (!site) {
                        // no more sites this path
                        const repSite = this.getNextRoadRep();
                        if (b.memory.debug) { console.log('repsite ' + repSite); }
                        if (repSite) {
                            b.setTarget(repSite, TargetAction.REPAIR);
                            continue;
                        }
                        if (repSite === null) {
                            this.getNextDestination();
                            creepActions.yieldRoad2(b);
                            b.wait(2);
                        }
                    } else {
                        b.setTarget(site, TargetAction.BUILD);
                    }
                    if (!b.action && this.remoteSpawning && this.room && this.room.controller && this.room.controller.my) {
                        b.action = creepActions.actionUpgrade(b, b.action);
                    }
                } else {
                    b.action = this.operation.creepGetEnergy(b, b.action, true, true);
                }
            }
            if (!b.action) {
                b.rally();
            }
        }
    }

    public runBuilders() {
        for (const b of this.builders) {
            if (b.working) {
                b.actionTarget();
                b.action = this.actionPriorityWall(b, b.action);
                if (this.needEmergencyRefill()) {
                    b.action = creepActions.actionFillEnergy(b, b.action, this.spawnRoom.room);
                }
                if (!b.action && b.room.controller && b.room.controller.ticksToDowngrade < 2000) {
                    b.action = creepActions.actionUpgrade(b, b.action);
                }
                if (!b.action && this.prioritySites.length > 0) {
                    b.setTarget(this.prioritySites[0], TargetAction.BUILD);
                }
                if (!b.action && this.sites.length > 0) {
                    b.setTarget(this.sites[0], TargetAction.BUILD);
                }
                if (!b.action) {
                    const rep = this.RepTarget(false, true);
                    if (rep) {
                        b.setTarget(rep, TargetAction.REPAIR);
                    }
                }
                if (!b.action && this.room && this.room.controller && this.room.controller.my) {
                    b.action = creepActions.actionUpgrade(b, b.action);
                }
                // action = creepActions.actionUpgrade(b, action);
                // action = creepActions.actionRally(b, action);
            } else {

                b.action = this.operation.creepGetEnergy(b, b.action, true, true);
                // b.say("" + action);
            }
            if (!b.action) { b.rally() };
        }
    }

    public actionPriorityWall(creep: Creep, action: boolean) {
        if (action === false) {
            const walls = creep.room.find(FIND_STRUCTURES, { filter: x => (x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART) && x.hits < 100 });
            if (walls && walls.length > 0) {
                // creep.memory.target = walls[0].id;
                // creepActions.moveToRepair(creep, walls[0]);
                creep.setTarget(walls[0], TargetAction.REPAIR);
                return true;
            }
        }
        return action;
    }


}
