import { AutoLayout } from "rooms/AutoLayout";
import * as roomHelper from "rooms/roomHelper"


export function dynaSourceLayout(room: Room, source: Source | Mineral): RCLRoomLayout {
    const ret: RCLRoomLayout = {
        anchor: { x: 0, y: 0 },
        road: []
    }

    if (!room.controller || !room.controller.my) { return ret; }
    const pos = source.pos;
    let spots: LightRoomPos[] = [];
    const infrastruct = pos.findInRange(FIND_STRUCTURES, 2, { filter: x => x.structureType === STRUCTURE_CONTAINER || x.structureType === STRUCTURE_LINK || x.structureType === STRUCTURE_EXTENSION });
    if (infrastruct && infrastruct.length > 0) {
        spots = _.map(infrastruct, o => ({ x: o.pos.x, y: o.pos.y }))


    }

    if (source instanceof Mineral) {
        const deposit = _.head(room.find(FIND_DEPOSITS));
        if (deposit) {
            if (room.terminal) {
                const extractor = [{ x: deposit.pos.x, y: deposit.pos.y }];
                const container = [AutoLayout.getSpotCandidate1(deposit.pos)!.lightRoomPos];
                ret[6] = { build: { rampart: spots, extractor, container } };
            }
        }
    } else {
        ret[6] = { build: { rampart: spots } };
    }


    return ret;
}
