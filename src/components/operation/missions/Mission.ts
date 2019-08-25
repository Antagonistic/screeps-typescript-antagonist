import { SpawnRoom } from "components/rooms/SpawnRoom";
import { Operation } from "../operations/Operation";

export abstract class Mission {
    public name: string;
    public memory: any;
    public spawnRoom: SpawnRoom;
    public operation: Operation;
    public hasVision: boolean;
    public room?: Room;
    public remoteSpawning: boolean;
    constructor(operation: Operation, name: string) {
        this.name = name;
        this.operation = operation;
        this.spawnRoom = operation.spawnRoom;
        if (!operation.memory[name]) { operation.memory[name] = {}; }
        this.memory = operation.memory[name];
        if (!this.memory.hc) { this.memory.hc = {}; }
        this.room = operation.room;
        this.hasVision = this.room ? true : false;
        this.remoteSpawning = false;
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
                console.log("spawning " + newcreepName);
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


    protected workerBody(workCount: number, carryCount: number, movecount: number): BodyPartConstant[] {
        const body: BodyPartConstant[] = [];
        for (let i = 0; i < workCount; i++) {
            body.push(WORK);
        }
        for (let j = 0; j < carryCount; j++) {
            body.push(CARRY);
        }
        for (let k = 0; k < movecount; k++) {
            body.push(MOVE);
        }
        return body;
    }

    protected configBody(config: { [partType: string]: number }): BodyPartConstant[] {
        const body: BodyPartConstant[] = [];
        for (const partType in config) {
            const amount = config[partType];
            for (let i = 0; i < amount; i++) {
                body.push(partType as BodyPartConstant);
            }
        }
        return body;
    }

    public getCartBody = () => {
        if (this.spawnRoom.energyCapacityAvailable >= 750) {
            // Huge hauler
            return this.workerBody(0, 10, 5);
        } else if (this.spawnRoom.energyCapacityAvailable >= 600) {
            // Big hauler
            return this.workerBody(0, 8, 4);
        } else if (this.spawnRoom.energyCapacityAvailable >= 450) {
            // Medium hauler
            return this.workerBody(0, 6, 3);
        } else {
            // Small hauler
            return this.workerBody(0, 4, 2);
        }
    };
}
