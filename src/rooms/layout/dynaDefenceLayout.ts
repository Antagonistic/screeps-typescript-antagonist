import * as roomHelper from "rooms/roomHelper"

export function dynaDefenceLayout(room: Room): RCLRoomLayout {
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
    const towers = room.find(FIND_MY_STRUCTURES, { filter: x => x.structureType === STRUCTURE_TOWER });
    if (towers && towers.length > 0) {
        for (const t of towers) {
            spots.push(t.pos);
        }
    }

    if (room.storage) {
        spots.push(room.storage.pos);
    }

    ret[3] = { build: { rampart: spots } };

    return ret;
}
