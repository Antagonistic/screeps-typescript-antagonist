import { GuardMission } from "operation/missions/GuardMission";
import { LootMission } from "operation/missions/LootMission";
import { PairAttackMission } from "operation/missions/PairAttackMission";
import { ScoutMission } from "operation/missions/ScoutMission";
import { Traveler } from "utils/Traveler";
import { Operation, OperationPriority } from "./Operation";
import { EnergyState } from "config/Constants";

const FIND_DEPOSITS: FindConstant = 122;

export class InvaderOperation extends Operation {
    public core?: StructureInvaderCore;
    public ruin?: Ruin;
    public level: number;
    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
        this.level = this.memory.level;
    }

    public getActive(): boolean {
        if (Game.cpu.bucket < 9000) { return false; }
        if (this.getToHomeRange() > 2) { return false; }
        if (this.spawnRoom.room.energyState === EnergyState.CRITICAL) { return false; }
        if (this.level > 0) { return false; }
        if (this.spawnRoom.energyCapacityAvailable < 1200) { return false; }
        if (this.spawnRoom.rclLevel < 4 || !this.spawnRoom.room.storage || this.spawnRoom.room.storage.store.energy < 20000) { return false; }
        return true;
    }

    public initOperation(): void {
        if (this.getToHomeRange() <= 2) {
            this.addMission(new ScoutMission(this));
        }
        if (this.room) {
            const core = this.room.find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_INVADER_CORE }) as StructureInvaderCore[];
            if (!core || core.length === 0) {
                // Invader decayed, end operation
                const ruin = this.room.find(FIND_RUINS, { filter: x => x.store.getUsedCapacity() > 0 }) as Ruin[];
                if (!ruin || ruin.length === 0) {
                    this.ended = true;
                }

            } else {
                this.core = core[0];
                this.level = this.memory.level = core[0].level;
            }
            if (this.getActive()) {
                // this.addMission(new PairAttackMission(this, "att", this.core));
                this.addMission(new GuardMission(this, !this.ended));
                this.addMission(new LootMission(this, "loot", this.ruin));
            }
        }
    }
    public finalizeOperation(): void {
        if (this.ended) {
            let canEnd = true;
            for (const m in this.missions) {
                const _m = this.missions[m];
                if (_m instanceof PairAttackMission) {
                    if (_m.warrior.length > 0) {
                        canEnd = false;
                    }
                    if (_m.priest.length > 0) {
                        canEnd = false;
                    }
                }
                if (_m instanceof GuardMission) {
                    if (_m.defenders.length > 0) {
                        for (const d of _m.defenders) {
                            d.memory.recycle = true;
                        }
                    }
                }
                if (_m instanceof LootMission) {
                    if (_m.carts.length > 0) {
                        canEnd = false;
                    }
                }
            }
            if (canEnd) {
                this.flag.remove();
            }
        }
    }
};
