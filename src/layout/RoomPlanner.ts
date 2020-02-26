import { RoomClass } from "config/Constants"
import { LayoutPath } from "creeps/Movement";
import { roomHelper } from "rooms/roomHelper";

// Experimental full room planning
// Assume no vision

interface RoomPlannerLayout {
    valid: boolean;
    core: RoomStructurePositions;
    remotes?: { [key: string]: RoomStructurePositions };
    POI: RoomPosition[];
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
    constructor(roomName: string, classType: RoomClass) {
        this.roomName = roomName;
        this.output = {
            valid: true,
            core: {},
            POI: [],
            memory: {}
        };
        this.classType = classType;
        this.layoutCost = LayoutPath.LayoutCostMatrix(roomName) || new PathFinder.CostMatrix();

        this.planRoom();
    }

    private planRoom() {
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
        const bunkerLoc = this.optimalBunkerPosition(5);
        if (!bunkerLoc) {
            this.output.valid = false;
            return;
        }
        this.applyLayoutTemplate(squareLayout, bunkerLoc);
    }

    private applyLayoutTemplate(template: RoomPlannerLayoutTemplate, pos: LightRoomPos) {
        const dP = template.absolute ? { x: 0, y: 0 } : { x: pos.x - template.anchor.x, y: pos.y - template.anchor.y };
        for (const _key in template.build) {
            const key = _key as StructureConstant;
            if (!this.output.core[key]) { this.output.core[key] = []; }
            for (const p of template.build[key]!) {
                this.output.core[key]?.push({ x: (p.x + dP.x), y: (p.y + dP.y), roomName: this.roomName });
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
        const loc: LightRoomPos[] = [];
        if (layoutDistance === false) { return loc; }
        for (const y of _.range(radius + 2, 50 - radius - 2)) {
            for (const x of _.range(radius + 2, 50 - radius - 2)) {
                if (layoutDistance.get(x, y) > radius + 1) {
                    loc.push({ x, y });
                }
            }
        }
        if (loc.length > 10) {
            return _.sample(loc, 10);
        }
        return loc;
    }


};
