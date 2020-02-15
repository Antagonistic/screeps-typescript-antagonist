import { Operation } from "../operations/Operation";
import { Mission } from "./mission";

import * as creepActions from "creeps/creepActions";

import { BodyFactory } from "creeps/BodyFactory";
import { LogisticsManager } from "operation/LogisticsManager";
import { posix } from "path";
import { profile } from "Profiler";
import { roadHelper } from "rooms/roadHelper"
import { roomHelper } from "rooms/roomHelper"
import { Traveler } from "utils/Traveler"


@profile
export class MiningMission extends Mission {

    public memory!: {
        stableMission: boolean;
        dist?: number;
        positionCount?: number;
        storageId?: Id<Structure>;
        container?: Id<StructureContainer>;
        link?: Id<StructureLink>;
        minerStorage?: Id<StructureStorage>;
        extentions?: Array<Id<StructureExtension | StructureTower | StructureSpawn>>;
        cartAnalyze?: cartAnalyze;
        isPathPaved?: boolean;
        roadRepIds?: Array<Id<StructureRoad | StructureContainer>>;
        roadConstruct?: Id<ConstructionSite> | null;
    };

    public source: Source;
    public miners: Creep[] = [];
    public carts: Creep[] = [];
    public droppedRes?: Resource[];
    public pickupOrder: number = 0;
    public active: boolean;
    public stableMission: boolean;
    public logistics: LogisticsManager;

    public _minersNeeded?: number;

    public container?: StructureContainer;
    public minerStorage?: StructureStorage;
    public link?: StructureLink;
    public drop?: StructureContainer | StructureStorage | StructureLink;

    public dropOff: StructureStorage | StructureSpawn | StructureLink;

    public isLink: boolean;
    public noHaul: boolean;

    // public pavedPath: boolean;
    public cartAnalyze?: cartAnalyze;

    public extentions?: Array<StructureExtension | StructureTower | StructureSpawn>;

    constructor(operation: Operation, name: string, source: Source, logistics: LogisticsManager, active: boolean = true) {
        super(operation, name);
        this.source = source;
        this.active = this.getActive(active);
        if (!this.memory.stableMission) { this.memory.stableMission = false; }
        this.stableMission = this.memory.stableMission;
        this.operation.stableOperation = this.operation.stableOperation && this.stableMission;
        this.isLink = false;
        this.dropOff = this.findStorage();
        this.logistics = logistics;
        this.drop = this.findDrops();
        this.noHaul = !!this.link || !!this.minerStorage || !this.container;
        // this.pavedPath = this.memory.isPathPaved === undefined ? this.isPathPaved() : this.memory.isPathPaved;
        if (this.spawnRoom.room.storage && this.spawnRoom.room.storage.store.energy >= 900000) { this.active = false; }
    }

    public getActive(active: boolean) {
        if (!active) { return false; }
        if (!this.room) { return false; }
        if (this.remoteSpawning) {
            if (this.room.reserved === "Invader") { return false; }
            if (this.room.owner && this.room.controller && !this.room.controller.my) { return false; }
            if (this.room.dangerousHostiles.length > 0) { return false; }
            if (this.spawnRoom.rclLevel < 4) { return false; }
        } else {
            if (this.operation.stableOperation && this.room.dangerousHostiles.length > 0) { return false; }
        }
        return true;
    }

    public initMission(): void {
        if (!this.hasVision) { return; }
        // this.container = this.findContainer();
        // console.log(JSON.stringify(this.memory));
        // console.log(JSON.stringify(this.memory));
        // console.log(this.memory.fillcart)
    }

    public spawn(): void {
        if (this.remoteSpawning && Game.cpu.bucket < 100) { return; } // Oh geez, CPU emergency, disable remote mining
        this.miners = this.spawnRole(this.name, this.getMaxMiners, this.getOversizedMinerBody, { role: "miner" }, this.memory.dist || 10);
        if (_.any(this.miners, x => x.memory.inPosition)) { this.logistics.registerSource(this.remoteSpawning); }
        // const cartBodyFunc = this.remoteSpawning ? this.getLongCartBody : this.getCartBody;
        const cartBodyFunc = () => {
            const P = this.getCartAnalyze().carry;
            if (!this.isPathPaved()) {
                return BodyFactory.workerBody(0, P * 2, P * 2);
            }
            return BodyFactory.workerBody(0, P * 2, P);
        }
        // const hasworkpart = _.contains(cartBodyFunc(), WORK);
        this.carts = this.spawnRole(this.name + "cart", this.getMaxCarts, cartBodyFunc, { role: "hauler" }, 0);

        if (Game.time % 50 === 0) {
            // Check to update whether mining op is at capacity
            if (this.miners.length >= this.getMaxMiners() && this.carts.length >= this.getMaxCarts()) {
                this.memory.stableMission = true;
            } else {
                this.memory.stableMission = false;
            }
        }
    }
    public work(): void {
        if (this.remoteSpawning && Game.cpu.bucket < 100) { return; } // Oh geez, CPU emergency, disable remote mining
        this.runMiners(this.miners);
        this.runHaulers2(this.carts);
    }
    public finalize(): void {
        if (Game.time % 1000 === 567) {
            this.memory.positionCount = undefined;
            this._minersNeeded = undefined;
            this.memory.storageId = undefined;
            this.memory.container = undefined;
            this.memory.dist = undefined;

            this.refreshMissionMemory();
        }
        if (Game.time % 1000 === 633) {
            this.memory.isPathPaved = undefined;
            this.memory.cartAnalyze = undefined;
        }
        if (Game.time % 1000 === 786) {
            this.memory.extentions = undefined;
        }
    }

    public refreshMissionMemory() {
        this.container = this.source.pos.findStructureInRange(STRUCTURE_CONTAINER, 1) as StructureContainer | undefined;
        this.memory.container = this.container?.id || undefined;
        this.link = this.source.pos.findStructureInRange(STRUCTURE_CONTAINER, 2) as StructureLink | undefined;
        this.memory.link = this.link?.id || undefined;
        this.minerStorage = this.source.pos.findStructureInRange(STRUCTURE_STORAGE, 2) as StructureStorage | undefined;
        this.memory.minerStorage = this.minerStorage?.id || undefined;

        if (!this.container && this.remoteSpawning && Game.cpu.bucket > 1000) {
            this.placeContainer();
        }
    }

    public getMaxMiners = () => {
        if (!this.active) { return 0; }
        if (this.drop && this.drop.store.getFreeCapacity(RESOURCE_ENERGY) === 0) { return 0; }
        if (this.remoteSpawning) { return 1; }
        return this.minersNeeded();
    };

    public getExtention(creep: Creep): StructureExtension | StructureTower | null {
        if (this.remoteSpawning) { return null; }
        if (!this.memory.extentions) {
            const extentions = this.source.pos.findInRange<StructureExtension | StructureTower>(FIND_MY_STRUCTURES, 2, { filter: x => x.structureType === STRUCTURE_EXTENSION || x.structureType === STRUCTURE_TOWER || x.structureType === STRUCTURE_SPAWN });
            if (extentions && extentions.length > 0) {
                this.memory.extentions = _.map(extentions, x => x.id);
            }
            else {
                this.memory.extentions = [];
            }
        }
        for (const e of this.memory.extentions) {
            const ext: StructureExtension | StructureTower | null = Game.getObjectById<StructureExtension | StructureTower>(e);
            if (ext && ext.pos.isNearTo(creep) && ext.energy < ext.energyCapacity) { return ext; }
        }
        return null;
    }

    public getMinerBody = () => {
        if (this.remoteSpawning) { return BodyFactory.workerBody(6, 2, 3); }
        const minersSupported = this.minersSupported();
        if (minersSupported === 1) {
            const work = Math.ceil((Math.max(this.source.energyCapacity,
                SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME) / HARVEST_POWER) + 1;
            return BodyFactory.workerBody(work, 2, Math.ceil(work / 2));
        } else if (minersSupported === 2) {
            return BodyFactory.workerBody(3, 1, 2);
        } else { return BodyFactory.workerBody(2, 1, 1); }
    };

    public getOversizedMinerBody = () => {
        if (!this.logistics.bootStrap && this.spawnRoom.energyCapacityAvailable >= 2000) {
            if (this.spawnRoom.availableSpawnEnergy >= BodyFactory.calculateBodyCost(BodyFactory.workerBody(12, 3, 12))) {
                return BodyFactory.workerBody(12, 3, 12);
            }
        }
        return this.getMinerBody();
    }

    public getMaxCarts = () => {
        if (!this.active) { return 0; }
        if (this.noHaul) { return 0; }
        if (this.remoteSpawning && !this.container) { return 0; }
        // if (this.dropOff.pos.inRangeTo(this.source, 5)) { return 1; }

        return this.getCartAnalyze().count;
    }

    public minersNeeded(): number {
        if (!this._minersNeeded) {
            if (!this.memory.positionCount) {
                const spots = this.source.pos.openAdjacentSpots(true);
                if (!this.container) {
                    this.memory.positionCount = spots.length;
                } else {
                    let i: number = 0;
                    for (const s of spots) {
                        if (this.container.pos.isNearTo(s)) {
                            i++;
                        }
                    }
                    this.memory.positionCount = i;
                }
            }

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

    public haulPath = (): RoomPosition[] => {
        let goal;
        if (this.dropOff) {
            goal = { pos: this.dropOff.pos, range: 2 }
        } else {
            goal = { pos: this.dropOff, range: 2 }
        }
        const path = PathFinder.search(this.source.pos, goal).path;
        return path;
    }

    public placeContainer(): void {
        const boxSite: ConstructionSite[] = this.source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1,
            { filter: (x: ConstructionSite) => x.structureType === STRUCTURE_CONTAINER });
        if (!boxSite || boxSite.length === 0) {
            const pos = roomHelper.getContainerPosition(this.source.pos);
            if (pos) {
                const ret = pos.createConstructionSite(STRUCTURE_CONTAINER);
                if (ret !== OK) {
                    console.log("Placing mining box error: " + ret + " in " + this.operation.roomName + " pos : " + pos.x + "," + pos.y);
                }
            }
            return;
        }
    }

    public findStorage(): StructureStorage | StructureSpawn | StructureLink {
        if (this.memory.storageId) {
            const ret = Game.getObjectById<StructureStorage | StructureSpawn | StructureLink>(this.memory.storageId);
            if (ret) { return ret; }
        }
        const room = this.spawnRoom.room;
        const _destinations = room.find<StructureLink | StructureStorage>(FIND_MY_STRUCTURES, { filter: x => x.structureType === STRUCTURE_STORAGE || x.structureType === STRUCTURE_LINK })

        // console.log('Possible destinations: ' + destinations);
        if (_destinations != null) {
            const destinations: Array<StructureLink | StructureStorage> = [];
            for (const _d of _destinations) {
                // Dont feed controller or storage links
                if (room.storage && _d.structureType === STRUCTURE_LINK) {
                    if (_d.pos.inRangeTo(room.storage.pos, 3)) {
                        continue;
                    }
                }
                if (room.controller && _d.structureType === STRUCTURE_LINK) {
                    if (_d.pos.inRangeTo(room.controller.pos, 3)) {
                        continue;
                    }
                }

                destinations.push(_d);
            }
            if (destinations.length > 0) {
                // const destPos = this.source.pos.findClosestByPath(_.map(destinations, x => x.pos));
                const dest = roomHelper.findShortestPath(this.source.pos, destinations);
                if (dest) {
                    // console.log('new storage for ' + this.name + ': ' + dest);
                    this.memory.storageId = dest.id;
                    const ret = Game.getObjectById<StructureStorage | StructureSpawn | StructureLink>(this.memory.storageId);
                    if (ret) { return ret; }
                }
            }
        }

        if (this.spawnRoom.room.storage) {
            this.memory.storageId = this.spawnRoom.room.storage.id;
            return this.spawnRoom.room.storage;
        }
        this.memory.storageId = this.spawnRoom.spawns[0].id;
        return this.spawnRoom.spawns[0];
    }

    public runMiners(creeps: Creep[]): void {
        const sourceEnergy = this.source.energy > 0;
        for (const creep of creeps) {
            if (creep.memory.debug) {
                console.log('debugging ' + creep.name);
                console.log('sourceEnergy ' + sourceEnergy);
                console.log('creep.memory.inPosition ' + creep.memory.inPosition);
            }
            let action: boolean = false;

            if (!creep.memory.inPosition) {
                action = this.runMiners_move(creep);
            } else {
                if (sourceEnergy) {
                    action = this.runMiners_mine(creep);
                }
            }

            if (creep.memory.debug) { console.log('action ' + action); }
        }
    }

    public runMiners_move(creep: Creep) {
        let action: boolean = false;
        action = creepActions.actionMoveToRoom(creep, action, this.operation.roomName);
        if (!action) {
            if (this.minersNeeded() === 1 && this.container) {
                if (creep.pos.x === this.container.pos.x && creep.pos.y === this.container.pos.y) {
                    creep.memory.inPosition = true;
                } else {
                    creepActions.moveTo(creep, this.container.pos, true);
                }
            } else {
                if (creep.pos.isNearTo(this.source.pos)) {
                    if (this.container != null) {
                        if (creep.pos.isNearTo(this.container.pos)) {
                            creep.memory.inPosition = true;
                        }
                        else {
                            // creepActions.moveTo(creep, this.container.pos, true);
                            for (const p of this.source.pos.openAdjacentSpots()) {
                                if (p.isNearTo(this.container.pos)) {
                                    const _creeps = p.lookFor("creep");
                                    if (!_creeps || _creeps.length === 0) {
                                        creepActions.moveTo(creep, p, true);
                                        break;
                                    }
                                }
                            }
                        }
                    }
                    else {
                        creep.memory.inPosition = true;
                    }
                } else {
                    creepActions.moveTo(creep, this.source.pos, false);
                }
            }
        }
        return action;
    }

    public runMiners_mine(creep: Creep) {
        let action: boolean = false;
        if (!creep.memory.oversize) {
            const numWork = creep.getActiveBodyparts(WORK);
            creep.memory.oversize = Math.max(Math.floor(numWork / 6), 1);
        }
        const oversize = creep.memory.oversize || 1;
        if (Game.time % oversize === 0) {
            if (this.drop && this.drop.store.getFreeCapacity(RESOURCE_ENERGY) < 10) {
                creep.say('⏰');
                return true;
            }
            const ret: number = creep.harvest(this.source);
            if (ret === ERR_NOT_IN_RANGE) {
                creep.memory.inPosition = false;
                creep.say('👟 ' + ret);
                creepActions.moveTo(creep, this.source.pos, false);
            } else if (ret === OK) { creep.say('⛏️'); }

            if (creep.carry.energy > 40) {
                if (this.isLink) {
                    const ext = this.getExtention(creep);
                    if (ext) {
                        creep.transfer(ext, RESOURCE_ENERGY);
                        creep.say("ext");
                    } else {
                        if (this.drop && this.drop.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                            if (creep.transfer(this.drop, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                                creep.memory.inPosition = undefined;
                            }
                        }
                    }
                } else {
                    if ((Game.time % (4 * oversize) === 1 && Game.cpu.bucket > 800) || !this.drop) {
                        const ext = this.getExtention(creep);
                        if (ext) {
                            creep.transfer(ext, RESOURCE_ENERGY);
                            creep.say("ext");
                        } else {
                            const haulers = creep.pos.findInRange(FIND_MY_CREEPS, 1, { filter: (c: Creep) => c.memory.role && c.memory.role !== "miner" && c.store.getFreeCapacity() > 0 });
                            if (haulers.length > 0) {
                                action = creepActions.actionTransferStill(creep, action, haulers[0]);
                                creep.say("✋");
                            } else {
                                action = creepActions.actionBuildStill(creep, action);
                                if (action) { creep.say("🛠️"); }
                                else {
                                    action = creepActions.actionRepairStill(creep, action);
                                    if (action) { creep.say("🔧"); }
                                }
                                if (this.drop) {
                                    action = creepActions.actionTransferStill(creep, action, this.drop);
                                    if (action) { creep.say("💰"); }
                                }
                            }
                        }
                    }
                }
            }
        }
        return action;
    }

    public hasEnergy(): number {
        if (!this.drop) { return 0; }
        if (this.minerStorage) { return this.minerStorage.store.energy; }
        if (this.link && this.link.store.energy > 50) { return this.link.store.energy; }
        if (this.container) {
            if (this.container.store.energy > 50) { return this.container.store.energy; }
        }
        return 0;
    }

    public runHaulers2(creeps: Creep[]): void {
        this.droppedRes = this.source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
            filter: (x: Resource) => x.resourceType === RESOURCE_ENERGY
                && x.amount >= 50
        })
        const hasEnergy = this.hasEnergy();
        for (const creep of this.carts) {
            let action: boolean = false;
            action = creepActions.actionRecycle(creep, action);

            if (!action && creepActions.canWork(creep)) {
                action = this.runHaulers_canWork(creep, action);
            } else {
                action = this.runHaulers_wantWork(creep, action);
            }
        }
    }

    public runHaulers_canWork(creep: Creep, action: boolean): boolean {
        action = creepActions.actionMoveToRoom(creep, action, this.spawnRoom.room);
        // action = this.runHaulers_walkWork(creep);
        action = creepActions.actionFillCache(creep, action);
        if (!action) {
            if (!this.spawnRoom.room.storage || this.spawnRoom.rclLevel <= 4) {
                action = this.runHaulers_earlyFill(creep, action);
            } else {
                if (this.needEmergencyRefill()) {
                    action = creepActions.actionFillEnergy(creep, action);
                }
                if (this.dropOff.structureType === STRUCTURE_LINK) {
                    if (!this.remoteSpawning && this.dropOff.store.getFreeCapacity(RESOURCE_ENERGY) < 50) {
                        action = creepActions.actionFillEnergyStorage(creep, action);
                    } else {
                        action = creepActions.actionTransfer(creep, action, this.dropOff);
                    }
                } else {
                    action = creepActions.actionFillEnergyStorage(creep, action);
                }
                action = creepActions.actionFillControllerBattery(creep, action);
            }
        }
        return action;
    }

    public runHaulers_wantWork(creep: Creep, action: boolean): boolean {
        action = creepActions.actionMoveToRoom(creep, action, this.operation.roomName);
        action = creepActions.actionGetEnergyCache(creep, action);
        if (!action && this.droppedRes && this.droppedRes.length > this.pickupOrder) {
            creepActions.moveToPickup(creep, this.droppedRes[this.pickupOrder]);
            this.pickupOrder++;
            action = true;
        } else {
            if (this.container && this.hasEnergy() >= 50) {
                creepActions.moveToWithdraw(creep, this.container);
            } else {
                if (this.miners.length > 0) {
                    // stand next to miner hoping for transfer
                    creepActions.moveTo(creep, this.miners[creep.memory.uuid % this.miners.length]);
                }
            }
        }
        return action;
    }

    public runHaulers_walkWork(creep: Creep): boolean {
        if (creep.memory.hasworkpart && Game.cpu.bucket > 1000) {
            let action = false;
            action = creepActions.actionBuildStill(creep, action);
            action = creepActions.actionRepairStill(creep, action);
        }
        return false;
    }

    public runHaulers_earlyFill(creep: Creep, action: boolean): boolean {
        action = creepActions.actionFillEnergy(creep, action);
        action = creepActions.actionFillTower(creep, action);
        action = creepActions.actionFillEnergyStorage(creep, action);
        // action = creepActions.actionFillBufferChest(creep, action);
        action = creepActions.actionFillBattery(creep, action);
        action = creepActions.actionFillBuilder(creep, action);
        action = creepActions.actionFillUpgrader(creep, action);
        action = creepActions.actionFillControllerBattery(creep, action);
        return action;
    }

    public isPathPaved() {
        if (this.memory.isPathPaved === undefined) {
            if (!this.remoteSpawning && this.spawnRoom.energyCapacityAvailable < 450) { this.memory.isPathPaved = true; }
            else {
                const path = this.haulPath();
                if (path.length <= 6) { return true; }
                const unbuilt = roadHelper.getUnbuiltRoads(path);
                if (path.length * 0.1 < unbuilt.length) {
                    this.memory.isPathPaved = false;
                    return false;
                }
                this.memory.isPathPaved = true;
                return true;
            }
        }
        return this.memory.isPathPaved;
    }

    public findDrops(): StructureContainer | StructureLink | StructureStorage | undefined {
        if (this.memory.container) {
            this.container = Game.getObjectById(this.memory.container) || undefined;
            if (!this.container) { this.memory.container = undefined; }
        }
        if (this.memory.link) {
            this.link = Game.getObjectById(this.memory.link) || undefined;
            if (!this.link) { this.memory.link = undefined; }
        }
        if (this.memory.minerStorage) {
            this.minerStorage = Game.getObjectById(this.memory.minerStorage) || undefined;
            if (!this.minerStorage) { this.memory.minerStorage = undefined; }
        }
        if (this.link) { this.isLink = true; }

        return this.minerStorage || this.link || this.container;
    }

    public getCartAnalyze(): cartAnalyze {
        if (!this.cartAnalyze) {
            if (!this.memory.cartAnalyze) {
                const workParts = _.without(this.getMinerBody(), MOVE, CARRY).length;
                const miners = this.minersNeeded();
                const parts = miners * workParts;
                let energyRate = this.source.energyPerTick;
                if (parts < 6) {
                    energyRate = parts * energyRate / 6;
                }
                const distanceAdd = this.remoteSpawning ? 1.0 : this.spawnRoom.room.storage ? 1.0 : 2.0;  // Add some distance since haulers are refilling too
                const dist = this.memory.dist = this.haulPath().length * distanceAdd;
                this.memory.cartAnalyze = roomHelper.cartAnalyze(dist, energyRate, this.spawnRoom, !this.isPathPaved());
            }
            this.cartAnalyze = this.memory.cartAnalyze;
        }
        return this.cartAnalyze!;
    }
}
