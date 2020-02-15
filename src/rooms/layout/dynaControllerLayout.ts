import { roomHelper } from "rooms/roomHelper"


export function dynaControllerLayout(room: Room): RCLRoomLayout {
    const ret: RCLRoomLayout = {
        anchor: { x: 0, y: 0 },
        road: []
    }

    if (!room.controller || !room.controller.my) { return ret; }
    const pos = room.controller.pos;

    let spots = pos.openAdjacentSpots(true);

    const infrastruct = pos.findInRange(FIND_STRUCTURES, 3, { filter: x => x.structureType === STRUCTURE_CONTAINER || x.structureType === STRUCTURE_LINK || x.structureType === STRUCTURE_EXTENSION });
    if (infrastruct && infrastruct.length > 0) {
        spots = spots.concat(_.map(infrastruct, x => x.pos));
    }
    roomHelper.layoutPushPositions(ret, 6, STRUCTURE_RAMPART, spots);

    const isCloseStore = pos.findInRange(FIND_STRUCTURES, 3, { filter: x => x.structureType === STRUCTURE_STORAGE }).length > 0;
    if (!isCloseStore) {
        if (room.controller.level < 6) {
            roomHelper.layoutPushPosition(ret, 1, STRUCTURE_CONTAINER, roomHelper.getControllerContainerPosition(pos));
        }
        if (room.controller.level >= 5) {
            roomHelper.layoutPushPosition(ret, 5, STRUCTURE_LINK, roomHelper.getControllerLinkPosition(pos));
        }
    }

    return ret;
}
