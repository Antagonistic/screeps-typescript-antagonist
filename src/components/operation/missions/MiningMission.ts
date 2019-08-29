import { openAdjacentSpots } from "components/rooms/roomHelper";
import { Operation } from "../operations/Operation";
import { Mission } from "./mission";

import * as creepActions from "components/creeps/creepActions";

import * as hauler from "components/creeps/roles/hauler";
import * as miner from "components/creeps/roles/miner";

import { posix } from "path";
import { Traveler } from "utils/Traveler"

export class MiningMission extends Mission {

    public source: Source;
    public miners: Creep[] = [];
    public carts: Creep[] = [];
    public active: boolean;
    public stableMission: boolean;

    public _minersNeeded?: number;

    public container?: StructureContainer;
    public storage: StructureStorage | StructureSpawn;

    constructor(operation: Operation, name: string, source: Source, active: boolean = true) {
        super(operation, name);
        this.source = source;
        this.active = active;
        if (!this.memory.stableMission) { this.memory.stableMission = false; }
        this.stableMission = this.memory.stableMission;
        this.operation.stableOperation = this.operation.stableOperation && this.stableMission;
        this.storage = this.findStorage();
    }

    public initMission(): void {
        if (!this.hasVision) { return; }
        this.container = this.findContainer();
        // console.log(JSON.stringify(this.memory));
        // console.log(JSON.stringify(this.memory));
        // console.log(this.memory.fillcart)
    }
    public spawn(): void {
        this.miners = this.spawnRole(this.name, this.getMaxMiners, this.getMinerBody, { role: "miner" }, 10);

        this.carts = this.spawnRole(this.name + "cart", this.getMaxCarts, this.getCartBody, { role: "hauler" }, 0);

        if (Game.time % 50 === 0) {
            // Check to update whether mining op is at capacity
            if (this.miners.length >= this.getMaxMiners() && this.carts.length >= this.getMaxCarts()) {
                this.memory.stableMission = true;
            } else {
                this.memory.stableMission = false;
            }
        }

        if (Game.time % 50 === 10 && this.memory.stableMission) {
            // Check roads
            // console.log("Building mining roads!");
            if (this.buildRoads(this.haulPath())) {
                console.log("Building mining roads!");
            }
        }
    }
    public work(): void {
        // for (const m of this.miners) {
        // if (!m.memory.sourceID) { m.memory.sourceID = this.source.id; }
        // if (!m.memory.target && this.container) { m.memory.sourceID = this.container.id; }
        // miner.run(m);
        // }
        this.runMiners(this.miners);

        // for (const h of this.carts) {
        // hauler.run(h);
        // console.log(h.name);
        // }
        this.runHaulers2(this.carts);
        // if (this.room) {
        //     new RoomVisual(this.room.name).poly(this.haulPath());
        // }
    }
    public finalize(): void { ; }

    public getMaxMiners = () => this.active ? this.minersNeeded() : 0;

    public getMinerBody = () => {
        if (this.remoteSpawning) { return this.workerBody(6, 1, 6); }
        const minersSupported = this.minersSupported();
        if (minersSupported === 1) {
            const work = Math.ceil((Math.max(this.source.energyCapacity,
                SOURCE_ENERGY_CAPACITY) / ENERGY_REGEN_TIME) / HARVEST_POWER) + 1;
            return this.workerBody(work, 1, Math.ceil(work / 2));
        } else if (minersSupported === 2) {
            return this.workerBody(3, 1, 2);
        } else { return this.workerBody(2, 1, 1); }
    };

    public getMaxCarts = () => {
        if (this.storage.pos.inRangeTo(this.source, 5)) { return 1; }
        let maxc = this.active ? Math.min(this.minersNeeded(), 2) : 0;
        if (!this.container && maxc > 1) { maxc = 1; }
        if (this.container && this.container.store.energy >= 1900) { maxc++; }
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
            goal = { pos: this.storage.pos, range: 1 }
        } else {
            goal = { pos: this.storage, range: 1 }
        }
        const path = PathFinder.search(this.source.pos, goal).path;
        return path;
    }

    public findContainer(): StructureContainer {
        const containers = this.source.pos.findInRange<StructureContainer>(FIND_STRUCTURES, 1,
            { filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER });
        // let containers = this.source.pos.findInRange(STRUCTURE_CONTAINER, 1);
        if (!containers || containers.length === 0) {
            this.placeContainer();
        }
        return containers[0];
    }

    public placeContainer(): void {
        const boxSite: ConstructionSite[] = this.source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 1,
            { filter: (x: ConstructionSite) => x.structureType === STRUCTURE_CONTAINER });
        if (!boxSite || boxSite.length === 0) {
            const pos = this.haulPath()[0];
            const ret = pos.createConstructionSite(STRUCTURE_CONTAINER);
            if (ret !== OK) {
                console.log("Placing mining box error: " + ret);
            }
            return;
        }
    }

    public findStorage(): StructureStorage | StructureSpawn {
        if (this.spawnRoom.room.storage) { return this.spawnRoom.room.storage; }
        return this.spawnRoom.spawns[0];
    }

    public runMiners(creeps: Creep[]): void {
        for (const creep of creeps) {
            // console.log(creep.name + " running");
            let action: boolean = false;
            const sourceEnergy = this.source.energy > 0;
            if (sourceEnergy) {
                const ret: number = creep.harvest(this.source);
                if (ret === ERR_NOT_IN_RANGE) {
                    // action = creepActions.actionMoveToRoom(creep, action, this.source.room);
                    creepActions.moveTo(creep, this.source.pos, true);
                }
            }
            // else {
            if (creep.carry.energy > 40) {
                const haulers = creep.pos.findInRange(FIND_MY_CREEPS, 1, { filter: (c: Creep) => c.memory.role && c.memory.role === "hauler" });
                if (haulers.length > 0) {
                    action = creepActions.actionTransferStill(creep, action, haulers[0]);
                } else {
                    action = creepActions.actionBuildStill(creep, action);
                    action = creepActions.actionRepairStill(creep, action);
                    if (this.container) {
                        action = creepActions.actionTransferStill(creep, action, this.container);
                    }
                }
            }
            // }
        }
    }

    public runHaulers2(creeps: Creep[]): void {
        const droppedRes = this.source.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
            filter: (x: Resource) => x.resourceType === RESOURCE_ENERGY
                && x.amount >= 50
        })
        let pickupOrder = 0;
        for (const creep of this.carts) {
            let action: boolean = false;
            action = creepActions.actionRecycle(creep, action);

            if (!action && creepActions.canWork(creep)) {
                action = creepActions.actionFillCache(creep, action);
                action = creepActions.actionFillEnergy(creep, action);
                action = creepActions.actionFillTower(creep, action);
                action = creepActions.actionFillBufferChest(creep, action);
                action = creepActions.actionFillEnergyStorage(creep, action);
                action = creepActions.actionFillBattery(creep, action);
                action = creepActions.actionFillBuilder(creep, action);
                action = creepActions.actionFillUpgrader(creep, action);
            } else {
                // action = creepActions.actionMoveToRoom(creep, action);
                if (droppedRes && droppedRes.length > pickupOrder) {
                    creepActions.moveToPickup(creep, droppedRes[pickupOrder]);
                    pickupOrder++;
                } else {
                    if (this.container && this.container.store.energy >= 50) {
                        creepActions.moveToWithdraw(creep, this.container);
                    } else {
                        if (this.miners.length > 0) {
                            // stand next to miner hoping for transfer
                            creepActions.moveTo(creep, this.miners[creep.memory.uuid % this.miners.length]);
                        }
                    }
                }

                // action = creepActions.actionGetDroppedEnergy(creep, action, true);
                // action = creepActions.actionGetContainerEnergy(creep, action, 2, true);
            }
        }
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
                h.moveTo(idlePos);
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
