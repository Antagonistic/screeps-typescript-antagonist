import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import * as creepActions from "components/creeps/creepActions";
import * as builder from "components/creeps/roles/builder";

export const PRIORITY_BUILD: string[] = [
    STRUCTURE_SPAWN,
    STRUCTURE_TOWER,
    STRUCTURE_EXTENSION,
    STRUCTURE_ROAD,
    STRUCTURE_CONTAINER,
    STRUCTURE_LINK,
    STRUCTURE_STORAGE
];

export class BuilderMission extends Mission {

    public builders: Creep[] = [];
    public pavers: Creep[] = [];
    public roadsites: ConstructionSite[] = [];
    public sites: ConstructionSite[] = [];
    public prioritySites: ConstructionSite[] = [];

    constructor(operation: Operation) {
        super(operation, "builder")
    }
    public initMission(): void {
        if (this.room) {
            this.sites = this.room.find(FIND_MY_CONSTRUCTION_SITES,
                { filter: (x: ConstructionSite) => x.structureType !== STRUCTURE_ROAD });
            this.roadsites = this.room.find(FIND_MY_CONSTRUCTION_SITES,
                { filter: (x: ConstructionSite) => x.structureType === STRUCTURE_ROAD });
            this.prioritySites = _.filter(this.sites, s => PRIORITY_BUILD.indexOf(s.structureType) > -1);
            // console.log(this.sites.length);
        }
    }
    public spawn(): void {
        this.builders = this.spawnRole(this.name, this.maxBuilders, this.builderBody, { role: "builder" });
        this.pavers = this.spawnRole(this.name + "paver", () => 1, this.builderBody, { role: "builder" });
    }
    public work(): void {
        // for (const b of this.builders) {
        //     if (b.carry.energy > 10) { b.memory.working = true; }
        //     builder.run(b);
        // }
        this.runBuilders();
        this.runPavers();
    }
    public finalize(): void {
        ;
    }

    public maxBuilders = (): number => {
        if (this.sites.length === 0) {
            return 0;
        }
        return 1;
    }

    public maxPavers = (): number => {
        if ((this.room && this.room.memory.mine_structures) || this.roadsites.length !== 0) {
            return 1;
        }
        return 0;
    }

    public builderBody = (): BodyPartConstant[] => {
        const energyAvailable = this.spawnRoom.energyCapacityAvailable;
        if (energyAvailable >= 650) {
            // return [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY, CARRY];
            return this.workerBody(4, 2, 4);
        } else if (energyAvailable >= 400) {
            // return [MOVE, MOVE, WORK, WORK, CARRY, CARRY];
            return this.workerBody(2, 2, 2);
        } else {
            // return [MOVE, WORK, WORK, CARRY];
            return this.workerBody(2, 1, 1);
        }
    }

    public runPavers() {
        for (const b of this.pavers) {
            let action: boolean = false;
            action = creepActions.actionRecycle(b, action);
            if (creepActions.canWork(b)) {
                // action = creepActions.actionMoveToRoom(b, action);
                if (b.room.controller && b.room.controller.ticksToDowngrade < 2000) {
                    action = creepActions.actionUpgrade(b, action);
                }
                if (this.roadsites.length > 0) {
                    const site = b.pos.findClosestByRange(this.roadsites);
                    action = creepActions.actionBuild(b, action, site);
                }
                action = creepActions.actionRepairStill(b, action);
                action = creepActions.actionRepairCache(b, action);
                action = creepActions.actionRepairRoad(b, action);
                action = creepActions.actionRepair(b, action);
                action = creepActions.actionUpgrade(b, action);
            } else {
                action = creepActions.actionGetStorageEnergy(b, action);
                action = creepActions.actionGetBatteryEnergy(b, action);
                // if (creep.room.energyCapacityAvailable < 550) {
                //   action = creepActions.actionGetDroppedEnergy(creep, action);
                //   action = creepActions.actionGetSourceEnergy(creep, action);
                // } else {
                //   action = creepActions.actionGetDroppedEnergy(creep, action);
                // }
                // action = creepActions.actionMoveToRoom(creep, action, creep.memory.home);
            }
        }
    }

    public runBuilders() {
        for (const b of this.builders) {
            let action: boolean = false;
            action = creepActions.actionRecycle(b, action);
            if (creepActions.canWork(b)) {
                // action = creepActions.actionMoveToRoom(b, action);
                if (b.room.controller && b.room.controller.ticksToDowngrade < 2000) {
                    action = creepActions.actionUpgrade(b, action);
                }
                if (this.prioritySites.length > 0) {
                    action = creepActions.actionBuild(b, action, this.prioritySites[0]);
                }
                action = creepActions.actionBuild(b, action);
                action = creepActions.actionRepair(b, action);
                action = creepActions.actionUpgrade(b, action);
            } else {
                action = creepActions.actionGetStorageEnergy(b, action);
                action = creepActions.actionGetBatteryEnergy(b, action);
                // if (creep.room.energyCapacityAvailable < 550) {
                //   action = creepActions.actionGetDroppedEnergy(creep, action);
                //   action = creepActions.actionGetSourceEnergy(creep, action);
                // } else {
                //   action = creepActions.actionGetDroppedEnergy(creep, action);
                // }
                // action = creepActions.actionMoveToRoom(creep, action, creep.memory.home);
            }
        }
    }


}
