import { PLAIN_COST, SWAMP_COST } from "config/config";
import { Traveler } from "utils/Traveler";
import { dynaControllerLayout } from "./layout/dynaControllerLayout";
import { dynaSourceLayout } from "./layout/dynaSourceLayout";
import { headLayout } from "./layout/headLayout";
import { noLayout } from "./layout/noLayout";
import { sealedLayout } from "./layout/sealedLayout"
import * as roomHelper from "./roomHelper"

export interface SingleLayout {
    pos: LightRoomPos;
    layout: RCLRoomLayout;
}

export function getLayouts(room: Room): SingleLayout[] {
    const ret: SingleLayout[] = [];
    if (!room.memory.layout) { return ret; }
    for (const l of room.memory.layout) {
        const flag = Game.flags[l.flagName];
        let layout;
        if (flag) {
            switch (l.name) {
                case "sealed":
                    layout = sealedLayout;
                    // ret.push({ pos: flag.pos, layout: sealedLayout });
                    break;
                case "head":
                    layout = headLayout;
                    // ret.push({ pos: flag.pos, layout: headLayout });
                    break;
                default:
                    layout = noLayout;
                // ret.push({ pos: flag.pos, layout: noLayout });
            }
        }
        if (layout) {
            const x = layout.anchor.x - flag.pos.x;
            const y = layout.anchor.y - flag.pos.y;
            ret.push({ pos: { x, y }, layout });
        }
        if (room.controller) {
            const pos = { x: 0, y: 0 };
            ret.push({ pos, layout: dynaControllerLayout(room) })
        }
        const sources = room.find(FIND_SOURCES);
        if (sources && sources.length > 0) {
            for (const s of sources) {
                const pos = { x: 0, y: 0 };
                ret.push({ pos, layout: dynaSourceLayout(room, s) })
            }
        }
        const mineral = room.find(FIND_MINERALS);
        if (mineral && mineral.length > 0) {
            const pos = { x: 0, y: 0 };
            ret.push({ pos, layout: dynaSourceLayout(room, mineral[0]) })
        }
    }
    return ret;
}

export function layoutCoord(room: Room, x: number, y: number) {
    const layout = getLayouts(room);
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
}

export function run(room: Room, rcl: number = -1, force: boolean = false): void {
    const layouts = getLayouts(room);
    if (!room.memory.buildState) { room.memory.buildState = 0; }
    for (const l of layouts) {
        const layout = l.layout;
        const pos = l.pos;
        if (rcl === -1 && room.controller) {
            let ret: ScreepsReturnCode = OK;
            console.log("layout building");
            for (let i = 1; i < room.controller.level + 1; i++) {
                if (force || !room.memory.buildState || room.memory.buildState < i) {
                    ret = runConstruct(room, layout[i], pos);
                    if (ret !== OK) {
                        console.log("Error building for RCL " + i);
                        // continue;
                    } else {
                        if (room.memory.buildState < i) { room.memory.buildState = i; };
                        console.log("RCL " + i + " built");
                    }
                }
            }
        } else {
            if (force || !room.memory.buildState || room.memory.buildState < rcl) {
                if (layout[rcl]) {
                    if (runConstruct(room, layout[rcl], pos) === OK) {
                        if (room.memory.buildState < rcl) { room.memory.buildState = rcl; };
                    }
                };
            }
        }
    }
};

function runConstruct(room: Room, layout: RoomLayout, pos: LightRoomPos): ScreepsReturnCode {
    let ret: ScreepsReturnCode = OK;
    if (layout) {
        for (const key in layout.build) {
            const _key = key as BuildableStructureConstant;
            const build = layout.build[key];
            for (const p of build) {
                const _x = p.x - pos.x;
                const _y = p.y - pos.y;
                const _ret = roomHelper.buildIfNotExist(new RoomPosition(_x, _y, room.name), key as BuildableStructureConstant);
                if (_ret !== OK) {
                    console.log("Error construct: " + ret);
                    if (ret === OK) { ret = _ret; }
                }

            }
        }
        if (layout.memory) {
            if (layout.memory.supervisor) {
                room.memory.supervisor = [];
                for (const sup of layout.memory.supervisor) {

                    const _x = sup.x - pos.x;
                    const _y = sup.y - pos.y;
                    room.memory.supervisor.push({ x: _x, y: _y });
                }
            }
        }
    }
    return ret;
}

export function getRoads(room: Room): RoomPosition[] {
    const layouts = getLayouts(room);
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
}

export function getUnbuiltRoads(pos: RoomPosition[]): RoomPosition[] {
    const ret = [];
    for (const r of pos) {
        if (!roomHelper.hasStructure(r, STRUCTURE_ROAD)) {
            ret.push(r);
        }
    }
    return ret;
}

export function pavePath(start: RoomPosition, finish: RoomPosition, rangeAllowance: number = 5): RoomPosition[] {
    const path = roomHelper.findPath(start, finish, rangeAllowance);
    const ret = [];

    if (path) {
        for (const p of path) {
            // if (!roomHelper.hasStructure(p, STRUCTURE_ROAD)) {
            ret.push(p);
            // }
        }
    }
    return ret;
}

