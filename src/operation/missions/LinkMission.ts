import { Operation } from "operation/operations/Operation";
import { Mission } from "./Mission";

export class LinkMission extends Mission {
    public links: StructureLink[] = [];
    public cLink?: StructureLink;
    public sLink?: StructureLink;
    constructor(operation: Operation) {
        super(operation, "link");
        if (this.room && this.room.controller && this.room.storage) {
            const _links = this.room.find<StructureLink>(FIND_MY_STRUCTURES, { filter: x => x.structureType === STRUCTURE_LINK });
            const storage = this.room.storage;
            const controller = this.room.controller;
            for (const l of _links) {
                if (l.pos.inRangeTo(controller.pos, 2)) {
                    this.cLink = l;
                } else {
                    if (l.pos.inRangeTo(storage, 2)) {
                        this.sLink = l;
                    } else {
                        this.links.push(l);
                    }
                }
            }
        }
    }

    public initMission(): void {
        ;
    }
    public spawn(): void {
        ;
    }
    public work(): void {
        for (const l of this.links) {
            if (!l.cooldown && l.energy > 200) {
                // Need to send energy
                if (this.cLink && this.cLink.energy <= 600) {
                    l.transferEnergy(this.cLink);
                } else {
                    if (this.sLink && this.sLink.energy <= 600) {
                        l.transferEnergy(this.sLink);
                    } else {
                        // Nowhere to send
                    }
                }
            }
        }
        if (this.cLink && this.cLink.energy < 700) {
            if (this.sLink && this.sLink.energy >= 400) {
                this.sLink.transferEnergy(this.cLink);
            }
        }
    }
    public finalize(): void {
        ;
    }

}
