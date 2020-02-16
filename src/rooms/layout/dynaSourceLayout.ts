import { AutoLayout } from "rooms/AutoLayout";
import { roomHelper } from "rooms/roomHelper"


export function dynaSourceLayout(room: Room, source: Source | Mineral, closest: boolean): RCLRoomLayout {
    const ret: RCLRoomLayout = {
        anchor: { x: 0, y: 0 },
        road: []
    }

    if (!room.controller || !room.controller.my) { return ret; }
    const pos = source.pos;
    let spots: RoomPosition[] = [];
    const infrastruct = pos.findInRange(FIND_STRUCTURES, 2, { filter: x => x.structureType === STRUCTURE_CONTAINER || x.structureType === STRUCTURE_LINK || x.structureType === STRUCTURE_EXTENSION });
    if (infrastruct && infrastruct.length > 0) {
        spots = _.map(infrastruct, o => o.pos);
    }

    if (source instanceof Mineral) {
        if (room.terminal) {
            roomHelper.layoutPushPosition(ret, 6, STRUCTURE_EXTRACTOR, source.pos);
            roomHelper.layoutPushPosition(ret, 6, STRUCTURE_CONTAINER, roomHelper.getContainerPosition(source.pos));
        }
    }

    if (source instanceof Source) {
        const container = roomHelper.getContainerPosition(source.pos);
        roomHelper.layoutPushPosition(ret, 0, STRUCTURE_CONTAINER, roomHelper.getContainerPosition(source.pos));
        if (!room.memory.noLinkMine) {
            if (closest) {
                roomHelper.layoutPushPosition(ret, 7, STRUCTURE_LINK, roomHelper.getLinkPosition(source.pos, container));
            } else {
                roomHelper.layoutPushPosition(ret, 6, STRUCTURE_LINK, roomHelper.getLinkPosition(source.pos, container));
            }
        }
    }

    roomHelper.layoutPushPositions(ret, 6, STRUCTURE_RAMPART, spots);


    return ret;
}
