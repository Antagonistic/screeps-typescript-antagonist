import { BodyFactory } from "creeps/BodyFactory";
import { Operation } from "operation/operations/Operation";
import { profile } from "Profiler";
import * as roomHelper from "rooms/roomHelper";
import { SpawnRoom } from "rooms/SpawnRoom";

@profile
export abstract class Mission extends BodyFactory {
    public name: string;
    public memory: any;
    // public spawnRoom: SpawnRoom;
    public operation: Operation;
    public hasVision: boolean;
    public room?: Room;
    public remoteSpawning: boolean;

    constructor(operation: Operation, name: string) {
        super(operation.spawnRoom);
        this.name = name;
        this.operation = operation;
        // this.spawnRoom = operation.spawnRoom;
        if (!operation.memory[name]) { operation.memory[name] = {}; }
        this.memory = operation.memory[name];
        if (!this.memory.hc) { this.memory.hc = {}; }
        this.room = operation.room;
        this.hasVision = this.room ? true : false;
        this.remoteSpawning = !this.room || this.room !== this.spawnRoom.room;
    }

    public abstract initMission(): void;
    public abstract spawn(): void;
    public abstract work(): void;
    public abstract finalize(): void;

    public spawnRole(role: string, max: () => number, getBody: () => BodyPartConstant[], memory?: any, prespawn?: number): Creep[] {
        // console.log("headcount " + role)
        if (!this.memory.hc[role]) { this.memory.hc[role] = this.findOrphans(role); }
        const creepNames = this.memory.hc[role] as string[];
        let count = 0;
        const ret: Creep[] = [];
        for (let i = 0; i < creepNames.length; i++) {
            const creepName = creepNames[i];
            const creep = Game.creeps[creepName];
            if (creep) {
                if (!creep.spawning) { ret.push(creep); }
                let ticksNeeded = 0;
                if (prespawn !== undefined) {
                    ticksNeeded += creep.body.length * 3;
                    ticksNeeded += prespawn;
                }
                if (!creep.ticksToLive || creep.ticksToLive > ticksNeeded) { count++; }
            } else {
                creepNames.splice(i, 1);
                delete Memory.creeps[creepName];
                i--;
            }
        }

        if (this.spawnRoom.isAvailable && count < max()) {
            // console.log("spawning new " + role);
            const newcreepName = `${this.operation.name}_${role}_${Memory.uuid % 100}`;
            const outcome = this.spawnRoom.spawn(getBody(), newcreepName, memory);
            if (outcome) {
                creepNames.push(newcreepName);
            }
        }
        this.memory.hc[role] = creepNames;

        return ret;
    }

    private findOrphans(roleName: string) {
        const creepNames = [];
        for (const creepName in Game.creeps) {
            if (creepName.indexOf(this.operation.name + "_" + roleName + "_") > -1) {
                creepNames.push(creepName);
            }
        }
        return creepNames;
    }

    public buildRoads(path: RoomPosition[]): boolean {
        let action = false;

        for (const pos of path) {
            let pass = false;
            if (pos.lookFor(LOOK_STRUCTURES).length > 0) {
                // Has a structure
                pass = true;
            }
            if (pos.lookFor(LOOK_CONSTRUCTION_SITES).length > 0) {
                // Has a construction site
                pass = true;
            }
            if (!pass) {
                if (pos.createConstructionSite(STRUCTURE_ROAD) === OK) {
                    action = true;
                }
            }
        }
        return action;
    }

    public needEmergencyRefill(): boolean {
        if (this.remoteSpawning) { return false; }
        if (this.room && this.room.storage && this.room.find(FIND_MY_CREEPS, { filter: x => x.memory.role === "refill" }).length === 0) { return true; }
        if (this.room && this.room.find(FIND_MY_CREEPS, { filter: x => x.memory.role === "hauler" }).length === 0) { return true; }
        return false;
    }

    /*public processRoomScout(room: Room): void {
        const flags = room.flags;
        if (!flags || flags.length === 0) {
            if (room.reserved === 'Invader') {
                const core = _.head(room.find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_INVADER_CORE }));
                if (core) {
                    room.createFlag(core.pos.x, core.pos.y, "invader_" + room.name);
                }
            } else {
                if (!room.memory.avoid) {
                    const type = roomHelper.roomType(room.name);
                    if (type === 'SK') {
                        ;
                    }
                    if (type === 'CTRL') {
                        if (room.find(FIND_SOURCES).length > 0) {
                            // potential remote mining
                            if (room.memory.home) {
                                if (!room.dangerousHostiles &&
                                    !room.owner && !room.reserved) {
                                    const spawnRoom = global.emp.getSpawnRoom(room.memory.home) as SpawnRoom;
                                    if (spawnRoom.room.memory.neighbors && spawnRoom.room.memory.neighbors.find(x => x === room.name)) {
                                        // Neighbor clear room!
                                        room.createFlag(25, 25, "mining_" + room.name);
                                        console.log('Creating remote mining room ' + room.name);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
}*/
}
