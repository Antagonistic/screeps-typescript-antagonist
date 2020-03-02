import { RoomClass, BUNKER_VALID_MAX, PLAN_SEGMENT, BUNKER_RADIUS } from "config/Constants"
import { LayoutPath } from "creeps/Movement";
import { roomHelper } from "rooms/roomHelper";

import { squareLayout } from "layout/layouts/squareLayout"
import { RoomLayout } from "./RoomLayout";

// Experimental full room planning
// Assume no vision

export class RoomPlanner extends RoomLayout {
    // public data: RoomPlannerLayout;
    public roomName: string;
    public layoutCost: CostMatrices;
    public classType: RoomClass;
    public visible: boolean;
    public room?: Room;
    public mem?: RoomMemory;
    constructor(roomName: string, classType: RoomClass, visual: boolean = false) {
        super(roomName, true);
        this.roomName = roomName;
        this.classType = classType;
        this.room = Game.rooms[roomName];
        this.visible = !!this.room;
        this.layoutCost = {};
        this.layoutCost[roomName] = LayoutPath.LayoutCostMatrix(roomName) || new PathFinder.CostMatrix();
        this.mem = Memory.rooms[roomName];
        if (this.mem) {
            this.planRoom();
            if (visual) {
                this.visual();
                this.saveToSegment(PLAN_SEGMENT);
            }
        }
        else {
            console.log(`ROOMPLANNER: ${this.roomName} was not surveyed`);
        }
    }

    private planRoom() {
        this.initPointsOfInterest();
        this.data.class = this.classType;
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
        const _bunkerLoc = this.optimalBunkerPosition(BUNKER_RADIUS);
        if (!_bunkerLoc) {
            console.log(`ROOMPLANNER: ${this.roomName} cannot find optimal bunker location`);
            this.data.valid = false;
            return;
        }
        const bunkerLoc = new RoomPosition(_bunkerLoc.x, _bunkerLoc.y, this.roomName);
        this.applyLayoutTemplate(squareLayout, _bunkerLoc);
        this.applyStandardRoom(bunkerLoc, true);
        this.planStandardRemotes(bunkerLoc);
        this.planSquareRamparts(bunkerLoc, BUNKER_RADIUS);
        this.data.rally = this.fleeFromPOI(new RoomPosition(bunkerLoc.x, bunkerLoc.y, this.roomName), 7);
    }

    private applyLayoutTemplate(template: RoomPlannerLayoutTemplate, pos: LightRoomPos) {
        const dP = template.absolute ? { x: 0, y: 0 } : { x: pos.x - template.anchor.x, y: pos.y - template.anchor.y };
        for (const _key in template.build) {
            const key = _key as StructureConstant;
            if (!this.data.core[key]) { this.data.core[key] = []; }
            for (const p of template.build[key]!) {
                const _x = (p.x + dP.x);
                const _y = (p.y + dP.y);
                if (key === STRUCTURE_STORAGE) { // Add Storage to POI
                    this.data.POI.push(new RoomPosition(_x, _y, this.roomName));
                }
                this.addStructureCore({ x: _x, y: _y }, key);
            }
        }
        if (template.memory) {
            this.data.memory = _.merge(this.data.memory, template.memory);
            for (const key in template.memory) {
                if (key === "supervisor") {
                    this.data.memory.supervisor = [];
                    const pos = template.memory.supervisor;
                    if (pos) {
                        for (const p of pos) {
                            this.data.memory.supervisor.push({ x: p.x + dP.x, y: p.y + dP.y })
                        }
                    }
                }
            }
        }
    }

    private applyStandardRoom(center: RoomPosition, rampart: boolean = false) {
        const mem = Memory.rooms[this.roomName];
        if (!mem) { return; }
        if (mem.controllerPos) {
            const pos = roomHelper.deserializeRoomPosition(mem.controllerPos);
            if (pos) {
                let containerPos;
                let linkPos;
                if (this.room) {
                    containerPos = _.head(pos.findInRange(FIND_STRUCTURES, 3, { filter: x => x.structureType === STRUCTURE_CONTAINER }))?.pos;
                    linkPos = _.head(pos.findInRange(FIND_MY_STRUCTURES, 3, { filter: x => x.structureType === STRUCTURE_LINK }))?.pos;
                }
                if (!containerPos) containerPos = roomHelper.getControllerContainerPosition(pos);
                if (!linkPos) linkPos = roomHelper.getControllerLinkPosition(pos);
                this.addStructureCore(containerPos, STRUCTURE_CONTAINER);
                if (rampart) { this.addStructureCore(containerPos, STRUCTURE_RAMPART); }
                this.addStructureCore(linkPos, STRUCTURE_LINK);
                if (rampart) { this.addStructureCore(linkPos, STRUCTURE_RAMPART); }
                if (rampart) {
                    const controlLocations = pos.openAdjacentSpots(true, true);
                    if (controlLocations && controlLocations.length > 0) {
                        controlLocations.forEach(x => this.addStructureCore(x, STRUCTURE_RAMPART));
                    }
                }

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
                    if (rampart) { this.addStructureCore(containerPos, STRUCTURE_RAMPART); }
                    this.addStructureCore(linkPos, STRUCTURE_LINK);
                    if (rampart) { this.addStructureCore(linkPos, STRUCTURE_RAMPART); }

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
                    this.data.mineral = {};
                    this.addStructure(this.data.mineral, mem.mineralInfo.pos, STRUCTURE_EXTRACTOR);

                    let containerPos;
                    if (this.room) {
                        containerPos = _.head(pos.findInRange(FIND_STRUCTURES, 2, { filter: x => x.structureType === STRUCTURE_CONTAINER }))?.pos;
                    }
                    if (!containerPos) containerPos = roomHelper.getContainerPosition(pos, center);
                    this.addStructure(this.data.mineral, containerPos, STRUCTURE_CONTAINER);

                    const path = LayoutPath.findByPathLayout(center, containerPos, 1, this.layoutCost);
                    if (path.incomplete) {
                        console.log(`ROOMPLANNER: ${this.roomName} incomplete path to POI ${containerPos.print}!`);
                    }
                    this.addStructures(this.data.mineral, path.path, STRUCTURE_ROAD, true);
                }

            }
        }
    }

    private addStructure(layout: RoomStructurePositions, pos: RoomPosition | UnserializedRoomPosition | LightRoomPos, key: StructureConstant, addFront: boolean = false) {
        const roomName = (pos as UnserializedRoomPosition).roomName || this.roomName;
        const _pos = new RoomPosition(pos.x, pos.y, roomName);
        if (Game.map.getRoomTerrain(roomName).get(_pos.x, _pos.y) === TERRAIN_MASK_WALL) {
            if (key !== STRUCTURE_EXTRACTOR) { // Only structure can place on walls
                if (key !== STRUCTURE_ROAD && key !== STRUCTURE_RAMPART) {
                    console.log(`ROOMPLANNER: ${this.roomName} structure placed on wall ${key}! ${_pos.print}`)
                }
                return;
            }
        }
        if (!layout[key]) layout[key] = [];
        if (addFront) {
            layout[key]?.unshift(_pos);
        }
        else {
            layout[key]?.push(_pos);
        }
        if (!this.layoutCost[roomName]) {
            this.layoutCost[roomName] = LayoutPath.LayoutCostMatrix(roomName) || new PathFinder.CostMatrix();
        }
        if (this.layoutCost[roomName].get(pos.x, pos.y) === 0xff && key !== STRUCTURE_RAMPART) {
            console.log(`ROOMPLANNER: ${this.roomName} Overlapping structure ${key}! ${_pos.print}`)
            this.data.valid = false;
        }
        if (key !== STRUCTURE_CONTAINER && key !== STRUCTURE_ROAD && key !== STRUCTURE_RAMPART) {
            this.layoutCost[roomName].set(_pos.x, _pos.y, 0xff);
        }
        if (key === STRUCTURE_ROAD) {
            if (this.layoutCost[roomName].get(_pos.x, _pos.y) === 1) {
                console.log(`ROOMPLANNER: ${this.roomName} road already laid out! ${_pos.print}`)
            }
            this.layoutCost[roomName].set(_pos.x, _pos.y, 1);
        }
    }
    private addStructureCore(pos: RoomPosition | UnserializedRoomPosition | LightRoomPos, key: StructureConstant, addFront: boolean = false) {
        this.addStructure(this.data.core, pos, key, addFront);
    }

    private addStructures(layout: RoomStructurePositions, pos: Array<RoomPosition | UnserializedRoomPosition | LightRoomPos>, key: StructureConstant, addFront: boolean = false) {
        for (const p of pos) {
            const roomName = (p as UnserializedRoomPosition).roomName || this.roomName;
            if (key === STRUCTURE_ROAD && this.layoutCost[roomName].get(p.x, p.y) === 1) {
                continue;
            }
            this.addStructure(layout, p, key, addFront);
        }
    }

    private addStructuresCore(pos: Array<RoomPosition | UnserializedRoomPosition | LightRoomPos>, key: StructureConstant, addFront: boolean = false) {
        this.addStructures(this.data.core, pos, key, addFront);
    }

    private fleeFromPOI(pos: RoomPosition, range: number) {
        return _.last(LayoutPath.findFleePathLayout(pos, this.data.POI, range, this.layoutCost).path);
    }

    private initPointsOfInterest() {
        const mem = Memory.rooms[this.roomName];
        if (!mem) { return; }
        if (mem.controllerPos) {
            const pos = roomHelper.deserializeRoomPosition(mem.controllerPos);
            if (pos) { this.data.POI.push(pos); }
        }
        if (mem.sourcesPos) {
            for (const s of mem.sourcesPos) {
                const pos = roomHelper.deserializeRoomPosition(s);
                if (pos) { this.data.POI.push(pos); }
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
        if (this.data.POI.length > 0) {
            const _pos = new RoomPosition(pos.x, pos.y, this.roomName);
            for (const p of this.data.POI) {
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

    private planStandardRemotes(center: RoomPosition) {
        if (this.mem && this.mem.neighbors && this.mem.neighbors.length > 0) {
            for (const n of this.mem.neighbors) {
                this.planStandardRemote(n, center);
            }
        }
    }

    private planSquareRamparts(pos: RoomPosition, radius: number) {
        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                if (dx >= -radius + 3 && dy >= -radius + 3 && dx <= radius - 3 && dy <= radius - 3) { continue; }
                if (Math.abs(dx) == radius && Math.abs(dy) == radius) { continue; }
                this.addStructureCore({ x: (pos.x + dx), y: (pos.y + dy) }, STRUCTURE_RAMPART);
            }
        }
    }

    private planStandardRemote(remoteName: string, center: RoomPosition) {
        const mem = Memory.rooms[remoteName];
        if (!mem) { return; }
        if (!this.layoutCost[remoteName]) { this.layoutCost[remoteName] = LayoutPath.LayoutCostMatrix(remoteName) || new PathFinder.CostMatrix(); }
        if (mem.sourcesPos) {
            if (!this.data.remotes) this.data.remotes = {};
            this.data.remotes[remoteName] = {
                core: {},
                numSource: mem.sourcesPos.length,
                isSK: mem.sourcesPos.length > 2,
                score: 0,
                name: remoteName
            }
            let score = 0;
            for (const s of mem.sourcesPos) {
                const pos = roomHelper.deserializeRoomPosition(s);
                if (pos) {
                    const sourcePath = LayoutPath.findByPathLayout(center, pos, 1, this.layoutCost);
                    const containerPos = _.last(sourcePath.path);
                    this.addStructure(this.data.remotes[remoteName].core, containerPos, STRUCTURE_CONTAINER);
                    this.addStructures(this.data.remotes[remoteName].core, sourcePath.path, STRUCTURE_ROAD);
                }
            }
            if (mem.sourcesPos.length === 1) {

            }
            if (mem.sourcesPos.length === 2) {

            }
            if (mem.sourcesPos.length > 2) {

            }
        }
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
        if (loc.length > BUNKER_VALID_MAX) {
            loc = loc.filter(p => (p.x + p.y) % 2 == 0);
        }
        if (loc.length > BUNKER_VALID_MAX) {
            loc = loc.filter(p => (p.x + p.y) % 4 == 0);
        }
        if (loc.length > BUNKER_VALID_MAX) {
            loc = loc.filter(p => (p.x + p.y) % 8 == 0);
        }
        if (loc.length > BUNKER_VALID_MAX) {
            loc = _.sample(loc, BUNKER_VALID_MAX);
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
};
