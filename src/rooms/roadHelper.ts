
import { roomHelper } from "./roomHelper";

export const roadHelper = {
    repRoadsListIds(start: RoomPosition, finish: RoomPosition): Array<Id<StructureContainer | StructureRoad>> {
        const ret: Array<Id<StructureContainer | StructureRoad>> = [];
        for (const r of roadHelper.pavePath(start, finish)) {
            if (r.room) {
                const road = r.lookForStructure(STRUCTURE_ROAD) as StructureRoad;
                const cont = r.lookForStructure(STRUCTURE_CONTAINER) as StructureContainer;
                if (road && road.hits < road.hitsMax * 0.8) {
                    ret.push(road.id);
                }
                if (cont && cont.hits < cont.hitsMax * 0.8) {
                    ret.push(cont.id);
                }
            }
        }
        return ret;
    },

    repRoadsListIdsRoom(room: Room): Array<Id<StructureContainer | StructureRoad>> {
        const ret: Array<Id<StructureContainer | StructureRoad>> = [];
        const _targets = room.find(FIND_STRUCTURES, { filter: x => (x.structureType === STRUCTURE_ROAD || x.structureType === STRUCTURE_CONTAINER) && x.hits < x.hitsMax * 0.8 }) as Array<StructureContainer | StructureRoad>;
        return _targets.map(x => x.id);
    },

    getNextUnbuiltRoad(start: RoomPosition, finish: RoomPosition): ConstructionSite | RoomPosition | null {
        for (const r of roadHelper.pavePath(start, finish)) {
            if (r.isEdge) { continue; }
            if (!r.isVisible) { continue; }
            const constuct = _.find(r.lookFor(LOOK_CONSTRUCTION_SITES));
            if (constuct) {
                if (constuct.structureType === STRUCTURE_ROAD || constuct.structureType === STRUCTURE_CONTAINER) {
                    return constuct;
                } else { continue; }
            }
            const road = r.lookForStructure(STRUCTURE_ROAD);
            if (!road) {
                return r;
            }
        }
        return null;
    },

    getUnbuiltRoads(pos: RoomPosition[]): RoomPosition[] {
        const ret = [];
        for (const r of pos) {
            if (r.room && !r.lookForStructure(STRUCTURE_ROAD)) {
                ret.push(r);
            }
        }
        return ret;
    },

    getNextUnbuiltRoadPos(pos: RoomPosition[]): RoomPosition | undefined {
        for (const r of pos) {
            if (r.room && !r.lookForStructure(STRUCTURE_ROAD)) {
                return r;
            }
        }
        return undefined;
    },

    pavePath(start: RoomPosition, finish: RoomPosition, rangeAllowance: number = 1): RoomPosition[] {
        const path = roomHelper.findPath(start, finish, rangeAllowance);
        const ret = [];
        if (path) {
            for (const p of path) {
                ret.push(p);
            }
        }
        return ret;
    }
};
