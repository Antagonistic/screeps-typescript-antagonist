import { RoomClass } from "config/Constants"
import { LayoutPath } from "creeps/Movement";
import { roomHelper } from "rooms/roomHelper";

import { squareLayout } from "layout/layouts/squareLayout"

// Experimental full room planning
// Assume no vision

interface RoomPlannerLayout {
    valid: boolean;
    core: RoomStructurePositions;
    remotes?: { [key: string]: RoomStructurePositions };
    mineral?: RoomStructurePositions;
    POI: RoomPosition[];
    rally?: RoomPosition;
    memory: RoomMemory;
}

interface RoomPlannerLayoutTemplate {
    anchor: LightRoomPos;
    absolute: boolean;
    build: RoomStructurePositionsLight;
    memory: RoomMemory;
}

const remapMemory: string[] = ["supervisor"];

export class RoomPlanner {
    public output: RoomPlannerLayout;
    public roomName: string;
    public layoutCost: CostMatrix;
    public classType: RoomClass;
    public visible: boolean;
    public room?: Room;
    constructor(roomName: string, classType: RoomClass, visual: boolean = false) {
        this.roomName = roomName;
        this.output = {
            valid: true,
            core: {},
            POI: [],
            memory: {}
        };
        this.classType = classType;
        this.room = Game.rooms[roomName];
        this.visible = !!this.room;
        this.layoutCost = LayoutPath.LayoutCostMatrix(roomName) || new PathFinder.CostMatrix();
        this.planRoom();
        if (visual) {
            this.visual();
        }
    }

    private planRoom() {
        this.initPointsOfInterest();
        switch (this.classType) {
            case RoomClass.SQUARE: {
                this.planLayoutSquare();
                break;
            }
            case RoomClass.SNAKE: {
                break;
            }
            case RoomClass.PRAISE: {
                break;
            }
            case RoomClass.REMOTE: {
                break;
            }
        }
    }

    private planLayoutSquare() {
        const _bunkerLoc = this.optimalBunkerPosition(5);
        if (!_bunkerLoc) {
            this.output.valid = false;
            return;
        }
        const bunkerLoc = new RoomPosition(_bunkerLoc.x, _bunkerLoc.y, this.roomName);
        this.applyLayoutTemplate(squareLayout, _bunkerLoc);
        this.applyStandardRoom(bunkerLoc);
        // this.applyStandardPOIRoad(bunkerLoc);
        this.output.rally = this.fleeFromPOI(new RoomPosition(bunkerLoc.x, bunkerLoc.y, this.roomName), 6);
    }

    private applyLayoutTemplate(template: RoomPlannerLayoutTemplate, pos: LightRoomPos) {
        const dP = template.absolute ? { x: 0, y: 0 } : { x: pos.x - template.anchor.x, y: pos.y - template.anchor.y };
        for (const _key in template.build) {
            const key = _key as StructureConstant;
            if (!this.output.core[key]) { this.output.core[key] = []; }
            for (const p of template.build[key]!) {
                const _x = (p.x + dP.x);
                const _y = (p.y + dP.y);
                if (key === STRUCTURE_STORAGE) { // Add Storage to POI
                    this.output.POI.push(new RoomPosition(_x, _y, this.roomName));
                }
                this.addStructureCore({ x: _x, y: _y }, key);
            }
        }
        if (template.memory) {
            this.output.memory = _.merge(this.output.memory, template.memory);
            for (const key in template.memory) {
                if (key === "supervisor") {
                    this.output.memory.supervisor = [];
                    const pos = template.memory.supervisor;
                    if (pos) {
                        for (const p of pos) {
                            this.output.memory.supervisor.push({ x: p.x + dP.x, y: p.y + dP.y })
                        }
                    }
                }
            }
        }
    }

    private applyStandardRoom(center: RoomPosition) {
        const mem = Memory.rooms[this.roomName];
        if (!mem) { return; }
        if (mem.controllerPos) {
            const pos = roomHelper.deserializeRoomPosition(mem.controllerPos);
            if (pos) {
                let containerPos;
                let linkPos;
                if (this.room) {
                    containerPos = _.head(pos.findInRange(FIND_STRUCTURES, 2, { filter: x => x.structureType === STRUCTURE_CONTAINER }))?.pos;
                    linkPos = _.head(pos.findInRange(FIND_MY_STRUCTURES, 2, { filter: x => x.structureType === STRUCTURE_LINK }))?.pos;
                }
                if (!containerPos) containerPos = roomHelper.getControllerContainerPosition(pos);
                if (!linkPos) linkPos = roomHelper.getControllerLinkPosition(pos);
                this.addStructureCore(containerPos, STRUCTURE_CONTAINER);
                this.addStructureCore(linkPos, STRUCTURE_LINK);

                const path = LayoutPath.findByPathLayout(center, linkPos, 1, this.layoutCost);
                if (path.incomplete) {
                    console.log(`ROOMPLANNER: ${this.roomName} incomplete path to POI ${linkPos.print}!`);
                }
                this.addStructuresCore(path.path, STRUCTURE_ROAD, true);
            }
        }
        if (mem.sourcesPos) {
            for (const s of mem.sourcesPos) {
                const pos = roomHelper.deserializeRoomPosition(s);
                if (pos) {
                    let containerPos;
                    let linkPos;
                    if (this.room) {
                        containerPos = _.head(pos.findInRange(FIND_STRUCTURES, 2, { filter: x => x.structureType === STRUCTURE_CONTAINER }))?.pos;
                        linkPos = _.head(pos.findInRange(FIND_MY_STRUCTURES, 2, { filter: x => x.structureType === STRUCTURE_LINK }))?.pos;
                    }
                    if (!containerPos) containerPos = roomHelper.getContainerPosition(pos, center);
                    if (!linkPos) linkPos = roomHelper.getLinkPosition(pos, containerPos, center);
                    this.addStructureCore(containerPos, STRUCTURE_CONTAINER);
                    this.addStructureCore(linkPos, STRUCTURE_LINK);

                    const path = LayoutPath.findByPathLayout(center, containerPos, 1, this.layoutCost);
                    if (path.incomplete) {
                        console.log(`ROOMPLANNER: ${this.roomName} incomplete path to POI ${linkPos.print}!`);
                    }
                    this.addStructuresCore(path.path, STRUCTURE_ROAD, true);
                }
            }
        }
        if (mem.mineralInfo) {
            if (this.room) {
                const pos = roomHelper.deserializeRoomPosition(mem.mineralInfo.pos);
                if (pos) {
                    this.output.mineral = {};
                    let containerPos;
                    if (this.room) {
                        containerPos = _.head(pos.findInRange(FIND_STRUCTURES, 2, { filter: x => x.structureType === STRUCTURE_CONTAINER }))?.pos;
                    }
                    if (!containerPos) containerPos = roomHelper.getContainerPosition(pos, center);
                    this.addStructure(this.output.mineral, containerPos, STRUCTURE_CONTAINER);

                    const path = LayoutPath.findByPathLayout(center, containerPos, 1, this.layoutCost);
                    if (path.incomplete) {
                        console.log(`ROOMPLANNER: ${this.roomName} incomplete path to POI ${containerPos.print}!`);
                    }
                    this.addStructures(this.output.mineral, path.path, STRUCTURE_ROAD, true);
                }

            }
        }
    }

    private applyStandardPOIRoad(center: RoomPosition) {
        for (const POI of this.output.POI) {
            if (center.inRangeTo(POI, 3)) { continue; } // No road needed
            const path = LayoutPath.findByPathLayout(center, POI, 2, this.layoutCost);
            if (path.incomplete) {
                console.log(`ROOMPLANNER: ${this.roomName} incomplete path to POI ${POI.print}!`);
            }
            this.addStructuresCore(path.path, STRUCTURE_ROAD, true);
        }
    }

    private addStructure(layout: RoomStructurePositions, pos: RoomPosition | UnserializedRoomPosition | LightRoomPos, key: StructureConstant, addFront: boolean = false) {
        const _pos = new RoomPosition(pos.x, pos.y, this.roomName);
        if (!layout[key]) layout[key] = [];
        if (addFront) {
            layout[key]?.unshift(_pos);
        }
        else {
            layout[key]?.push(_pos);
        }
        if (this.layoutCost) {
            if (this.layoutCost.get(pos.x, pos.y) === 0xff) {
                console.log(`ROOMPLANNER: ${this.roomName} Overlapping structure ${key}! ${_pos.print}`)
                this.output.valid = false;
            }
            if (key !== STRUCTURE_CONTAINER && key !== STRUCTURE_ROAD && key !== STRUCTURE_RAMPART) {
                this.layoutCost.set(_pos.x, _pos.y, 0xff);
            }
            if (key === STRUCTURE_ROAD) {
                if (this.layoutCost.get(_pos.x, _pos.y) === 1) {
                    console.log(`ROOMPLANNER: ${this.roomName} road already laid out! ${_pos.print}`)
                }
                this.layoutCost.set(_pos.x, _pos.y, 1);
            }
        }
    }
    private addStructureCore(pos: RoomPosition | UnserializedRoomPosition | LightRoomPos, key: StructureConstant, addFront: boolean = false) {
        this.addStructure(this.output.core, pos, key, addFront);
    }

    private addStructures(layout: RoomStructurePositions, pos: Array<RoomPosition | UnserializedRoomPosition | LightRoomPos>, key: StructureConstant, addFront: boolean = false) {
        for (const p of pos) {
            if (key === STRUCTURE_ROAD && this.layoutCost.get(p.x, p.y) === 1) {
                continue;
            }
            this.addStructure(layout, p, key, addFront);
        }
    }

    private addStructuresCore(pos: Array<RoomPosition | UnserializedRoomPosition | LightRoomPos>, key: StructureConstant, addFront: boolean = false) {
        this.addStructures(this.output.core, pos, key, addFront);
    }

    private fleeFromPOI(pos: RoomPosition, range: number) {
        return _.last(LayoutPath.findFleePathLayout(pos, this.output.POI, range, this.layoutCost).path);
    }

    private initPointsOfInterest() {
        const mem = Memory.rooms[this.roomName];
        if (!mem) { return; }
        if (mem.controllerPos) {
            const pos = roomHelper.deserializeRoomPosition(mem.controllerPos);
            if (pos) { this.output.POI.push(pos); }
        }
        if (mem.sourcesPos) {
            for (const s of mem.sourcesPos) {
                const pos = roomHelper.deserializeRoomPosition(s);
                if (pos) { this.output.POI.push(pos); }
            }
        }
    }

    private optimalBunkerPosition(radius: number) {  // Minimize all POI path lengths
        let bestLoc: LightRoomPos | undefined;
        let bestDist: number = 999;
        const loc = this.potentialBunkerLocations(radius);
        for (const l of loc) {
            const dist = this.POIPathLength(l);
            if (dist < bestDist) {
                bestLoc = l;
                bestDist = dist;
            }
        }
        return bestLoc;
    }

    private POIPathLength(pos: LightRoomPos) {
        let dist = 0;
        if (this.output.POI.length > 0) {
            const _pos = new RoomPosition(pos.x, pos.y, this.roomName);
            for (const p of this.output.POI) {
                const ret = LayoutPath.findByPathLayout(_pos, p);
                if (ret.incomplete) {
                    dist += 999;
                } else {
                    dist += ret.path.length;
                }
            }
        }
        return dist;
    }

    private potentialBunkerLocations(radius: number) {
        const layoutDistance = LayoutPath.getLayoutDistanceTransform(this.roomName);
        var loc: LightRoomPos[] = [];
        if (layoutDistance === false) { return loc; }
        for (const y of _.range(radius + 2, 50 - radius - 2)) {
            for (const x of _.range(radius + 2, 50 - radius - 2)) {
                if (layoutDistance.get(x, y) > radius + 1) {
                    loc.push({ x, y });
                }
            }
        }
        if (loc.length > 20) {
            loc = loc.filter(p => (p.x + p.y) % 2 == 0);
        }
        if (loc.length > 20) {
            loc = loc.filter(p => (p.x + p.y) % 4 == 0);
        }
        if (loc.length > 20) {
            loc = loc.filter(p => (p.x + p.y) % 8 == 0);
        }
        if (loc.length > 20) {
            loc = _.sample(loc, 20);
        }
        const flags = Object.values(Game.flags).filter(x => x.pos.roomName === this.roomName);
        if (flags && flags.length > 0) {
            for (const f of flags) {
                const dist = layoutDistance.get(f.pos.x, f.pos.y);
                if (dist >= radius) {
                    loc.push({ x: f.pos.x, y: f.pos.y });
                } else {
                    console.log(`ROOMPLANNER: ${this.roomName} flag not valid bunker pos: ${f.name} ${f.pos.print} ${dist}/${radius}`);
                }
            }
        }
        return loc;
    }

    public visual() {
        const vis = new RoomVisual(this.roomName);
        if (this.output.valid) {
            this.renderPos(this.output.core, vis);
            if (this.output.mineral) { this.renderPos(this.output.mineral, vis); }
            if (this.output.remotes && this.output.remotes.length > 0) {
                _.each(this.output.remotes, x => this.renderPos(x, vis));
            }
        }
        vis.connectRoads();
        if (this.output.rally) {
            vis.circle(this.output.rally, { radius: 0.5, fill: "#FF2121" });
        }
    }

    private renderPos(layout: RoomStructurePositions, visual: RoomVisual) {
        for (const _key in layout) {
            const key = _key as BuildableStructureConstant;
            for (const p of layout[key]!) {
                visual.structure(p.x, p.y, key);
            }
        }
    }


};
