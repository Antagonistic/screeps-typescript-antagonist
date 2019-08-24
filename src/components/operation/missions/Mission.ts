import { Operation } from "../operations/Operation";
import { SpawnRoom } from "components/rooms/SpawnRoom";

export abstract class Mission {
    name: string;
    memory: any;
    spawnRoom: SpawnRoom;
    operation: Operation;
    hasVision: boolean;
    room?: Room;
    remoteSpawning: boolean;
    constructor(operation: Operation, name: string) {
        this.name = name;
        this.operation = operation;
        this.spawnRoom = operation.spawnRoom;
        if (!operation.memory[name]) operation.memory[name] = {};
        this.memory = operation.memory[name];
        if (!this.memory.hc) this.memory.hc = {};
        this.room = operation.room;
        this.hasVision = this.room ? true : false;
        this.remoteSpawning = false;
    }

    public abstract initMission(): void;
    public abstract spawn(): void;
    public abstract work(): void;
    public abstract finalize(): void;

    spawnRole(role: string, max: number, getBody: () => BodyPartConstant[]): Creep[] {
        // console.log("headcount " + role)
        if (!this.memory.hc[role]) this.memory.hc[role] = [];
        let creepNames = this.memory.hc[role] as string[];
        let count = 0;
        let ret: Creep[] = [];
        for (let i = 0; i < creepNames.length; i++) {
            let creepName = creepNames[i];
            let creep = Game.creeps[creepName];
            if (creep) {
                if (!creep.spawning) ret.push(creep);
                count++;
            } else {
                creepNames.splice(i, 1);
                delete Memory.creeps[creepName];
                i--;
            }
        }

        if (count < max && this.spawnRoom.isAvailable) {
            // console.log("spawning new " + role);
            let newcreepName = `${this.operation.name}_${role}_${Math.floor(Math.random() * 100)}`;
            let outcome = this.spawnRoom.spawn(getBody(), newcreepName);
            if (outcome) {
                creepNames.push(newcreepName);
                console.log("spawning " + newcreepName);
            }
        }
        this.memory.hc[role] = creepNames;

        return ret;
    }


    protected workerBody(workCount: number, carryCount: number, movecount: number): BodyPartConstant[] {
        let body: BodyPartConstant[] = [];
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
        let body: BodyPartConstant[] = [];
        for (let partType in config) {
            let amount = config[partType];
            for (let i = 0; i < amount; i++) {
                body.push(partType as BodyPartConstant);
            }
        }
        return body;
    }
}
