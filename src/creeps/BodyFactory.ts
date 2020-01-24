import { SpawnRoom } from "rooms/SpawnRoom";

export class BodyFactory {
    public spawnRoom: SpawnRoom;
    constructor(spawnRoom: SpawnRoom) {
        this.spawnRoom = spawnRoom;
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

    protected workerBodyRoad(maxE: number = 1600): BodyPartConstant[] {
        const E: number = Math.min(this.spawnRoom.energyCapacityAvailable, maxE);
        const P = Math.floor(E / 200);
        return this.workerBody(P, P, P);

    }

    protected workerBodyOffRoad(maxE: number = 1750): BodyPartConstant[] {
        const E: number = Math.min(this.spawnRoom.energyCapacityAvailable, maxE);
        const P = Math.floor(E / 250);
        return this.workerBody(P, P, P * 2);
    }

    protected getHaulerBodyRoad(maxE: number = 800): BodyPartConstant[] {
        const E: number = Math.min(this.spawnRoom.energyCapacityAvailable, maxE);
        const P = Math.floor(E / 150);
        return this.workerBody(0, P * 2, P);
    }

    protected getHaulerBodyOffRoad(maxE: number = 800): BodyPartConstant[] {
        const E: number = Math.min(this.spawnRoom.energyCapacityAvailable, maxE);
        const P = Math.floor(E / 100);
        return this.workerBody(0, P, P);
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

    public getLongCartBody = () => {
        if (this.spawnRoom.energyCapacityAvailable >= 1800) {
            return this.workerBody(0, 20, 11);
        } else if (this.spawnRoom.energyCapacityAvailable >= 1500) {
            return this.workerBody(0, 15, 8);
        } else if (this.spawnRoom.energyCapacityAvailable >= 900) {
            // Huge hauler
            return this.workerBody(0, 10, 6);
        } else if (this.spawnRoom.energyCapacityAvailable >= 750) {
            // Big hauler
            return this.workerBody(0, 8, 5);
        } else if (this.spawnRoom.energyCapacityAvailable >= 450) {
            // Medium hauler
            return this.workerBody(0, 6, 3);
        } else {
            // Small hauler
            return this.workerBody(0, 4, 2);
        }
    }

    public getWarriorBody() {
        const bodyUnit = this.configBody({ [TOUGH]: 1, [ATTACK]: 5, [MOVE]: 6 });
        const maxUnits = Math.min(this.spawnRoom.maxUnits(bodyUnit), 4);
        return this.configBody({ [TOUGH]: maxUnits, [ATTACK]: maxUnits * 5, [MOVE]: maxUnits * 6 });
    }

    public getPriestBody() {
        const bodyUnit = this.configBody({ [TOUGH]: 1, [HEAL]: 5, [MOVE]: 6 });
        const maxUnits = Math.min(this.spawnRoom.maxUnits(bodyUnit), 4);
        return this.configBody({ [TOUGH]: maxUnits, [HEAL]: maxUnits * 5, [MOVE]: maxUnits * 6 });
    }
}
