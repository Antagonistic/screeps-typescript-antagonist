import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import * as guard from "creeps/roles/guard";

export class GuardMission extends Mission {
    public defenders: Creep[] = [];
    public towers: StructureTower[] = [];
    public hostiles: Creep[] = [];
    public hostileHealers: Creep[] = [];
    public active: boolean = false;

    constructor(operation: Operation) {
        super(operation, "Guard");
    }
    public initMission(): void {
        if (this.room) {
            this.towers = this.room.find<StructureTower>(FIND_MY_STRUCTURES,
                { filter: (x: Structure) => x.structureType === STRUCTURE_TOWER });
        }
        this.findHostiles();
    }

    public spawn(): void {
        this.defenders = this.spawnRole("defender", this.getMaxGuards, this.defenderBody);
    }
    public work(): void {
        for (const g of this.defenders) {
            guard.run(g);
        }
        this.runTowers();
    }
    public finalize(): void { ; }

    public getMaxGuards = () => {
        if (!this.room) { return 0; }
        const hostiles = this.room.find(FIND_HOSTILE_CREEPS);
        if (hostiles && hostiles.length) {
            return 1;
        }
        return 0;
    }

    protected defenderBody = (): BodyPartConstant[] => {
        return this.configBody({ [TOUGH]: 1, [RANGED_ATTACK]: 1, [MOVE]: 2 });
    }


    protected runTowers(): void {
        if (this.active) {
            for (const tower of this.towers) {
                const hostileHealer: Creep | null = tower.pos.findClosestByRange(this.hostileHealers);
                if (hostileHealer) {
                    tower.attack(hostileHealer);
                    return;
                }
                const hostile: Creep | null = tower.pos.findClosestByRange(this.hostiles);
                if (hostile) {
                    tower.attack(hostile);
                }
            }
        } else {
            for (const tower of this.towers) {
                if (tower.energy > tower.energyCapacity / 2) {
                    const structure = tower.pos.findClosestByRange(FIND_MY_STRUCTURES, { filter: (x) => x.hits < x.hitsMax / 2 });
                    if (structure) {
                        tower.repair(structure);
                    }
                }
            }
        }
    }

    protected findHostiles() {
        if (this.room) {
            this.hostiles = this.room.find(FIND_HOSTILE_CREEPS);
            if (this.hostiles.length > 0) {
                this.hostileHealers = this.room.find(FIND_HOSTILE_CREEPS, { filter: (c: Creep) => c.getActiveBodyparts(HEAL) });
                this.active = true;
            }
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
