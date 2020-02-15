import { PLAIN_COST, SWAMP_COST } from "config/config";
import { Traveler } from "utils/Traveler";
import { dynaControllerLayout } from "./layout/dynaControllerLayout";
import { dynaDefenceLayout } from "./layout/dynaDefenceLayout";
import { dynaSourceLayout } from "./layout/dynaSourceLayout";
import { headLayout } from "./layout/headLayout";
import { noLayout } from "./layout/noLayout";
import { sealedLayout } from "./layout/sealedLayout"
import { snakeLayout } from "./layout/snakeLayout";
import { roadHelper } from "./roadHelper";

export interface SingleLayout {
    pos: LightRoomPos;
    layout: RCLRoomLayout;
}


export const layoutManager = {
    getLayouts(room: Room): SingleLayout[] {
        const ret: SingleLayout[] = [];
        if (!room.memory.layout) { return ret; }
        for (const l of room.memory.layout) {
            const flag = Game.flags[l.flagName];
            let layout;
            if (flag) {
                switch (l.name) {
                    case "sealed":
                        layout = sealedLayout(room, flag);
                        break;
                    case "head":
                        layout = headLayout(room, flag);
                        break;
                    case "snake":
                        layout = snakeLayout(room, flag);
                        break;
                    default:
                        layout = noLayout(room, flag);
                }
            }
            if (layout) {
                const x = layout.anchor.x - flag.pos.x;
                const y = layout.anchor.y - flag.pos.y;
                ret.push({ pos: { x, y }, layout });
            }
        }
        if (room.controller) {
            const pos = { x: 0, y: 0 };
            ret.push({ pos, layout: dynaControllerLayout(room) })
        }
        const sources = room.sortedSources;
        if (sources && sources.length > 0) {
            let closest = true;
            for (const s of sources) {
                const pos = { x: 0, y: 0 };
                ret.push({ pos, layout: dynaSourceLayout(room, s, closest) })
                closest = false;
            }
        }
        const mineral = room.find(FIND_MINERALS);
        if (mineral && mineral.length > 0) {
            const pos = { x: 0, y: 0 };
            ret.push({ pos, layout: dynaSourceLayout(room, mineral[0], false) })
        }
        {
            const pos = { x: 0, y: 0 };
            ret.push({ pos, layout: dynaDefenceLayout(room) });
        }
        return ret;
    },

    layoutCoord(room: Room, x: number, y: number) {
        const layout = layoutManager.getLayouts(room);
        if (layout && layout.length > 0) {
            const _layout = layout[0];
            const pos = _layout.pos;
            const _x = x - pos.x;
            const _y = y - pos.y;
            return new RoomPosition(_x, _y, room.name);
        } else {
            const _x = x;
            const _y = y;
            return new RoomPosition(_x, _y, room.name);
        }
    },

    applyLayouts(room: Room) {
        const ret: RoomStructurePositions = {};
        if (room.controller && room.controller.my) {
            const level = room.controller.level;
            if (level > 0) {
                const layouts = layoutManager.getLayouts(room);
                for (const l of layouts) {
                    const layout = l.layout;
                    const pos = l.pos;
                    for (let i = 0; i <= level; i++) {
                        const _l = layout[i];
                        if (_l) {
                            for (const key in _l.build) {
                                const _key = key as BuildableStructureConstant;
                                const build = _l.build[key];
                                for (const p of build) {
                                    if (!p) {
                                        console.log('LAYOUT: ' + p + ' erronous expected ' + key + ' room ' + room.print);
                                    }
                                    const _x = p.x - pos.x;
                                    const _y = p.y - pos.y;
                                    const _pos = new RoomPosition(_x, _y, room.name);
                                    if (_pos.isPassible(true, true) || _key === STRUCTURE_EXTRACTOR) {
                                        if (!ret[_key]) { ret[_key] = []; }
                                        ret[_key]!.push(_pos);
                                    }
                                }
                            }
                            if (_l.memory) {
                                if (_l.memory.supervisor) {
                                    room.memory.supervisor = [];
                                    for (const sup of _l.memory.supervisor) {
                                        const _x = sup.x - pos.x;
                                        const _y = sup.y - pos.y;
                                        room.memory.supervisor.push({ x: _x, y: _y });
                                    }
                                } else {
                                    _.assign(_l.memory, room.memory);
                                }
                            }
                        }
                    }
                }
            }
        }
        if (Object.keys(ret).length > 0) {
            room.memory.structures = ret;
            room.memory.layoutTime = Game.time + 1000;
        }
    },

    applySecondaryRoads(room: Room, destinations: RoomPosition[], center: RoomPosition) {
        const ret: UnserializedRoomPosition[] = [];
        for (const d of destinations) {
            for (const r of roadHelper.pavePath(center, d)) {
                if (r.isEdge) { continue; }
                ret.push(d);
            }
        }
        room.memory.secondaryRoads = ret;
    },

    getRoads(room: Room): RoomPosition[] {
        const layouts = layoutManager.getLayouts(room);
        const ret = [];
        for (const l of layouts) {
            const layout = l.layout;
            const pos = l.pos;
            const anchor = layout.anchor;
            for (const r of layout.road) {
                const _x = r.x - pos.x;
                const _y = r.y - pos.y;
                ret.push(new RoomPosition(_x, _y, room.name));
            }
        }
        return ret;
    },

    blockExits(room: Room) {
        const walls = [];
        const terrain = new Room.Terrain(room.name);
        let start = -1;
        let end = -1;
        // NORTH
        for (let x = 0; x < 50; x++) {
            if (terrain.get(x, 0) !== TERRAIN_MASK_WALL) {
                if (start === -1) {
                    start = x;
                } else {
                    end = x;
                }
            } else {
                if (start > 0) {
                    // end of exit segment

                    start = -1;
                    end = -1;
                }
            }
        }
    }
};

