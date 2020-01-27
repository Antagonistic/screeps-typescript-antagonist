import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import { TargetAction } from "config/config";
import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";

@profile
export class UpgradeMission extends Mission {

    public upgraders: Creep[] = [];
    public haulers: Creep[] = [];
    public container?: StructureContainer | StructureLink;
    public isLink: boolean;
    public storage?: StructureStorage;
    public controller?: StructureController;
    public _hasEnergy: boolean;

    constructor(operation: Operation) {
        super(operation, "upgrade")
        if (this.room) {
            this.controller = this.room.controller;
            this.container = this.findContainer();
        }
        this.isLink = false;
        this._hasEnergy = this.hasEnergy();
    }
    public initMission(): void {
        if (!this.room) { return; }
        if (this.container) {
            this.room.memory.battery = this.container.id;
        }
    }
    public spawn(): void {
        this.upgraders = this.spawnRole(this.name, this.getMaxUpgraders, this.getUpgraderBody, { role: "upgrader" });

        this.haulers = this.spawnRole(this.name + "cart", this.getMaxCarts, this.getCartBody, { role: "upgrader_cart" });

        /*if (Game.time % 50 === 20) {
            if (this.operation.stableOperation) {
                if (this.buildRoads(this.haulPath())) {
                    console.log("Building controller roads!");
                }
            }
        }*/
        // console.log("upgrade carts: " + numCarts() + " " + this.haulers.length + " " + this.haulers[0].name);
    }
    public work(): void {
        // for (const u of this.upgraders) {
        // upgrader.run(u);
        // }
        this.runUpgraders(this.upgraders);
        this.runHaulers(this.haulers);
    }
    public finalize(): void {
        if (Game.time % 1000 === 921) {
            this.memory.isSigned = undefined;
        }
    }

    public getUpgraderBody = (): BodyPartConstant[] => {
        if (this.spawnRoom.rclLevel === 8) {
            return this.workerBody(15, 6, 8);
        }
        const energyAvailable: number = this.spawnRoom.energyCapacityAvailable;
        if (energyAvailable >= 1300) {
            return this.workerBody(8, 4, 4);
        } else if (energyAvailable >= 650) {
            return this.workerBody(4, 3, 2);
        } else if (energyAvailable >= 550) {
            return this.workerBody(3, 3, 2);
        } else if (energyAvailable >= 400) {
            return this.workerBody(2, 2, 1);
        } else {
            return this.workerBody(2, 1, 1);
        }
    }

    public getMaxCarts = (): number => {
        if (!this.room || !this.controller || !this.container) { return 0; }
        // if (this.controller.ticksToDowngrade < 10000) { return 1; }
        if (this.isLink) { return 0; }
        if (this.controller.level >= 4 && this.room.storage) {
            if (this.room.storage.store.energy > 10000) {
                return 1;
            } else {
                return 0;
            }
        }
        // if (this.controller.level === 8) { return 1; }
        return 0;

    }

    public getMaxUpgraders = (): number => {
        if (this.spawnRoom.rclLevel === 8) { return 1; };
        if (!this._hasEnergy) { return 0; }
        if (this.room && this.room.controller && this.room.controller.level < 2) {
            return 1;
        }
        let numUpgraders = 2;
        if (this.room && this.room.storage) {
            const energy: number | undefined = this.room.storage.store.energy;
            if (energy) {
                if (energy > 100000) {
                    numUpgraders += 2;
                } else if (energy > 50000) {
                    numUpgraders += 1;
                } else if (energy > 30000) {
                    numUpgraders += 1;
                } else if (energy > 20000) {
                    numUpgraders += 0;
                } else if (energy > 10000) {
                    numUpgraders += 0;
                }
            }
        }
        return numUpgraders;
    }

    public haulPath = (): RoomPosition[] => {
        if (this.controller) {
            let goal;
            if (this.storage) {
                goal = { pos: this.storage.pos, range: 1 }
            } else {
                goal = { pos: this.spawnRoom.spawns[0].pos, range: 1 }
            }
            const path = PathFinder.search(this.controller.pos, goal).path;
            return path;
        }
        return [];
    }

    public hasEnergy(): boolean {
        // console.log(JSON.stringify(this.container));
        if (!this.container) { return false; }
        if (this.room && this.room.controller && this.room.controller.ticksToDowngrade < 5000) { return true; }
        if (this.room && this.room.storage && this.room.storage.store.energy < 10000) { return false; }
        if (this.container.structureType === STRUCTURE_LINK) {
            if (this.container.energy > 10) { return true; }
        }
        if (this.container.structureType === STRUCTURE_CONTAINER) {
            if (this.container.store.energy > 10) { return true; }
        }
        return false;
    }

    public isSigned(): boolean {
        if (this.memory.isSigned === undefined) {
            if (!this.controller) { this.memory.isSigned = true; }
            else { this.memory.isSigned = this.controller.sign === Memory.sign; }
        }
        return this.memory.isSigned;
    }

    public runUpgraders(creeps: Creep[]): void {
        for (const u of this.upgraders) {
            // let action: boolean = false;
            // action = creepActions.actionRenew(creep, action);
            if (!this.controller) { continue; }

            if (!u.action && creepActions.canWork(u)) {
                // console.log("foo!");
                u.actionTarget();
                if (!this.isSigned()) {
                    u.setTarget(this.controller, TargetAction.SIGN);
                }
                if (!this.container) {
                    u.action = creepActions.actionBuildStill(u, u.action);
                    u.action = creepActions.actionRepairStill(u, u.action);
                }
                u.action = creepActions.actionUpgrade(u, u.action);
                u.setTarget(this.controller, TargetAction.PRAISE);
                if (u.carry.energy === 0) { u.memory.working = false; }
            } else {
                // action = creepActions.actionGetStorageEnergy(u, action, 4);
                if (this._hasEnergy) {
                    creepActions.moveToWithdraw(u, this.container!);
                }
                // if (creep.room.energyCapacityAvailable < 550) {
                //   action = creepActions.actionGetSourceEnergy(creep, action, 2);
                // }
                // action = creepActions.actionGetDroppedEnergy(creep, action, false);
            }
        }
    }

    public runHaulers(creeps: Creep[]): void {
        for (const h of this.haulers) {

            // let action: boolean = false;
            h.action = creepActions.actionRecycle(h, h.action);

            if (!h.action && creepActions.canWork(h)) {
                if (this.container) {
                    h.action = creepActions.actionTransfer(h, h.action, this.container);
                } else {
                    if (!h.action) { creepActions.moveTo(h, this.operation.rallyPos); };
                }
            } else {
                h.action = creepActions.actionGetStorageEnergy(h, h.action, 20);
                if (!h.action) { creepActions.moveTo(h, this.operation.rallyPos); };
                // if (!h.action) { h.action = this.operation.creepGetEnergy(h, h.action, true, true); };
            }
        }
    }

    public findContainer(): StructureContainer | StructureLink | undefined {

        if (!this.room || !this.controller) { return undefined; }
        let ret: StructureContainer | StructureLink | undefined | null;
        if (this.room.memory.controllerBattery && Game.time % 1000 !== 77) {
            ret = Game.getObjectById(this.room.memory.controllerBattery);
            if (!ret) {
                this.room.memory.controllerBattery = undefined;
            } else {
                if (ret.structureType === STRUCTURE_LINK) { this.isLink = true; }
                return ret;
            }
        }

        const containers = this.controller.pos.findInRange<StructureContainer | StructureLink>(FIND_STRUCTURES, 3,
            { filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER || x.structureType === STRUCTURE_LINK });

        if (!containers || containers.length === 0) {
            this.placeContainer();
        }
        for (const c of containers) {
            ret = c;
            if (ret.structureType === STRUCTURE_LINK) {
                this.isLink = true;
                break;
            }
        }
        if (ret) {
            this.room.memory.controllerBattery = ret.id;
            return ret;
        }
        return undefined;
    }


    public placeContainer(): void {
        if (!this.controller) { return; }
        const boxSite: ConstructionSite[] = this.controller.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 4,
            { filter: (x: ConstructionSite) => x.structureType === STRUCTURE_CONTAINER });
        if (!boxSite || boxSite.length === 0) {
            const pos = this.haulPath()[1];
            const ret = pos.createConstructionSite(STRUCTURE_CONTAINER);
            if (ret !== OK) {
                console.log("Placing upgrade box error: " + ret + " in " + this.operation.roomName + " pos : " + pos.x + "," + pos.y);
            }
            return;
        }
    }

}
