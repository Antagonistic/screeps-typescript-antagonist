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
    // STRUCTURE_ROAD,
    STRUCTURE_CONTAINER,
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

    public active: boolean;

    constructor(operation: Operation, logistics: LogisticsManager) {
        super(operation, "builder")
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
        ;
    }

    public hasEnergy(): boolean {
        if (!this.room) { return false; }
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

    public getRoadSite() {
        if (this.roadSite) { return this.roadSite; }
        if (this.memory.roadsite) {
            let site = Game.getObjectById<ConstructionSite | StructureRoad | StructureContainer>(this.memory.roadSite);
            if (site != null) {
                if (site.structureType === STRUCTURE_ROAD) {
                    const r = site as StructureRoad;
                    if (r.hits >= r.hitsMax) { site = null; }
                }
                if (site != null) {
                    this.roadSite = site;
                    roomHelper.markPosition(site.pos);
                    this.memory.roadsite = site.id;
                    return site;
                }
            } else {
                this.memory.roadsite = undefined;
            }
        }
        return this.getNextRoadSite();
    }

    public getNextRoadSite() {
        let road = roadHelper.pavePath(this.operation.flag.pos, this.getDestination(), 1);
        let count = 0;
        while (count < 5) {
            this.roadI = this.roadI + 1;
            this.memory.roadI = this.roadI;
            count = count + 1;
            if (this.roadI >= road.length) {
                if (road.length > 6) { console.log(this.operation.name + ' road ' + this.destI + ' paved of length ' + road.length) };
                this.roadI = 0;
                road = roadHelper.pavePath(this.operation.flag.pos, this.getNextDestination(), 1);
            }
            const p = road[this.roadI];
            roomHelper.markPosition(p);
            this.memory.lastSiteLocation = p;
            if (Game.rooms[p.roomName]) {  // Check visibility
                const structures = p.lookFor("structure");
                if (structures && structures.length > 0) {
                    const s = _.find(structures, x => (x.structureType === STRUCTURE_ROAD || x.structureType === STRUCTURE_CONTAINER) && x.hits < x.hitsMax);
                    if (s != null) {
                        this.roadSite = s as StructureRoad | StructureContainer;
                        break;
                    } else { continue; } // repaired road, keep looking
                }
                const construct = p.lookFor("constructionSite");
                if (construct && construct.length > 0) {
                    const c = _.find(construct, x => x.structureType === STRUCTURE_ROAD);
                    if (c) {
                        this.roadSite = c;
                        break;
                    }
                    // Construction but not road?
                    continue;
                }
                // No road nor site, make one!
                if (Object.keys(Game.constructionSites).length > 50) {
                    // Too many sites, do something else
                    console.log('Cant build more construction sites!');
                    // this.memory.roadI = this.roadI = 0;
                    // this.getNextDestination();
                    continue;
                }
                const ret = p.createConstructionSite(STRUCTURE_ROAD);
                if (ret === OK) {
                    this.memory.roadI = this.roadI = this.roadI - 1;
                    return null;
                } else if (ret === -8) { // Cant place construction sites, next route
                    console.log('Cant build more construction sites!');
                    this.memory.roadI = this.roadI = 0;
                    this.getNextDestination();
                    return undefined;
                } else {
                    return undefined;
                }
            }

        }
        this.memory.roadI = this.roadI;
        if (this.roadSite) { this.memory.roadsite = this.roadSite.id; }
        return this.roadSite;
    }

    public getRoadRepList() {
        if (!this.memory.roadRepIds) {
            this.memory.roadRepIds = roadHelper.repRoadsListIds(this.operation.flag.pos, this.getDestination());
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
        if (this.sites.length === 0) {
            return 0;
        }
        if (this.spawnRoom.rclLevel <= 2) { return 2; }
        return 1;
    }

    public maxPavers = (): number => {
        if (!this.active) { return 0; }
        if (this.room && this.spawnRoom.rclLevel >= 4) {
            return 1;
        }
        if (this.room && this.roadsites.length !== 0) {
            return 1;
        }
        return 0;
    }

    public builderBody = (): BodyPartConstant[] => {
        /*const energyAvailable = this.spawnRoom.energyCapacityAvailable;
        if (energyAvailable >= 650) {
            // return [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY, CARRY];
            return this.workerBody(4, 2, 4);
        } else if (energyAvailable >= 400) {
            // return [MOVE, MOVE, WORK, WORK, CARRY, CARRY];
            return this.workerBody(2, 2, 2);
        } else {
            // return [MOVE, WORK, WORK, CARRY];
            return this.workerBody(2, 1, 1);
        }*/
        if (this.remoteSpawning) { return this.workerBodyOffRoad(); }
        return this.workerBodyRoad();
    }

    public towerRepairSite(tower: StructureTower, sites: Structure[]): boolean {
        for (const site of sites) {
            switch (site.structureType) {
                case STRUCTURE_CONTAINER:
                case STRUCTURE_ROAD:
                    if (site.hits < site.hitsMax / 2) {
                        tower.repair(site);
                        return true;
                    }
                    continue;
                case STRUCTURE_RAMPART:
                case STRUCTURE_WALL:
                    if (site.hits < 100000) {
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
                            creepActions.yieldRoad(b, b);
                            b.wait(10);
                        }
                    } else {
                        b.setTarget(site, TargetAction.BUILD);
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

    public runPavers() {
        for (const b of this.pavers) {
            let action: boolean = false;
            action = creepActions.actionRecycle(b, action);
            if (creepActions.canWork(b)) {
                action = creepActions.actionBuildRepairCache(b, action);
                // action = creepActions.actionMoveToRoom(b, action, this.operation.roomName);
                if (b.room.controller && b.room.controller.ticksToDowngrade < 2000) {
                    action = creepActions.actionUpgrade(b, action);
                }
                /*if (this.roadsites.length > 0) {
                    const site = b.pos.findClosestByRange(this.roadsites);
                    action = creepActions.actionBuild(b, action, site);
                }*/
                if (!action && this.roadsites.length > 0) {
                    const site = b.pos.findClosestByRange(this.roadsites);
                    action = creepActions.actionBuild(b, action, site);
                }
                if (!action) {
                    const site = this.getRoadSite();
                    if (site === null) { action = true } else { // null means placed constructiomn
                        if (site) {
                            b.say('👣');
                            b.memory.target = site.id;
                            action = creepActions.actionBuildRepairCache(b, action);
                        }
                    }
                }
                if (!action && this.prioritySites.length > 0) {
                    const site = b.pos.findClosestByRange(this.prioritySites);
                    action = creepActions.actionBuild(b, action, site);
                }
                // action = creepActions.actionRepairStill(b, action);
                // action = creepActions.actionRepairCache(b, action);
                // action = creepActions.actionRepairRoad(b, action, 2);
                // action = creepActions.actionRepair(b, action);
                // action = creepActions.actionUpgrade(b, action);
            } else {
                /*if (this.remoteSpawning) {
                    action = creepActions.actionGetEnergyCache(b, action);
                    action = creepActions.actionGetDroppedEnergy(b, action, true);
                    action = creepActions.actionGetContainerEnergy(b, action, 2, true);
                    if (!action) {

                        // No containers, so gonna go mine, hopefully have a miner refill
                        const sources = this.room!.find(FIND_SOURCES);
                        const source = sources[b.memory.uuid % sources.length];
                        const ret: number = b.harvest(source);
                        b.say("Mine! " + source);
                        if (ret === ERR_NOT_IN_RANGE) {
                            b.moveTo(source.pos);
                            b.memory.energyTarget = source.id;
                            // creepActions.moveTo(b, source.pos, true);
                        }
                        action = true;
                    }
                } else {
                    action = creepActions.actionGetEnergyCache(b, action);
                    action = creepActions.actionMoveToRoom(b, action, this.spawnRoom.room.name);
                    action = creepActions.actionGetStorageEnergy(b, action);
                    action = creepActions.actionGetBatteryEnergy(b, action);
                }*/
                // action = creepActions.actionMoveToRoom(b, action, this.operation.roomName);
                action = this.operation.creepGetEnergy(b, action, true, true);
                // b.say("" + action);
            }
            if (!action) { creepActions.moveTo(b, this.operation.rallyPos); b.say('🍺'); };
        }
    }



    public runBuilders() {
        for (const b of this.builders) {
            // let action: boolean = false;
            // b.action = creepActions.actionRecycle(b, action);
            if (b.working) {
                b.actionTarget();
                b.action = this.actionPriorityWall(b, b.action);
                // action = creepActions.actionMoveToRoom(b, action, this.operation.roomName);
                if (b.room.controller && b.room.controller.ticksToDowngrade < 2000) {
                    b.action = creepActions.actionUpgrade(b, b.action);
                }
                if (!b.action && this.prioritySites.length > 0) {
                    // b.action = creepActions.actionBuild(b, action, this.prioritySites[0]);
                    b.setTarget(this.prioritySites[0], TargetAction.BUILD);
                }
                if (!b.action && this.sites.length > 0) {
                    // action = creepActions.actionBuild(b, action, this.sites[0]);
                    b.setTarget(this.sites[0], TargetAction.BUILD);
                }
                b.action = creepActions.actionRepair(b, b.action, false);
                b.action = creepActions.actionRepair(b, b.action, true);
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
