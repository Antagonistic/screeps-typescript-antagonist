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
export class MiningMission extends Mission {

    public source: Source;
    public miners: Creep[] = [];
    public carts: Creep[] = [];
    public droppedRes?: Resource[];
    public pickupOrder: number = 0;
    public active: boolean;
    public stableMission: boolean;

    public _minersNeeded?: number;

    public container?: StructureContainer | StructureLink;
    public storage: StructureStorage | StructureSpawn | StructureLink;
    public isLink: boolean;

    constructor(operation: Operation, name: string, source: Source, active: boolean = true) {
        super(operation, name);
        this.source = source;
        this.active = active && ((!this.remoteSpawning) || (this.remoteSpawning && this.spawnRoom.rclLevel >= 4));
        if (!this.memory.stableMission) { this.memory.stableMission = false; }
        this.stableMission = this.memory.stableMission;
        this.operation.stableOperation = this.operation.stableOperation && this.stableMission;
        this.isLink = false;
        this.storage = this.findStorage();
        if (this.spawnRoom.room.storage && this.spawnRoom.room.storage.store.energy >= 900000) { this.active = false; }
    }

    public initMission(): void {
        if (!this.hasVision) { return; }
        this.container = this.findContainer();
        // console.log(JSON.stringify(this.memory));
        // console.log(JSON.stringify(this.memory));
        // console.log(this.memory.fillcart)
    }
    public spawn(): void {
        if (this.remoteSpawning && Game.cpu.bucket < 100) { return; } // Oh geez, CPU emergency, disable remote mining
        this.miners = this.spawnRole(this.name, this.getMaxMiners, this.getMinerBody, { role: "miner" }, 10);

        const cartBodyFunc = this.remoteSpawning ? this.getLongCartBody : this.getCartBody;
        const hasworkpart = _.contains(cartBodyFunc(), WORK);
        this.carts = this.spawnRole(this.name + "cart", this.getMaxCarts, cartBodyFunc, { role: "hauler", hasworkpart }, 0);

        if (Game.time % 50 === 0) {
            // Check to update whether mining op is at capacity
            if (this.miners.length >= this.getMaxMiners() && this.carts.length >= this.getMaxCarts()) {
                this.memory.stableMission = true;
            } else {
                this.memory.stableMission = false;
            }
        }

        if (Game.time % 50 === 10 && this.memory.stableMission && Game.cpu.bucket >= 1000) {
            // Check roads
            // console.log("Building mining roads!");
            if (this.buildRoads(this.haulPath())) {
                console.log("Building mining roads!");
            }
        }
    }
    public work(): void {
        if (this.remoteSpawning && Game.cpu.bucket < 100) { return; } // Oh geez, CPU emergency, disable remote mining
        this.runMiners(this.miners);
        this.runHaulers2(this.carts);
    }
    public finalize(): void { ; }

    public getMaxMiners = () => {
        if (!this.active) { return 0; }
        if (this.remoteSpawning) { return 1; }
        return this.minersNeeded();
    };

    public getMinerBody = () => {
        if (this.remoteSpawning) { return this.workerBody(6, 2, 3); }
        const minersSupported = this.minersSupported();
        if (minersSupported === 1) {
            const work = Math.ceil((Math.max(this.source.energyCapacity,
                SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME) / HARVEST_POWER) + 1;
            return this.workerBody(work, 2, Math.ceil(work / 2));
        } else if (minersSupported === 2) {
            return this.workerBody(3, 1, 2);
        } else { return this.workerBody(2, 1, 1); }
    };

    public getMaxCarts = () => {
        if (!this.active) { return 0; }
        if (this.isLink) { return 0; }
        if (this.remoteSpawning && !this.container) { return 0; }
        if (this.storage.pos.inRangeTo(this.source, 5)) { return 1; }
        if (this.room && this.room.energyCapacityAvailable > 1500) { return 1; }
        let maxc = 2;
        if (!this.container && maxc > 1) { maxc = 1; }
        if (this.hasEnergy() >= 1900) { maxc++; }
        return maxc;
    }

    public minersNeeded(): number {
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

    public haulPath = (): RoomPosition[] => {
        let goal;
        if (this.storage) {
            goal = { pos: this.storage.pos, range: 6 }
        } else {
            goal = { pos: this.storage, range: 6 }
        }
        const path = PathFinder.search(this.source.pos, goal).path;
        return path;
    }

    public findContainer(): StructureContainer | StructureLink | undefined {
        if (this.memory.container && Game.time % 500 !== 40) {
            const cont = Game.getObjectById<StructureContainer | StructureLink>(this.memory.container);
            if (cont == null) {
                this.memory.container = undefined;
            } else {
                if (cont.structureType === STRUCTURE_LINK) { this.isLink = true; }
                return cont;
            }
        }
        const containers = this.source.pos.findInRange<StructureContainer | StructureLink>(FIND_STRUCTURES, 2,
            { filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER || x.structureType === STRUCTURE_LINK });
        // let containers = this.source.pos.findInRange(STRUCTURE_CONTAINER, 1);
        if ((!containers || containers.length === 0) && Game.cpu.bucket > 1000) {
            this.placeContainer();
        }
        let ret;
        for (const c of containers) {
            ret = c;
            if (ret.structureType === STRUCTURE_LINK) {
                this.isLink = true;
                break;
            }
        }
        if (ret) {
            this.memory.container = ret.id;
            return ret;
        }
        return undefined;
    }

    public placeContainer(): void {
        const boxSite: ConstructionSite[] = this.source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1,
            { filter: (x: ConstructionSite) => x.structureType === STRUCTURE_CONTAINER });
        if (!boxSite || boxSite.length === 0) {
            const pos = this.haulPath()[0];
            if (pos) {
                const ret = pos.createConstructionSite(STRUCTURE_CONTAINER);
                if (ret !== OK) {
                    console.log("Placing mining box error: " + ret + " in " + this.operation.roomName);
                }
            }
            return;
        }
    }

    public findStorage(): StructureStorage | StructureSpawn | StructureLink {
        if (this.memory.storageId && Game.time % 1000 !== 78) {
            const ret = Game.getObjectById<StructureStorage | StructureSpawn | StructureLink>(this.memory.storageId);
            if (ret) { return ret; }
        }
        const destinations = this.spawnRoom.room.find<StructureLink | StructureStorage>(FIND_MY_STRUCTURES, { filter: x => x.structureType === STRUCTURE_STORAGE || x.structureType === STRUCTURE_LINK })
        // console.log('Possible destinations: ' + destinations);
        if (destinations != null) {
            // const destPos = this.source.pos.findClosestByPath(_.map(destinations, x => x.pos));
            const dest = roomHelper.findShortestPath(this.source.pos, destinations);
            if (dest) {
                // console.log('new storage for ' + this.name + ': ' + dest);
                this.memory.storageId = dest.id;
                const ret = Game.getObjectById<StructureStorage | StructureSpawn | StructureLink>(this.memory.storageId);
                if (ret) { return ret; }
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
            let action: boolean = false;
            if (!creep.memory.inPosition) {
                action = creepActions.actionMoveToRoom(creep, action, this.operation.roomName);
                if (creep.pos.isNearTo(this.source.pos)) {
                    if (this.container != null) {
                        if (creep.pos.isNearTo(this.container.pos)) {
                            creep.memory.inPosition = true;
                        }
                        else {
                            creepActions.moveTo(creep, this.container.pos, true);
                        }
                    }
                    else {
                        creep.memory.inPosition = true;
                    }
                } else {
                    creepActions.moveTo(creep, this.source.pos, true);
                }
            } else {
                if (sourceEnergy) {
                    const ret: number = creep.harvest(this.source);
                    if (ret === ERR_NOT_IN_RANGE) {
                        creepActions.moveTo(creep, this.source.pos, true);
                    }
                }
                if (creep.carry.energy > 40) {
                    if ((Game.time % 5 === 1 && Game.cpu.bucket > 800) || !this.container) {
                        const haulers = creep.pos.findInRange(FIND_MY_CREEPS, 1, { filter: (c: Creep) => c.memory.role && c.memory.role !== "miner" });
                        if (haulers.length > 0) {
                            action = creepActions.actionTransferStill(creep, action, haulers[0]);
                        } else {
                            action = creepActions.actionBuildStill(creep, action);
                            action = creepActions.actionRepairStill(creep, action);
                            if (this.container) {
                                action = creepActions.actionTransferStill(creep, action, this.container);
                            }
                        }
                    } else {
                        if (this.container) {
                            action = creepActions.actionTransfer(creep, action, this.container);
                        }
                    }
                }
            }
        }
    }

    public hasEnergy(): number {
        if (!this.container) { return 0; }
        if (this.container instanceof StructureLink) {
            if (this.container.energy > 50) { return this.container.energy; }
        }
        if (this.container instanceof StructureContainer) {
            if (this.container.store.energy > 50) { return this.container.store.energy; }
            return 0;
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
        action = this.runHaulers_walkWork(creep);
        action = creepActions.actionFillCache(creep, action);
        if (!action && !this.spawnRoom.room.storage) {
            action = this.runHaulers_earlyFill(creep, action);
        } else {
            if (!this.operation.stableOperation) {
                action = creepActions.actionFillEnergy(creep, action);
            }
            action = creepActions.actionTransfer(creep, action, this.storage);
            action = creepActions.actionFillEnergyStorage(creep, action);
        }
        return action;
    }

    public runHaulers_wantWork(creep: Creep, action: boolean): boolean {
        action = creepActions.actionMoveToRoom(creep, action, this.operation.roomName);
        action = creepActions.actionGetEnergyCache(creep, action);
        if (!action && this.droppedRes && this.droppedRes.length > this.pickupOrder) {
            creepActions.moveToPickup(creep, this.droppedRes[this.pickupOrder]);
            this.pickupOrder++;
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
        return action;
    }

    public runHaulers(creeps: Creep[]): void {
        const work: Creep[] = [];
        const idle: Creep[] = [];
        let fillCart: Creep | null = null;
        // console.log(this.memory.fillcart);
        if (this.memory.fillcart) {
            fillCart = Game.creeps[this.memory.fillcart];
            if (!fillCart) {
                delete this.memory.fillcart;
            }
            if (fillCart && _.sum(fillCart.carry) === fillCart.carryCapacity) {
                fillCart.memory.working = true;
                delete this.memory.fillcart;
            }
        }

        // console.log(fillCart);
        for (const h of this.carts) {
            if (this.memory.fillcart === h.name) {
                continue;
            }
            if (h.memory.working) {
                if (_.sum(h.carry) === 0) {
                    h.memory.working = false;
                    idle.push(h);
                } else {
                    work.push(h);
                }
            } else {
                if (!fillCart) {
                    this.memory.fillcart = h.name;
                    fillCart = h;
                } else {
                    if (_.sum(h.carry) === h.carryCapacity) {
                        h.memory.working = true;
                        work.push(h);
                    } else {
                        idle.push(h);
                    }
                }
            }
        }

        // console.log("Foo " + this.carts.length + " " + work.length + " " + idle.length + " " + fillCart);

        if (fillCart) {
            const droppedRes: Resource[] = this.source.pos.findInRange(FIND_DROPPED_RESOURCES, 3,
                {
                    filter: (x: Resource) => x.resourceType === RESOURCE_ENERGY &&
                        x.amount >= 20
                });
            if (droppedRes.length > 0) {
                creepActions.getEnergy(fillCart, droppedRes[0]);
            } else {
                if (this.container) {
                    creepActions.moveToWithdraw(fillCart, this.container);
                }
            }

        }

        if (idle.length > 0) {
            const idlePos: RoomPosition = this.haulPath()[2];
            idlePos.y = idlePos.y + 1;

            for (const h of idle) {
                creepActions.moveTo(h, idlePos);
            }
        }

        if (work.length > 0) {
            for (const w of work) {
                let action = false;
                action = creepActions.actionFillEnergy(w, action);
                action = creepActions.actionFillTower(w, action);
                action = creepActions.actionFillBufferChest(w, action);
                action = creepActions.actionFillEnergyStorage(w, action);
                action = creepActions.actionFillBattery(w, action);
                action = creepActions.actionFillBuilder(w, action);
                action = creepActions.actionFillUpgrader(w, action);
            }
        }


    }
}
