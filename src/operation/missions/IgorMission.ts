import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import { profile } from "Profiler";

@profile
export class IgorMission extends Mission {
    public igor: Creep[] = [];

    public factory?: StructureFactory;
    public labs?: StructureLab[];
    public active: boolean;

    public memory!: {
        factory?: Id<StructureFactory> | null;
        labs?: Array<Id<StructureLab>> | null;
    }

    constructor(operation: Operation) {
        super(operation, "igor");
        this.factory = this.getFactory();
        this.labs = this.getLabs();
        this.active = this.isActive();
    }

    public isActive() {
        if (this.factory || this.labs) { return true; }
        return false;
    }

    public getFactory() {
        if (this.memory.factory === null) { return undefined; }
        if (!this.memory.factory) {
            const factoryFound = _.first(this.spawnRoom.room.find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_FACTORY }));
            if (factoryFound) {
                this.memory.factory = factoryFound.id as Id<StructureFactory>;
            } else {
                this.memory.factory = null;
                return undefined;
            }
        }
        const factory = Game.getObjectById(this.memory.factory);
        if (!factory) {
            delete this.memory.factory;
            return undefined;
        }
        return factory;
    }

    public getLabs() {
        if (this.memory.labs === null) { return undefined; }
        if (!this.memory.labs) {
            const labsFound = this.spawnRoom.room.find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_LAB });
            if (labsFound && labsFound.length > 0) {
                this.memory.labs = labsFound.map(x => x.id) as Array<Id<StructureLab>>;
            } else {
                this.memory.labs = null;
                return undefined;
            }
        }
        const ret = [];
        for (const l of this.memory.labs) {
            const lab = Game.getObjectById(l);
            if (lab) {
                ret.push(lab);
            } else {
                // invalid lab, invalidate memory
                delete this.memory.labs;
                return undefined;
            }
        }
        return ret;
    }

    public initMission(): void {
        ;
    }
    public spawn(): void {
        ;
    }
    public work(): void {
        ;
    }

    public needIgor(): boolean {
        if (this.hasUnFilledQueue()) { return true; }
        return false;
    }

    public hasUnFilledQueue(): boolean {
        if (this.spawnRoom.room.memory.queueReaction) {
            for (const r of this.spawnRoom.room.memory.queueReaction) {
                const productBuilding = Game.getObjectById(r.product.building);
                if (!productBuilding) {
                    this.invalidateQueue();
                    return false;
                }
            }
        }
        return false;
    }

    public invalidateQueue(): void {
        ;
    }

    public finalize(): void {
        if (this.getSalt() % 1000 === 123) {
            delete this.memory.factory;
            delete this.memory.labs;
        }
    }
}
