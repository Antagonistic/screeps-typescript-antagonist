import { Operation } from "../operations/Operation";
import { Mission } from "./mission";

import * as creepActions from "creeps/creepActions";

import { posix } from "path";
import { profile } from "Profiler";
import * as roomHelper from "rooms/roomHelper"
import { Traveler } from "utils/Traveler"


@profile
export class MineralMission extends Mission {
    public extractor?: StructureExtractor;
    public mineral?: Mineral;
    public miners: Creep[] = [];
    public haulers: Creep[] = [];
    public droppedRes?: Resource[];
    public container?: StructureContainer;
    public storage?: StructureTerminal;
    public pickupOrder: number = 0;
    public active: boolean = false;

    constructor(operation: Operation) {
        super(operation, "mineral");
    }

    public initMission(): void {
        if (this.spawnRoom.rclLevel >= 6) {
            this.mineral = _.first(this.spawnRoom.room.find(FIND_MINERALS));
            this.extractor = _.first(this.room!.find<StructureExtractor>(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_EXTRACTOR }));
            this.container = this.findContainer();
            this.storage = this.spawnRoom.room.terminal;
            if (!this.extractor) {
                if (this.mineral) {
                    roomHelper.buildIfNotExist(this.mineral.pos, STRUCTURE_EXTRACTOR);
                }
            } else {
                if (this.mineral.mineralAmount > 0 && this.storage && this.storage.store.getFreeCapacity() > this.storage.store.getCapacity() * 0.8) {
                    this.active = true;
                }
            }
        }
    }
    public spawn(): void {
        const maxMiners = () => this.active ? 1 : 0;
        this.miners = this.spawnRole(this.name, maxMiners, this.getMinerBody, {}, 10);
        const maxHaulers = () => this.active ? 1 : 0;
        this.haulers = this.spawnRole(this.name + "_cart", maxHaulers, this.getCartBody, {}, 0);
    }

    public work(): void {
        if (this.active) {
            this.runMiners();
            this.runHaulers(this.haulers);
        }
    }
    public finalize(): void {
        ;
    }

    public getMinerBody = () => {
        return this.getMineralMinerBody();
    };

    public runMiners() {
        if (!this.extractor) { return; }
        if (!this.mineral) { return; }
        const mineralAmount = this.mineral.mineralAmount;
        for (const creep of this.miners) {
            let action: boolean = false;
            if (!creep.memory.inPosition) {
                action = creepActions.actionMoveToRoom(creep, action, this.operation.roomName);
                if (creep.pos.isNearTo(this.extractor!.pos)) {
                    if (this.container != null) {
                        if (creep.pos.x === this.container.pos.x && creep.pos.y === this.container.pos.y) {
                            creep.memory.inPosition = true;
                        }
                        else {
                            creepActions.moveTo(creep, this.container.pos, true);
                            for (const p of this.extractor!.pos.openAdjacentSpots()) {
                                if (p.isNearTo(this.container.pos)) {
                                    creepActions.moveTo(creep, p, true);
                                }
                            }
                        }
                    }
                    else {
                        creep.memory.inPosition = true;
                        roomHelper.buildIfNotExist(creep.pos, STRUCTURE_CONTAINER);
                    }
                } else {
                    creepActions.moveTo(creep, this.extractor.pos, false);
                }
            } else {
                if (!this.container) {
                    roomHelper.buildIfNotExist(creep.pos, STRUCTURE_CONTAINER);
                }
                if (Game.time % 6 === 0 && mineralAmount > 0) {
                    const ret: number = creep.harvest(this.mineral);
                    if (ret === ERR_NOT_IN_RANGE) {
                        creepActions.moveTo(creep, this.mineral.pos, false);
                    }
                }
                if (_.sum(creep.carry) > 40) {
                    if ((Game.time % 5 === 1 && Game.cpu.bucket > 800) || !this.container) {
                        const haulers = creep.pos.findInRange(FIND_MY_CREEPS, 1, { filter: (c: Creep) => c.memory.role && c.memory.role !== "miner" && c.name !== creep.name });
                        if (haulers.length > 0) {
                            creep.say('+haul');
                            action = creepActions.actionTransferStill(creep, action, haulers[0]);
                        }
                    }
                    if (this.container) {
                        action = creepActions.actionTransfer(creep, action, this.container);
                    }
                }
            }
        }
    }

    public runHaulers(creeps: Creep[]): void {
        if (!this.extractor) { return; }
        if (!this.mineral) { return; }
        this.droppedRes = this.mineral.pos.findInRange(FIND_DROPPED_RESOURCES, 3, {
            filter: (x: Resource) => x.amount >= 50
        });
        const hasEnergy = this.hasMinerals();
        for (const creep of this.haulers) {
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
        action = creepActions.actionFillCache(creep, action);
        {
            action = creepActions.actionTransfer(creep, action, this.storage);
        }
        return action;
    }

    public runHaulers_wantWork(creep: Creep, action: boolean): boolean {
        if (!action && this.droppedRes && this.droppedRes.length > this.pickupOrder) {
            creepActions.moveToPickup(creep, this.droppedRes[this.pickupOrder]);
            this.pickupOrder++;
        } else {
            if (this.container && this.hasMinerals() >= 50) {
                creepActions.moveToWithdraw(creep, this.container, this.mineralType());
            } else {
                if (this.miners.length > 0) {
                    // stand next to miner hoping for transfer
                    creepActions.moveTo(creep, this.miners[creep.memory.uuid % this.miners.length]);
                }
            }
        }
        return action;
    }

    public hasMinerals(): number {
        if (!this.container) { return 0; }
        if (this.container instanceof StructureContainer) {
            if (_.sum(this.container.store) > 50) { return _.sum(this.container.store); }
            return 0;
        }
        return 0;
    }

    public mineralType(): ResourceConstant {
        return this.mineral!.mineralType;
    }

    public findContainer(): StructureContainer | undefined {
        if (!this.mineral) { return undefined; }
        const ret = this.mineral!.pos.findInRange<StructureContainer>(FIND_STRUCTURES, 1, { filter: (x) => x.structureType === STRUCTURE_CONTAINER });
        if (!ret) { return undefined; }
        return _.first(ret);
    }

}
