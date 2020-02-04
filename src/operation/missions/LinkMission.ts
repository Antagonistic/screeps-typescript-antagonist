import { Operation } from "operation/operations/Operation";
import { profile } from "Profiler";
import { Mission } from "./Mission";

@profile
export class LinkMission extends Mission {
    public links: StructureLink[] = [];
    public cLink?: StructureLink;
    public sLink?: StructureLink;
    public active: boolean = false;
    constructor(operation: Operation) {
        super(operation, "link");
        this.initLinks();
    }

    public initLinks() {
        if (!this.memory.init) {
            if (!this.room || !this.room.controller || !this.room.storage) {
                return;
            }
            const _links = this.room.find<StructureLink>(FIND_MY_STRUCTURES, { filter: x => x.structureType === STRUCTURE_LINK });
            const storage = this.room.storage;
            const controller = this.room.controller;
            this.memory.links = [];
            for (const l of _links) {
                if (l.pos.inRangeTo(controller.pos, 3)) {
                    this.memory.cLink = l.id;
                } else {
                    if (l.pos.inRangeTo(storage, 2)) {
                        this.memory.sLink = l.id;
                    } else {
                        this.memory.links.push(l.id);
                    }
                }
            }
            this.memory.init = true;
        }
        if (this.memory.sLink) {
            this.sLink = Game.getObjectById(this.memory.sLink) || undefined;
            this.active = true;
        }
        if (this.memory.cLink) {
            this.cLink = Game.getObjectById(this.memory.cLink) || undefined;
            this.active = true;
        }
        if (this.memory.links && this.memory.links.length > 0) {
            for (const l in this.memory.links) {
                const _l: StructureLink | undefined = Game.getObjectById(this.memory.link) || undefined;
                if (_l) {
                    this.links.push(_l);
                }
            }
        }
        return;
    }

    public initMission(): void {
        ;
    }
    public spawn(): void {
        ;
    }
    public work(): void {
        if (this.active) {
            let transController = false;
            for (const l of this.links) {
                if (!l.cooldown && l.energy > 200) {
                    // Need to send energy
                    if (this.cLink && this.cLink.energy <= 300 && !transController) {
                        l.transferEnergy(this.cLink);
                        transController = true;
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
    }

    public finalize(): void {
        if (Game.time % 1000 === 892) {
            this.memory = undefined;
        }
    }

}
