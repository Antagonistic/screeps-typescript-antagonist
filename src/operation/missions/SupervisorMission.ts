import { LogisticsManager } from "operation/LogisticsManager";
import { Operation } from "../operations/Operation";
import { Mission } from "./mission";

import * as creepActions from "creeps/creepActions";


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
            if (Game.time % 4 === 0) {
                for (let i = 0; i < this.room.memory.supervisor.length; i++) {
                    if (i >= this.supers.length) { return; }
                    const sup = this.supers[i];
                    const supPos = this.room.memory.supervisor[i];
                    if (!sup || !supPos) { continue; }
                    if (sup.pos.x !== supPos.x || sup.pos.y !== supPos.y) {
                        sup.say("Move " + supPos.x + "," + supPos.y);
                        const badCreeps = this.room.lookForAt("creep", supPos.x, supPos.y);
                        for (const bC of badCreeps) { bC.moveTo(this.operation.rallyPos); };
                        // creepActions.moveTo(sup, new RoomPosition(supPos.x, supPos.y, this.room.name));
                        sup.moveTo(supPos.x, supPos.y);
                        continue;
                    }
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
                    let spent = sup.carryCapacity - sup.carry.energy;
                    for (const t of towers) {
                        if (t.energy < t.energyCapacity) {
                            const amount = t.energyCapacity - t.energy;
                            sup.transfer(t, RESOURCE_ENERGY, amount);
                            spent += amount;
                        }
                    }
                    for (const s of spawns) {
                        if (s.energy < s.energyCapacity) {
                            const amount = s.energyCapacity - s.energy;
                            sup.transfer(s, RESOURCE_ENERGY, amount);
                            spent += amount;
                        }
                    }
                    for (const c of containers) {
                        if (_.sum(c.store) < c.storeCapacity) {
                            const amount = c.storeCapacity - _.sum(c.store);
                            sup.transfer(c, RESOURCE_ENERGY, amount);
                            spent += amount;
                        }
                    }
                    if (link) {
                        if (link.energy < 400) {
                            sup.say("+link");
                            const amount = 400 - link.energy;
                            sup.transfer(link, RESOURCE_ENERGY, amount);
                            spent += amount;
                        } else if (link.energy > 400) {
                            sup.say("-link");
                            const amount = link.energy - 400;
                            sup.withdraw(link, RESOURCE_ENERGY);
                            spent -= amount;
                        }
                    }
                    if (storage) {
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
                    }
                    if (terminal) {
                        for (const resourceType in sup.carry) {
                            if (resourceType === RESOURCE_ENERGY) { continue; }
                            sup.transfer(terminal, resourceType as ResourceConstant);
                            // sup.transfer(terminal, resourceType as ResourceConstant);
                        }
                    }
                }

            } else if (Game.time % 4 === 1) {
                if (this.room.storage) {
                    for (let i = 0; i < this.room.memory.supervisor.length; i++) {
                        if (i >= this.supers.length) { return; }
                        const sup = this.supers[i];
                        if (sup.pos.isNearTo(this.room.storage)) {
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
            }
        }
    }
    public finalize(): void {
        ;
    }

}
