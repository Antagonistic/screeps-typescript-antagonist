import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import 'config/config'

import { TargetAction, EnergyState } from "config/Constants";
import * as creepActions from "creeps/creepActions";
import { task } from "creeps/tasks";
import { LogisticsManager } from "operation/LogisticsManager";
import { profile } from "Profiler";
import { buildHelper } from "rooms/buildHelper";
import { defenceHelper } from "rooms/defenceHelper";
import { roadHelper } from "rooms/roadHelper";
import { roomHelper } from "rooms/roomHelper";

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
    STRUCTURE_STORAGE,
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
    // public destI: number;
    public roadSite?: ConstructionSite | StructureRoad | StructureContainer;
    // public roadI: number;

    // public roadI: number;
    public memory!: {
        nextBuildRoad: number;
        nextBuildSite: number;
        needMasonTimer?: number;
        needMason?: boolean;
        roadRepIds?: Array<Id<StructureRoad | StructureContainer>>;
        roadConstruct?: Id<ConstructionSite> | null;
    };

    // public roadRepIds: Id<StructureRoad | StructureContainer>;
    // public roadRepTime: number;
    public roadConstruct?: ConstructionSite | null;

    public buildSecondaryRoads: boolean;

    public active: boolean;

    constructor(operation: Operation, logistics: LogisticsManager, buildSecondaryRoads: boolean = true) {
        super(operation, "builder")
        this.buildSecondaryRoads = buildSecondaryRoads;
        this.logistics = logistics;
        this.active = this.hasEnergy();
    }

    public initMission(): void {
        if (this.room) {
            // this.roadRepTime = this.memory.roadRepTime;
            this.sites = this.room.find(FIND_CONSTRUCTION_SITES,
                { filter: (x: ConstructionSite) => x.structureType !== STRUCTURE_ROAD });
            this.roadsites = this.room.find(FIND_CONSTRUCTION_SITES,
                { filter: (x: ConstructionSite) => x.structureType === STRUCTURE_ROAD });
            this.prioritySites = _.filter(this.sites, s => PRIORITY_BUILD.indexOf(s.structureType) > -1);

            this.active = this.active || this.prioritySites.length > 0;
            // console.log(this.sites.length);
        }
    }
    public spawn(): void {
        this.builders = this.spawnRole(this.name, this.maxBuilders, this.builderBody, { role: "builder" });
        this.pavers = this.spawnRole(this.name + "paver", this.maxPavers, this.builderBody, { role: "builder" });
    }
    public work(): void {
        this.runBuilders();
        this.runPavers2();
        this.runTowers();
    }
    public finalize(): void {
        // Create new sites
        if (!this.remoteSpawning && this.room && this.operation.stableOperation) {
            const wait = Game.cpu.bucket <= 99000 ? 100 : 10;
            if (this.buildSecondaryRoads) { this.logistics.getDestinations() }
            if (this.roadsites.length <= 1) {
                if (!this.memory.nextBuildRoad || this.memory.nextBuildRoad <= Game.time) {
                    if (buildHelper.runIterativeBuildRoad(this.room, this.spawnRoom, this.buildSecondaryRoads)) {
                        this.memory.nextBuildRoad = Game.time + wait;
                    } else {
                        this.memory.nextBuildRoad = Game.time + wait * 5;
                    }
                }
            }
            if (this.sites.length <= 1) {
                if (!this.memory.nextBuildSite || this.memory.nextBuildSite <= Game.time) {
                    if (buildHelper.runIterativeBuild(this.room, this.spawnRoom, this.logistics.isLowEnergy())) {
                        this.memory.nextBuildSite = Game.time + wait;
                    } else {
                        this.memory.nextBuildSite = Game.time + wait * 5;
                    }
                }
            }
        }
    }

    public needMason() {
        if (this.spawnRoom.room.energyState === EnergyState.CRITICAL) { return false; }
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
        return this.memory.needMason || false;
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

    public maxBuilders = (): number => {
        if (!this.active) { return 0; }
        if (this.spawnRoom.rclLevel <= 2) { return 2; }
        if (this.remoteSpawning && this.spawnRoom.rclLevel <= 5) { return 2; }
        if (this.sites.length > 0 || this.needMason()) { return 1; }
        return 0;
    }

    public maxPavers = (): number => {
        if (!this.active) { return 0; }
        if (this.room?.energyState === EnergyState.CRITICAL) { return 0; }
        /*if (this.room && this.spawnRoom.rclLevel >= 4 && !this.room.memory.noRemote) {
            return 1;
        }*/
        if (this.room && this.roadsites.length !== 0) {
            return 1;
        }
        if (this.room && buildHelper.getRoadCon(this.room)) {
            return 1;
        }
        if (this.room && (this.spawnRoom.room.memory.roadRep?.length || 0) > 5) {
            return 1;
        }
        return 0;
    }

    public builderBody = (): BodyPartConstant[] => {
        let energy = 1600;
        if (this.room?.energyState === EnergyState.CRITICAL) { energy = 400; }
        if (this.room?.energyState === EnergyState.LOW) { energy = 800; }
        if (this.remoteSpawning) { return this.workerBodyOffRoad(energy); }
        return this.workerBodyRoad(energy);
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
        if (this.spawnRoom.room.energyState === EnergyState.CRITICAL) { return; }
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
        let structures = this.room.find(FIND_STRUCTURES, { filter: x => x.hits < x.hitsMax });
        const dismantle = this.spawnRoom.room.memory.dismantle;
        if (dismantle && dismantle.length > 0) {
            structures = structures.filter(x => !_.any(dismantle, o => x.id === o));
        }
        if (structures && structures.length > 0) {
            const priority = _.filter(structures, x => PRIORITY_REPAIR.indexOf(x.structureType) > -1);
            if (priority.length > 0) {
                return priority[0];
            }
            if (includeRoad) {
                const roads = structures.filter(x => (x.structureType === STRUCTURE_ROAD || x.structureType === STRUCTURE_CONTAINER) && x.hits < (x.hitsMax / 4 * 3));
                // console.log('BUILD: RepTargets road: ' + JSON.stringify(roads));
                if (roads.length > 0) {
                    return _.min(roads, x => x.hits / x.hitsMax);
                }
            }
            if (includeWall) {
                const repWallLevel = roomHelper.getRoomWallLevel(this.room);
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
            if (!b.action) {
                if (b.working) {
                    if (b.memory.debug) { console.log('DEBUG: working'); }
                    b.actionTarget();
                    if (b.action) { continue; }
                    if (this.needEmergencyRefill()) {
                        task.refill(b);
                    }
                    const container = this.prioritySites.find(x => x.structureType === STRUCTURE_CONTAINER || x.structureType === STRUCTURE_STORAGE)
                    if (container) {
                        b.setTarget(container, TargetAction.BUILD);
                        continue;
                    }
                    if (this.roadsites.length > 0) {
                        b.setTarget(this.roadsites[0], TargetAction.BUILD);
                        continue;
                    }
                    task.roadConstruct(b, this.room);
                    task.roadRepair(b, this.room);
                    const rep = this.RepTarget(true, false);
                    if (b.memory.debug) { console.log('DEBUG: ' + rep); }
                    if (rep) {
                        b.setTarget(rep, TargetAction.REPAIR);
                    }
                    task.scavange(b);
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

                task.priorityWall(b);
                if (this.needEmergencyRefill()) {
                    task.refill(b);
                }
                task.praiseEmergency(b);

                if (this.prioritySites.length > 0) {
                    b.setTarget(this.prioritySites[0], TargetAction.BUILD);
                }
                if (this.sites.length > 0) {
                    b.setTarget(this.sites[0], TargetAction.BUILD);
                }
                if (!b.action) {
                    const rep = this.RepTarget(false, true);
                    if (rep) {
                        b.setTarget(rep, TargetAction.REPAIR);
                    }
                }
                task.scavange(b);
                if (this.energyState() !== EnergyState.CRITICAL) {
                    task.praise(b);
                }
            } else {

                b.action = this.operation.creepGetEnergy(b, b.action, true, true);
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
