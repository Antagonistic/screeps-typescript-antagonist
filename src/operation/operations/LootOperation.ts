import { LootMission } from "operation/missions/LootMission";
import { ScoutMission } from "operation/missions/ScoutMission";
import { Operation } from "./Operation";

export class LootOperation extends Operation {
    public target?: Structure;
    public hasRampart: boolean;
    public isBlocked: boolean;
    public haulTo?: Structure;
    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
        this.hasRampart = false;
        this.isBlocked = false;
        if (this.room) {
            const targets = this.flag.pos.lookFor("structure");
            for (const t of targets) {
                if (t.structureType === "road") {
                    continue;
                } else if (t.structureType === "rampart") {
                    this.hasRampart = true;
                } else {
                    this.target = t;
                }
            }
        }

        if (this.spawnRoom.room.storage) {
            this.haulTo = this.spawnRoom.room.storage;
        } else {
            for (const sR in global.emp.spawnRooms) {
                // console.log(global.emp.spawnRooms[sR].room);
                if (global.emp.spawnRooms[sR] && global.emp.spawnRooms[sR].room && global.emp.spawnRooms[sR].room.storage) {
                    this.haulTo = global.emp.spawnRooms[sR].room.storage;
                }
            }
        }
    }

    public initOperation(): void {
        this.addMission(new ScoutMission(this));

        if (this.target && !this.hasRampart) {
            this.addMission(new LootMission(this, "loot", this.target, this.haulTo));
        }
    }
    public finalizeOperation(): void {
        ;
    }

    public hasLoot(target: Structure) {
        if (target instanceof StructureTerminal || target instanceof StructureStorage) {
            if (_.sum(target.store) < 10) {
                return false;
            }
        }
        return true;
    }

}
