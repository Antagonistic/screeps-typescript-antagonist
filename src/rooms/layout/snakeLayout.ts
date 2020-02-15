import { AutoSnakeLayout } from "rooms/AutoSnakeLayout";
import { roomHelper } from "rooms/roomHelper";

export function snakeLayout(room: Room, flag: Flag): RCLRoomLayout {
    const ret: RCLRoomLayout = {
        anchor: { x: flag.pos.x, y: flag.pos.y },
        road: [],
        1: {
            build: {
                spawn: [{ x: 0, y: 0 }]
            },
            memory: {
                noLinkMine: true,
                noRemote: true,
            }
        }
    }

    const autoLayout = new AutoSnakeLayout(room.name);
    autoLayout.run();


    roomHelper.layoutPushPosition(ret, 0, STRUCTURE_SPAWN, autoLayout.spawn);

    roomHelper.layoutPushPositions(ret, 1, STRUCTURE_ROAD, autoLayout.road1);
    roomHelper.layoutPushPositions(ret, 1, STRUCTURE_EXTENSION, autoLayout.getExt());

    roomHelper.layoutPushPositions(ret, 2, STRUCTURE_ROAD, autoLayout.road2);

    roomHelper.layoutPushPosition(ret, 3, STRUCTURE_TOWER, autoLayout.getTower());

    roomHelper.layoutPushPosition(ret, 4, STRUCTURE_STORAGE, autoLayout.storage);

    return ret;
}


