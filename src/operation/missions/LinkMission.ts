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
            this.spawnRoom.room.memory.links = [];
            for (const l of _links) {
                if (l.pos.inRangeTo(controller.pos, 3)) {
                    this.spawnRoom.room.memory.cLink = l.id;
                } else {
                    if (l.pos.inRangeTo(storage, 2)) {
                        this.spawnRoom.room.memory.sLink = l.id;
                    } else {
                        this.spawnRoom.room.memory.links.push(l.id);
                    }
                }
            }
            this.memory.init = true;
        }
        if (this.spawnRoom.room.memory.sLink) {
            this.sLink = Game.getObjectById(this.spawnRoom.room.memory.sLink) || undefined;
            if (!this.sLink) { delete this.memory.init; }
            else { this.active = true; }
        }
        if (this.spawnRoom.room.memory.cLink) {
            this.cLink = Game.getObjectById(this.spawnRoom.room.memory.cLink) || undefined;
            if (!this.cLink) { delete this.memory.init; }
            else { this.active = true; }
        }
        if (this.spawnRoom.room.memory.links && this.spawnRoom.room.memory.links.length > 0) {
            for (const l of this.spawnRoom.room.memory.links) {
                const _l: StructureLink | undefined = Game.getObjectById(l) || undefined;
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
        if (this.active && Game.time % 5 === 0) {
            // console.log('LINK: ' + this.room!.print + ' has ' + this.links.length + ' links');
            let transController = false;
            for (const l of this.links) {
                if (!l.cooldown && l.energy > 200) {
                    // console.log('LINK: ' + l.pos.print + ' wants to send energy');
                    // Need to send energy
                    if (this.cLink && this.cLink.energy <= 300 && !transController) {
                        l.transferEnergy(this.cLink);
                        transController = true;
                    } else {
                        if (this.sLink && this.sLink.energy <= 600) {
                            l.transferEnergy(this.sLink);
                        } else {
                            // Nowhere to send
                            console.log('LINK: ' + this.room!.print + ' nowhere to send from ' + l.pos.print);
                        }
                    }
                }
            }
            if (this.cLink && this.cLink.energy < 700 && !transController) {
                if (this.sLink && this.sLink.energy >= 400) {
                    this.sLink.transferEnergy(this.cLink);
                }
            }
        }
    }

    public finalize(): void {
        if (this.getSalt() % 1000 === 896) {
            delete this.memory.init;
            delete this.spawnRoom.room.memory.sLink;
            delete this.spawnRoom.room.memory.cLink;
            delete this.spawnRoom.room.memory.links;
            console.log('LINK: clearing link caching ' + this.room!.print);
        }
    }

}
