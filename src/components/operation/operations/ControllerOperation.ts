import { Operation } from "./Operation";

import { log } from "lib/logger/log";
import { EmergencyMission } from "../missions/EmergencyMission";
import { MiningMission } from "../missions/MiningMission";
import { GuardMission } from "../missions/GuardMission";

export class ControllerOperation extends Operation {
    sources: Source[] = [];
    emergency: boolean;

    constructor(flag: Flag, name: string, type: string) {
        super(flag, name, type)
        if (flag.room) {
            this.sources = _.sortBy(flag.room.find(FIND_SOURCES), (s: Source) => s.pos.getRangeTo(flag));
        }
        this.emergency = this.memory.emergency;
    }

    initOperation() {
        this.addMission(new EmergencyMission(this, this.emergency));

        this.addMission(new GuardMission(this));

        for (let i = 0; i < this.sources.length; i++) {
            this.addMission(new MiningMission(this, "mining" + i, this.sources[i]))
        }

    }

    finalizeOperation() {
        this.memory.emergency = !this.findMinersBySources();
    }

    private findMinersBySources() {
        for (let source of this.sources) {
            if (source.pos.findInRange(FIND_MY_CREEPS, 1).length > 0) {
                return true;
            }
        }
        return false;
    }


}

export function initNewControllerOperation(room: Room): void {
    if (room.controller && room.controller.my) {
        let pos: RoomPosition = room.controller.pos;
        let name = room.createFlag(pos.x, pos.y, "controller_" + room.name, 1, 2)
        if (name == ERR_NAME_EXISTS || name == ERR_INVALID_ARGS) {
            log.error("Error initializing new controller operation!")
        }
    }
}
