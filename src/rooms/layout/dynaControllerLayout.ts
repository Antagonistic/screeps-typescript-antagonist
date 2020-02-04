import * as roomHelper from "rooms/roomHelper"


export function dynaControllerLayout(room: Room): RCLRoomLayout {
    const ret: RCLRoomLayout = {
        anchor: { x: 0, y: 0 },
        road: []
    }

    if (!room.controller || !room.controller.my) { return ret; }
    const pos = room.controller.pos;

    const _spots = pos.openAdjacentSpots(true);
    let spots: LightRoomPos[] = _.map(_spots, o => ({ x: o.x, y: o.y }))

    const infrastruct = pos.findInRange(FIND_STRUCTURES, 3, { filter: x => x.structureType === STRUCTURE_CONTAINER || x.structureType === STRUCTURE_LINK || x.structureType === STRUCTURE_EXTENSION });
    if (infrastruct && infrastruct.length > 0) {
        spots = spots.concat(_.map(infrastruct, o => ({ x: o.pos.x, y: o.pos.y })));
    }

    return ret;
}
