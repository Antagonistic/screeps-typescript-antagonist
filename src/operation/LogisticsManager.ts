import { SpawnRoom } from "rooms/SpawnRoom";
import { ControllerOperation } from "./operations/ControllerOperation";
import { Operation } from "./operations/Operation";

import { BuilderMission } from "./missions/BuilderMission";
import { MineralMission } from "./missions/MineralMission";
import { MiningMission } from "./missions/MiningMission";
import { UpgradeMission } from "./missions/UpgradeMission";

import { Empire } from "Empire";
import { TerminalNetwork } from "market/TerminalNetwork";
import { HUD } from "rooms/HUD";
import { roadHelper } from "rooms/roadHelper";
import { roomHelper } from "rooms/roomHelper";
import { EnergyState, EnergyStateString } from "config/Constants";
import { stat } from "fs";

export class LogisticsManager {
    public spawnRoom: SpawnRoom;
    public room: Room;
    public operations: Operation[] = [];
    public E: number;
    public C: number;
    public S: number;
    public storage: StructureStorage | undefined;
    public terminal: StructureTerminal | undefined;
    public terminalNetwork: TerminalNetwork;
    public links: StructureLink[] = [];
    public haslinks: boolean;
    public sources: number = 0;
    public remoteSources: number = 0;
    public bootStrap: boolean;
    private _energy?: number;
    constructor(spawnRoom: SpawnRoom) {
        this.spawnRoom = spawnRoom;
        this.room = spawnRoom.room;
        this.E = this.spawnRoom.availableSpawnEnergy;
        this.C = this.spawnRoom.energyCapacityAvailable;
        this.storage = this.room.storage;
        this.terminal = this.room.terminal;
        this.S = (this.storage) ? this.storage.store.energy : 0;
        this.links = this.room.find<StructureLink>(FIND_MY_STRUCTURES, { filter: x => x.structureType === STRUCTURE_LINK });
        this.haslinks = this.links.length > 0;
        if (Game.time % 5008 === 0) {
            this.room.memory.dest = undefined;
        }
        this.bootStrap = (this.room.find(FIND_MY_CREEPS).length < 4 && this.E < 900) || this.room.find(FIND_MY_CREEPS).length === 0;
        this.terminalNetwork = (global.emp as Empire).termNetwork;
    }

    public needRefill() {
        if (this.room.storage && this.room.find(FIND_MY_CREEPS, { filter: x => x.memory.role === "refill" }).length === 0) {
            return true;
        }
        return false;
    }

    public registerOperation(operation: Operation) {
        this.operations.push(operation);
    }

    public getDestinations(): RoomPosition[] {
        if (this.room.memory.dest && this.room.memory.dest.length > 0) {
            return roomHelper.deserializeRoomPositions(this.room.memory.dest);
        }
        const dest: RoomPosition[] = [];
        for (const op of this.operations) {
            // console.log('Checking ' + op.type + ' ' + op.name);
            for (const _m in op.missions) {
                const m = op.missions[_m];
                if (m instanceof MiningMission) {
                    if (m.remoteSpawning && this.room.memory.noRemote) { continue; }
                    // console.log('  Checking ' + m.name);
                    if (m.source) {
                        dest.push(m.source.pos);
                    }
                }
                if (m instanceof UpgradeMission) {
                    if (m.container) {
                        dest.push(m.container.pos);
                    }
                }
                if (m instanceof MineralMission) {
                    if (m.mineral) {
                        dest.push(m.mineral.pos);
                    }
                }
            }
        }
        this.room.memory.dest = dest;
        return dest;
    }

    public getTerminalEnergyFloat() {
        if (!this.room.storage || !this.room.terminal) { return 0; }
        if (this.room.storage.store.energy <= 15000) { return 1000; }
        if (this.room.storage.store.energy <= 100000) { return 10000; }
        return 100000;
    }

    public registerSource(remote: boolean = false) {
        if (remote) { this.remoteSources++; }
        else { this.sources++; }
    }

    public energy() {
        if (!this._energy) {
            const controllerBattery = this.room.memory.controllerBattery ? Game.getObjectById(this.room.memory.controllerBattery) : null;
            const controllerEnergy = (controllerBattery && (controllerBattery.structureType !== STRUCTURE_STORAGE) ? controllerBattery.store.energy : 0) ?? 0;
            const energy = this.E + (this.storage?.store.energy || 0) + (this.terminal?.store.energy || 0) + controllerEnergy;
            this.room.memory.lastEnergy = this._energy = energy;
        }
        return this._energy;
    }

    public healthyLinks() {
        if (!this.room.storage) { return false; }
        if (!this.room.memory.sLink) { return false; }
        if (!this.room.memory.cLink) { return false; }
        return true;
    }

    public isLowEnergy() {
        if (this.spawnRoom.rclLevel < 4) { return false; }
        const state = this.room.energyState;
        if (state === EnergyState.CRITICAL || state === EnergyState.LOW) { return true; }
        return false;
    }

    public getEstimatedUpgraderWork() {
        if (this.spawnRoom.rclLevel === 8) { return 15; }
        let work = this.sources * 6 + this.remoteSources * 3;
        //if (this.storage && this.isLowEnergy()) { work = work / 2; }
        //if (this.storage && this.storage.store.energy < 5000) { work = work / 2; }
        if (this.room.energyState === EnergyState.LOW) { work = work / 2; }
        if (this.room.energyState === EnergyState.CRITICAL) { work = 2; }
        // if (Game.time % 10 === 0) {
        // console.log('LOGIC: ' + this.room + ' estimates ' + work + ' upgrade parts.');
        // }
        return Math.min(Math.max(work, 1), 21);
    }

    public report(): void {
        const con = this.room.controller;
        const levelPart = con ? (con.progress / con.progressTotal) * 100 : 0;
        console.log("Logistics report for spawnRoom " + this.room.name + " Level " + this.spawnRoom.rclLevel + "." + levelPart);
        console.log("E: " + this.E + "/" + this.C + "  S: " + this.S);
        for (const op of this.operations) {
            console.log(" - " + op.name);
            for (const _m in op.missions) {
                const m = op.missions[_m];
                console.log("  * " + m.name);
                if (typeof m.report === "function") { m.report(); }
                if (m instanceof MiningMission) { this.reportMiningMission(m); }
                if (m instanceof UpgradeMission) { this.reportUpgraderMission(m); }
                if (m instanceof BuilderMission) { this.reportBuilderMission(m); }
            }
        }
    }

    public reportMiningMission(m: MiningMission): void {
        const numWork = _.sum(m.miners, (x: Creep) => x.getActiveBodyparts(WORK));
        const numCarry = _.sum(m.carts, (x: Creep) => x.getActiveBodyparts(CARRY));
        console.log("   Stable?   : " + m.stableMission);
        console.log("   Link?     : " + m.isLink);
        console.log("   Miners    : " + m.miners.length + " W: " + numWork);
        console.log("   Haulers   : " + m.carts.length + " C: " + numCarry);
    }

    public reportUpgraderMission(m: UpgradeMission): void {
        const numWork = _.sum(m.upgraders, (x: Creep) => x.getActiveBodyparts(WORK));
        const numCarry = _.sum(m.haulers, (x: Creep) => x.getActiveBodyparts(CARRY));
        console.log("   Link?     : " + m.isLink);
        console.log("   Upgraders : " + m.upgraders.length + " W: " + numWork);
        console.log("   Haulers   : " + m.haulers.length + " C: " + numCarry);
    }

    public reportBuilderMission(m: BuilderMission): void {
        const numBuild = _.sum(m.builders, (x: Creep) => x.getActiveBodyparts(WORK));
        const numPave = _.sum(m.pavers, (x: Creep) => x.getActiveBodyparts(WORK));
        console.log("   Builders  : " + m.builders.length + " W: " + numBuild);
        console.log("   Pavers    : " + m.pavers.length + " C: " + numPave);
    }

    public finalize(): void {
        if (this.operations.length === 0) {
            // No operations for this spawngroup? Fix it!
            console.log("No operations for this spawngroup? Fix it!");
            ControllerOperation.initNewControllerOperation(this.room, this.spawnRoom.spawns[0].pos);
        }
        if (Game.cpu.bucket > 3000) {
            // new HUD().runControlledRoom(this.room);
            if ((Game.time + this.room.UUID) % 30 === 0 && this.terminal) {
                this.terminalNetwork.runTerminal(this.terminal);
            }
        }
        if (Game.time % 100 === 51) {
            this.updateEnergyState();
        }

    }

    public updateEnergyState() {
        if (this.spawnRoom.rclLevel <= 4 && !this.storage) { this.room.energyState = EnergyState.NORMAL; return; }
        if (this.spawnRoom.rclLevel >= 6 && !this.storage) { this.room.energyState = EnergyState.CRITICAL; return; }
        const prevState = this.room.energyState;
        switch (prevState) {
            case EnergyState.UNKNOWN: {
                if (this.energy() < 5000) { this.room.energyState = EnergyState.CRITICAL; break; }
                if (this.energy() < 15000) { this.room.energyState = EnergyState.LOW; break; }
                if (this.energy() > 700000) { this.room.energyState = EnergyState.EXCESS; break; }
                this.room.energyState = EnergyState.NORMAL; break;
            }
            case EnergyState.CRITICAL: {
                if (this.energy() > 20000) { this.room.energyState = EnergyState.LOW; break; }
            }
            case EnergyState.LOW: {

                if (this.energy() < 10000) { this.room.energyState = EnergyState.CRITICAL; break; }
                if (this.energy() > 50000) { this.room.energyState = EnergyState.NORMAL; break; }
            }
            case EnergyState.NORMAL: {
                if (this.energy() < 30000) { this.room.energyState = EnergyState.LOW; break; }
                if (this.energy() > 800000) { this.room.energyState = EnergyState.EXCESS; break; }
            }
            case EnergyState.EXCESS: {
                if (this.energy() > 500000) { this.room.energyState = EnergyState.EXCESS; break; }
            }
        }
        if (this.room.energyState !== prevState) {
            console.log(`LOGISTICS: ${this.room.print} State moved from ${EnergyStateString[prevState]} to ${EnergyStateString[this.room.energyState]} - energy: ${this.energy()}/${this.S}`);
        }
    }

}
