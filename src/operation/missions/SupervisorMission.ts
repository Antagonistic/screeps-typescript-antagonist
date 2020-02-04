import { LogisticsManager } from "operation/LogisticsManager";
import { Operation } from "../operations/Operation";
import { Mission } from "./mission";

import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";

@profile
export class SupervisorMission extends Mission {
    public logistics: LogisticsManager;
    public supers: Creep[] = [];
    constructor(operation: Operation, logistics: LogisticsManager) {
        super(operation, "supervisor");
        this.logistics = logistics;
    }
    public initMission(): void {
        ;
    }
    public spawn(): void {
        const numSuper = (): number => {
            return this.room && this.room.storage && this.room.memory.supervisor ? this.room.memory.supervisor.length : 0;
        }
        const superBody = (): BodyPartConstant[] => {
            const carryparts = Math.min((this.logistics.C / 50) - 1, 18);
            return this.workerBody(0, carryparts, 1);
        }
        this.supers = this.spawnRole("super", numSuper, superBody, { role: "super" }, 0);
    }

    public work(): void {
        if (this.room && this.room.memory.supervisor && this.room.memory.supervisor.length > 0) {
            for (let i = 0; i < this.room.memory.supervisor.length; i++) {
                if (i >= this.supers.length) { return; }
                const sup = this.supers[i];
                const supPos = this.room.memory.supervisor[i];
                if (this.work_Move(sup, supPos)) {
                    if (Game.time % 4 === 0) {
                        this.work_On(sup);
                    }
                    else if (Game.time % 4 === 1) {
                        this.work_Off(sup);
                    }
                }
            }
        }
    }

    public work_Move(sup: Creep, supPos: LightRoomPos): boolean {
        if (!sup || !supPos) { return false; }
        if (sup.pos.x !== supPos.x || sup.pos.y !== supPos.y) {
            sup.say("Move " + supPos.x + "," + supPos.y);
            sup.drop(RESOURCE_ENERGY);
            const badCreeps = this.room!.lookForAt("creep", supPos.x, supPos.y);
            for (const bC of badCreeps) { creepActions.moveTo(bC, this.operation.rallyPos); };
            // creepActions.moveTo(sup, new RoomPosition(supPos.x, supPos.y, this.room.name));
            creepActions.moveTo(sup, new RoomPosition(supPos.x, supPos.y, this.room!.name), true);
            return false;
        }
        return true;
    }

    public work_On(sup: Creep) {
        const struct = sup.pos.findInRange(FIND_MY_STRUCTURES, 1);
        let storage: StructureStorage | undefined;
        const containers: StructureContainer[] = [];
        const towers: StructureTower[] = [];
        const spawns: StructureSpawn[] = [];
        let link: StructureLink | undefined;
        let terminal: StructureTerminal | undefined;
        for (const s of struct) {
            if (s instanceof StructureStorage) { storage = s; }
            if (s instanceof StructureContainer) { containers.push(s); }
            if (s instanceof StructureTower) { towers.push(s); }
            if (s instanceof StructureSpawn) { spawns.push(s); }
            if (s instanceof StructureLink) { link = s; }
            if (s instanceof StructureTerminal) { terminal = s; }
        }
        let creepE = sup.carry.energy;
        const maxCreepE = sup.carryCapacity;
        for (const t of towers) {
            if (t.energy < t.energyCapacity) {
                const amount = Math.min(t.energyCapacity - t.energy, creepE);
                sup.transfer(t, RESOURCE_ENERGY, amount);
                creepE -= amount;
            }
        }
        for (const s of spawns) {
            if (s.energy < s.energyCapacity) {
                const amount = Math.min(s.energyCapacity - s.energy, creepE);
                sup.transfer(s, RESOURCE_ENERGY, amount);
                creepE -= amount;
            }
        }
        for (const c of containers) {
            if (_.sum(c.store) < c.storeCapacity) {
                const amount = Math.min(c.storeCapacity - _.sum(c.store), creepE);
                sup.transfer(c, RESOURCE_ENERGY, amount);
                creepE -= amount;
            }
        }
        if (link) {
            creepE = this.work_Link(sup, link, creepE);
        }
        /*if (storage) {
            if (storage.store.energy > spent) {
                sup.withdraw(storage, RESOURCE_ENERGY, spent);
            }
            if (terminal && Game.time % 10 === 0) {
                for (const resourceType in storage.store) {
                    if (resourceType === RESOURCE_ENERGY) { continue; }
                    sup.withdraw(storage, resourceType as ResourceConstant);
                    // sup.transfer(terminal, resourceType as ResourceConstant);
                }
            }
        }*/
        /*if (terminal) {
            for (const resourceType in sup.carry) {
                if (resourceType === RESOURCE_ENERGY) { continue; }
                sup.transfer(terminal, resourceType as ResourceConstant);
                // sup.transfer(terminal, resourceType as ResourceConstant);
            }
        }*/
        if (terminal && storage) {
            if (terminal.store.energy < 100000 && storage.store.energy > 500000) {
                sup.transfer(terminal, RESOURCE_ENERGY, creepE);
            }
        }
    }

    public work_Link(sup: Creep, link: StructureLink, creepE: number): number {
        const controlLink = _.head(this.room!.controller!.pos.findInRange(FIND_MY_STRUCTURES, 3, { filter: (x: Structure) => x.structureType === STRUCTURE_LINK }));
        let balanceAmount = 400;
        if (controlLink) {
            balanceAmount = 800 - (controlLink as StructureLink).energy;
        }
        if (link.energy < balanceAmount) {
            sup.say("+link");
            const amount = Math.min(balanceAmount - link.energy, creepE);
            sup.transfer(link, RESOURCE_ENERGY, amount);
            creepE -= amount;
        } else if (link.energy > balanceAmount) {
            sup.say("-link");
            const amount = link.energy - balanceAmount;
            sup.withdraw(link, RESOURCE_ENERGY);
            creepE += amount;
        }
        return creepE;
    }

    public work_Off(sup: Creep) {
        if (this.room && this.room.storage) {
            if (sup.pos.isNearTo(this.room.storage.pos)) {
                const energyBalance = sup.carry.energy - 400;
                if (energyBalance > 0) {
                    sup.transfer(this.room.storage, RESOURCE_ENERGY, energyBalance);
                } else {
                    if (energyBalance < 0) {
                        sup.withdraw(this.room.storage, RESOURCE_ENERGY, -energyBalance);
                    }
                }
            }
        }
    }

    public finalize(): void {
        ;
    }

}
