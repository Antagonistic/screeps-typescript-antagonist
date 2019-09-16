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
        ;
    }
    public finalize(): void {
        ;
    }

}
