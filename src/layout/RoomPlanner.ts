import { RoomClass, BUNKER_VALID_MAX, PLAN_SEGMENT, BUNKER_RADIUS } from "config/Constants"
import { LayoutPath } from "creeps/Movement";
import { roomHelper } from "rooms/roomHelper";

import { squareLayout } from "layout/layouts/squareLayout"
import { RoomLayout } from "./RoomLayout";
import { AutoLayout } from "rooms/AutoLayout";

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
        if (!this.mem) { return; }
        this.initPointsOfInterest();
        this.data.class = this.classType;
        this.data.valid = true;
        switch (this.classType) {
            case RoomClass.SQUARE: {
                this.planLayoutSquare();
                break;
            }
            case RoomClass.SNAKE: {
                this.planLayoutSnake();
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

    private planLayoutSnake(rampart: boolean = true) {
        if (!this.mem) {
            this.data.valid = false;
            return;
        }
        if (!this.mem.controllerPos) {
            this.data.valid = false;
            return;
        }
        const controlPos = roomHelper.deserializeRoomPosition(this.mem.controllerPos);
        if (!this.mem.sourcesPos || this.mem.sourcesPos.length == 0) {
            this.data.valid = false;
            return;
        }

        const walkable = LayoutPath.getWalkableGridMatrix(this.roomName);
        const snakeMatrix = LayoutPath.combine(walkable, LayoutPath.getLayoutDistanceTransformCart(this.roomName));
        this.layoutCost[this.roomName] = snakeMatrix;
        let storage: RoomPosition | undefined;
        if (this.room) {
            storage = _.head(controlPos.findInRange(FIND_MY_STRUCTURES, 3, { filter: x => x.structureType === STRUCTURE_STORAGE }))?.pos;
        }
        if (!storage) { storage = this.getSpotCandidate(controlPos, 3, true); }
        this.addStructureCore(storage, STRUCTURE_STORAGE);

        let center: RoomPosition = storage;
        const sortedSources = _.sortBy(roomHelper.deserializeRoomPositions(this.mem.sourcesPos), [(x: Source) => x.pos.getRangeTo(center)]);
        let spots = [];
        for (const s of sortedSources) {
            let containerPos: RoomPosition | undefined;
            if (this.room) {
                containerPos = _.head(s.findInRange(FIND_STRUCTURES, 1, { filter: x => x.structureType === STRUCTURE_CONTAINER }))?.pos;
            }
            if (!containerPos) containerPos = roomHelper.getContainerPosition(s);
            this.addStructureCore(containerPos, STRUCTURE_CONTAINER);
            if (rampart) { this.addStructureCore(containerPos, STRUCTURE_RAMPART); }
            const path = LayoutPath.findByPathLayoutExclusive(containerPos, center, 1, this.layoutCost);
            if (center === storage) { center = _.last(path.path); }
            this.addStructuresCore(path.path, STRUCTURE_ROAD);
            let _spots = roomHelper.unique(_.flatten(_.map(path.path, x => this.getOpenCardinalPosition(x, s))));
            _spots = _spots.filter(p => (p.x !== containerPos!.x) || (p.y !== containerPos!.y));
            spots.push(_spots);
        }
        let mix = [];
        if (this.mem.sourcesPos.length == 2) {
            mix = roomHelper.unique(_.filter(_.flatten(_.zip(spots[0], spots[1])), x => x instanceof RoomPosition));
        } else if (this.mem.sourcesPos.length == 1) {
            mix = spots[0];
        } else {
            this.data.valid = false;
            return;
        }
        mix = mix.filter(p => (p.x !== storage!.x) || (p.y !== storage!.y));
        const terminal = mix.pop();
        const tower1 = mix.shift();
        const spawn1 = mix.shift();
        const spawn2 = mix.pop();
        const spawn3 = mix.shift();
        const tower2 = mix.pop();
        const tower3 = mix.shift();
        if (!terminal || !spawn1 || !spawn2 || !spawn3 || !tower1 || !tower2 || !tower3) {
            this.data.valid = false;
            return;
        }
        this.addStructureCore(terminal, STRUCTURE_TERMINAL);
        this.addStructureCore(tower1, STRUCTURE_TOWER);
        this.addStructureCore(tower2, STRUCTURE_TOWER);
        this.addStructureCore(tower3, STRUCTURE_TOWER);
        this.addStructureCore(spawn1, STRUCTURE_SPAWN);
        this.addStructureCore(spawn2, STRUCTURE_SPAWN);
        this.addStructureCore(spawn3, STRUCTURE_SPAWN);
        let count = 0;
        for (let i = 0; i < mix.length; i++) {
            if (count <= 60) {
                this.addStructureCore(mix[i], STRUCTURE_EXTENSION);
            }
            count++;
        }
    }

    private applyLayoutTemplate(template: RoomPlannerLayoutTemplate, pos: LightRoomPos) {
        const dP = template.absolute ? { x: 0, y: 0 } : { x: pos.x - template.anchor.x, y: pos.y - template.anchor.y };
        for (const _key in template.build) {
            const key = _key as BuildableStructureConstant;
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

    private addStructure(layout: RoomStructurePositions, pos: RoomPosition | UnserializedRoomPosition | LightRoomPos, key: BuildableStructureConstant, addFront: boolean = false) {
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
    private addStructureCore(pos: RoomPosition | UnserializedRoomPosition | LightRoomPos, key: BuildableStructureConstant, addFront: boolean = false) {
        this.addStructure(this.data.core, pos, key, addFront);
    }

    private addStructures(layout: RoomStructurePositions, pos: Array<RoomPosition | UnserializedRoomPosition | LightRoomPos>, key: BuildableStructureConstant, addFront: boolean = false) {
        for (const p of pos) {
            const roomName = (p as UnserializedRoomPosition).roomName || this.roomName;
            if (key === STRUCTURE_ROAD && this.layoutCost[roomName].get(p.x, p.y) === 1) {
                continue;
            }
            this.addStructure(layout, p, key, addFront);
        }
    }

    private addStructuresCore(pos: Array<RoomPosition | UnserializedRoomPosition | LightRoomPos>, key: BuildableStructureConstant, addFront: boolean = false) {
        this.addStructures(this.data.core, pos, key, addFront);
    }

    private fleeFromPOI(pos: RoomPosition, range: number) {
        return _.last(LayoutPath.findFleePathLayout(pos, this.data.POI, range, this.layoutCost).path);
    }

    private getSpotCandidate(pos: RoomPosition | UnserializedRoomPosition, range: number, grid: boolean = false): RoomPosition {
        const terrain = Game.map.getRoomTerrain(pos.roomName);
        const candidates: RoomPosition[] = [];
        for (let dx = -range; dx <= range; dx++) {
            for (let dy = -range; dy <= range; dy++) {
                const x = pos.x + dx;
                const y = pos.y + dy;
                if (Math.abs(dx) !== range && Math.abs(dy) !== range) { continue; }
                if (x < 2 || x > 47 || y < 2 || y > 47) { continue; }
                if (grid && ((x + y) % 2) == 0) { continue; }
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) { continue; }
                candidates.push(new RoomPosition(x, y, pos.roomName));
            }
        }
        if (candidates.length == 0) {
            if (range > 1) {
                return this.getSpotCandidate(pos, range - 1, grid);
            } else {
                throw `ROOMPLANNER: SNAKE: ${this.roomName} could not find ANY spot for ${pos}`;
            }
        }
        const ret = _.max(candidates, (x: RoomPosition) => x.openAdjacentSpots(true, true).length);
        return ret;
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

    private getOpenCardinalPosition(pos: RoomPosition, center?: RoomPosition): RoomPosition[] {
        const positions = [];
        for (let i = 1; i <= 8; i += 2) {
            const testPosition = pos.getPositionAtDirection(i);
            if (!testPosition) { continue; }
            if (!testPosition.isNearExit(0) && _.head(testPosition.lookFor(LOOK_TERRAIN)) !== "wall") {
                positions.push(testPosition);
            }
        }
        if (center) {
            return _.sortBy(positions, x => x.getRangeTo(center));
        }
        return positions;
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
