import { headLayout } from "./layout/headLayout";

export function run(room: Room, base: boolean = true, rcl: number = -1, force: boolean = false): void {
    const layout = headLayout;
    if (rcl === -1 && room.controller) {
        let ret: ScreepsReturnCode = OK;
        for (let i = 1; i < room.controller.level + 1; i++) {
            if (force || !room.memory.buildState || room.memory.buildState < i) {
                ret = runConstruct(room, layout[i]);
                if (ret !== OK) {
                    console.log("Error building for RCL " + i);
                    continue;
                } else {
                    if (room.memory.buildState < i) { room.memory.buildState = i; };
                }
            }
        }
    } else {
        if (force || !room.memory.buildState || room.memory.buildState < rcl) {
            if (layout[rcl]) {
                if (runConstruct(room, layout[rcl]) === OK) {
                    if (room.memory.buildState < rcl) { room.memory.buildState = rcl; };
                }
            };
        }
    }
};

function runConstruct(room: Room, layout: RoomLayout): ScreepsReturnCode {
    let ret: ScreepsReturnCode = OK;
    for (const key in layout.build) {
        const _key = key as BuildableStructureConstant;
        const build = layout.build[key];
        for (const p of build) {
            const _ret: ScreepsReturnCode = room.createConstructionSite(p.x, p.y, _key) || ret;
            if (_ret !== OK) { ret = _ret; }
        }
    }
    return ret;
}

