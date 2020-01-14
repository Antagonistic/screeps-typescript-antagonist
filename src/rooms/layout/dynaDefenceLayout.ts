import * as roomHelper from "rooms/roomHelper"

export function dynaControllerLayout(room: Room): RCLRoomLayout {
    const ret: RCLRoomLayout = {
        anchor: { x: 0, y: 0 },
        road: []
    }

    const spots: LightRoomPos[] = [];
    const spawns = room.find(FIND_MY_SPAWNS);
    if (spawns && spawns.length > 0) {
        for (const s of spawns) {
            spots.push(s.pos);
        }
    }

    if (room.storage) {
        spots.push(room.storage.pos);
    }

    ret[6] = { build: { rampart: spots } };

    return ret;
}
