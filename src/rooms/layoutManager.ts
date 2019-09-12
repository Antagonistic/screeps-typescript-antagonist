import { sealedLayout } from "./layout/sealedLayout"
import * as roomHelper from "./roomHelper"

export function run(room: Room, pos: RoomPosition, rcl: number = -1, force: boolean = false): void {
    const layout = sealedLayout;
    if (rcl === -1 && room.controller) {
        let ret: ScreepsReturnCode = OK;
        for (let i = 1; i < room.controller.level + 1; i++) {
            if (force || !room.memory.buildState || room.memory.buildState < i) {
                ret = runConstruct(room, layout[i], layout.anchor, pos);
                if (ret !== OK) {
                    console.log("Error building for RCL " + i);
                    // continue;
                } else {
                    if (room.memory.buildState < i) { room.memory.buildState = i; };
                }
            }
        }
    } else {
        if (force || !room.memory.buildState || room.memory.buildState < rcl) {
            if (layout[rcl]) {
                if (runConstruct(room, layout[rcl], layout.anchor, pos) === OK) {
                    if (room.memory.buildState < rcl) { room.memory.buildState = rcl; };
                }
            };
        }
    }
};

function runConstruct(room: Room, layout: RoomLayout, anchor: LightRoomPos, pos: RoomPosition): ScreepsReturnCode {
    let ret: ScreepsReturnCode = OK;
    if (layout) {
        for (const key in layout.build) {
            const _key = key as BuildableStructureConstant;
            const build = layout.build[key];
            for (const p of build) {
                const _x = p.x - anchor.x + pos.x;
                const _y = p.y - anchor.y + pos.y;
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

                    const _x = sup.x - anchor.x + pos.x;
                    const _y = sup.y - anchor.y + pos.y;
                    room.memory.supervisor.push({ x: _x, y: _y });
                }
            }
        }
    }
    return ret;
}
