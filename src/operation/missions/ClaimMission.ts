import { Operation } from "../operations/Operation";
import { Mission } from "./Mission";

import { BodyFactory } from "creeps/BodyFactory";
import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";
import { buildHelper } from "rooms/buildHelper";
import { roomHelper } from "rooms/roomHelper";

@profile
export class ClaimMission extends Mission {
    public claimers: Creep[] = [];
    public roomName: string;
    public controller?: StructureController;
    public signed: boolean;

    constructor(operation: Operation) {
        super(operation, "reserve");
        this.roomName = this.operation.roomName;
        if (this.room && this.room.controller) {
            this.controller = this.room.controller;
            this.signed = (this.controller.sign !== undefined && this.controller.sign.text === Memory.sign);
        } else {
            this.signed = false;
        }
    }

    public initMission(): void {
        ;
    }
    public spawn(): void {
        this.claimers = this.spawnRole("claim", () => this.maxClaimers(), this.claimBody);
    }

    public maxClaimers() {
        if (Game.cpu.bucket < 9000) { return 0; }
        if (!this.controller || this.controller.my) { return 0; }
        if (this.room!.dangerousHostiles.length === 0 && this.spawnRoom.availableSpawnEnergy >= 650) { return 1; }
        return 0;
    }

    public work(): void {
        if (this.controller) {
            for (const creep of this.claimers) {
                if (!this.controller.my) {
                    if (this.room && this.controller) {
                        creepActions.moveToClaim(creep, this.controller);
                    } else {
                        creepActions.moveTo(creep, this.operation.flag.pos);
                    }
                }
                else {
                    // We've claimed, need a spawn
                    if (this.room) {
                        this.clearRoom();
                        if (!this.signed) {
                            if (creep.pos.isNearTo(this.controller)) {
                                creep.signController(this.controller, Memory.sign);
                            } else {
                                creepActions.moveTo(creep, this.controller);
                            }
                        } else {
                            const ret = buildHelper.buildIfNotExist(this.operation.flag.pos, STRUCTURE_SPAWN);
                            if (ret === OK) {
                                creep.suicide();
                            }
                        }
                    }
                }
            }
        }
    }

    public finalize(): void {
        if (this.room && Game.time % 100 === 32) {
            if (this.room.find(FIND_MY_SPAWNS).length === 0) {
                const ret = buildHelper.buildIfNotExist(this.operation.flag.pos, STRUCTURE_SPAWN);
            }
        }
    }

    public claimBody = (): BodyPartConstant[] => BodyFactory.configBody({ claim: 1, move: 1 });

    public clearRoom(): void {
        if (this.room && this.room.controller && this.room.controller.my) {
            const struct = this.room.find(FIND_STRUCTURES);
            for (const s of struct) {
                switch (s.structureType) {
                    case STRUCTURE_CONTROLLER: {
                        continue;
                    }
                    case STRUCTURE_CONTAINER: {
                        continue;
                    }
                    case STRUCTURE_ROAD: {
                        continue;
                    }
                    case STRUCTURE_STORAGE: {
                        continue;
                    }
                    case STRUCTURE_TERMINAL: {
                        continue;
                    }
                    default: {
                        if (s instanceof OwnedStructure) {
                            if (s.my) {
                                continue;
                            }
                        }
                        s.destroy();
                    }
                }
            }
        }
    }
}
