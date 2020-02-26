import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import { TargetAction, EnergyState } from "config/Constants";
import { BodyFactory } from "creeps/BodyFactory";
import * as creepActions from "creeps/creepActions";
import { task } from "creeps/tasks";
import { profile } from "Profiler";

@profile
export class GuardMission extends Mission {
    public defenders: Creep[] = [];
    public towers: StructureTower[] = [];
    public hostiles: Creep[] = [];
    public hostileHealers: Creep[] = [];
    public active: boolean;
    public stage: boolean;

    constructor(operation: Operation, stage?: boolean, active?: boolean) {
        super(operation, "Guard");
        this.stage = stage === true;
        this.active = active === false ? false : this.getActive();
    }
    public initMission(): void {
        if (this.room && !this.remoteSpawning) {
            this.towers = this.room.find<StructureTower>(FIND_MY_STRUCTURES,
                { filter: (x: Structure) => x.structureType === STRUCTURE_TOWER });
        }
        this.findHostiles();
    }

    public spawn(): void {
        this.defenders = this.spawnRole("defender", this.getMaxGuards, this.defenderBody);
    }
    public work(): void {
        this.runGuards();
        this.runTowers();
    }
    public finalize(): void {
        this.report()
    }

    public getActive() {
        if ((this.remoteSpawning || this.stage) && (this.energyState() === EnergyState.CRITICAL || this.energyState() === EnergyState.LOW)) { return false; }
        return true;
    }

    public getMaxGuards = () => {
        if (!this.active) { return 0; }
        if (this.stage) { return 1; }
        if (!this.room) { return 0; }
        const hostiles = this.room.find(FIND_HOSTILE_CREEPS);
        if (this.hostiles.length > 0) {
            return hostiles.length;
        }
        return 0;
    }

    protected defenderBody = (): BodyPartConstant[] => {
        if (this.energyState() === EnergyState.CRITICAL || this.energyState() === EnergyState.LOW) {
            const bodyUnit = BodyFactory.configBody({ [ATTACK]: 1, [MOVE]: 1 });
            const maxUnits = Math.min(this.maxUnitsNow(bodyUnit), 8);
            return BodyFactory.configBody({ [ATTACK]: maxUnits, [MOVE]: maxUnits });
        }
        if (this.spawnRoom.energyCapacityAvailable >= 2710) {
            const bodyUnit = BodyFactory.configBody({ [TOUGH]: 1, [ATTACK]: 5, [MOVE]: 6 });
            const maxUnits = Math.min(this.maxUnits(bodyUnit), 4);
            return BodyFactory.configBody({ [TOUGH]: maxUnits, [ATTACK]: maxUnits * 5, [MOVE]: maxUnits * 6 });
        } else {
            const bodyUnit = BodyFactory.configBody({ [ATTACK]: 1, [MOVE]: 1 });
            const maxUnits = Math.min(this.maxUnits(bodyUnit), 8);
            return BodyFactory.configBody({ [ATTACK]: maxUnits, [MOVE]: maxUnits });
        }
    }

    public runGuards(): void {
        for (const g of this.defenders) {
            // let action: boolean = false;
            // action = creepActions.actionRecycle(g, action);
            // action = creepActions.actionMoveToRoom(g, action);
            g.action = creepActions.actionRecycle(g, g.action);
            task.moveToRoom(g, this.operation.roomName);
            g.actionTarget()
            if (this.active) {
                task.attackHostile(g);
            } else {
                if (!this.stage) {
                    g.memory.recycle = true;
                }
            }
            g.rally();

        }
    }


    protected runTowers(): void {

        if (this.active) {
            for (const tower of this.towers) {
                const hostileHealer: Creep | null = tower.pos.findClosestByRange(this.hostileHealers);
                if (hostileHealer) {
                    tower.attack(hostileHealer);
                    continue;
                }
                const hostile: Creep | null = tower.pos.findClosestByRange(this.hostiles);
                if (hostile) {
                    tower.attack(hostile);
                }
            }
        } /*else {
            for (const tower of this.towers) {
                if (tower.energy > tower.energyCapacity / 2) {
                    const structure = tower.pos.findClosestByRange(FIND_STRUCTURES, { filter: (x) => x.hits < x.hitsMax / 2 && (x.structureType !== STRUCTURE_WALL && x.structureType !== STRUCTURE_RAMPART) });;
                    if (structure) {
                        tower.repair(structure);
                    }
                }
            }
    }*/
    }

    protected findHostiles() {
        if (this.room) {
            // this.hostiles = this.room.find(FIND_HOSTILE_CREEPS);
            this.hostiles = this.room.dangerousHostiles;
            if (this.hostiles.length > 0) {
                this.hostileHealers = this.room.find(FIND_HOSTILE_CREEPS, { filter: (c: Creep) => c.getActiveBodyparts(HEAL) });
                this.active = true;
                this.defenders.forEach(x => x.memory.recycle = false);
            } else {
                if (!this.remoteSpawning) {
                    this.defenders.forEach(x => x.memory.recycle = true);
                }
            }
        }
        if (this.remoteSpawning) {
            this.active = true;
        }
    }

    public report() {
        if (this.hostiles.length > 0 && Game.time % 10 === 0) {
            console.log('GUARD: Room ' + this.spawnRoom.room.name + ' responding to attack ' + this.hostiles[0].pos.print + ' ' + this.defenders.length + '/' + this.getMaxGuards());
        }
    }


    public triggerSafeMode() {
        if (this.room) {
            const spawns: StructureSpawn[] = this.room.find(FIND_MY_SPAWNS);
            for (const spawn of spawns) {
                if (spawn.hits < spawn.hitsMax) {
                    // EMERGENCY, SAFE MODE!
                    this._safeMode(this.room);
                }
            }
        }
    }

    protected _safeMode(room: Room) {
        // EMERGENCY, SAFE MODE!
        const hostiles: Creep[] = room.find(FIND_HOSTILE_CREEPS, { filter: (x: Creep) => x.owner.username !== "Invader" });
        if (room.controller && room.controller.my && room.controller.safeModeAvailable && hostiles && hostiles.length) {
            if (!room.controller.safeMode) {
                room.controller.activateSafeMode();
                console.log(room.name + ": EMERGENCY! SAFE MODE ACTIVATED!!");
            }
        }
    }
}
