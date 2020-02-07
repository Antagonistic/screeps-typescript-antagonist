import { AutoSnakeLayout } from "rooms/AutoSnakeLayout";
import { layoutPushPosition, layoutPushPositions } from "rooms/roomHelper";

export function snakeLayout(room: Room, flag: Flag): RCLRoomLayout {
    const ret: RCLRoomLayout = {
        anchor: { x: flag.pos.x, y: flag.pos.y },
        road: [],
        1: {
            build: {
                spawn: [{ x: 0, y: 0 }]
            },
            memory: {
                noRemote: true
            }
        }
    }

    const autoLayout = new AutoSnakeLayout(room.name);
    autoLayout.run();


    layoutPushPosition(ret, 0, STRUCTURE_SPAWN, autoLayout.spawn);

    layoutPushPositions(ret, 1, STRUCTURE_ROAD, autoLayout.road1);
    layoutPushPositions(ret, 1, STRUCTURE_EXTENSION, autoLayout.getExt());

    layoutPushPositions(ret, 2, STRUCTURE_ROAD, autoLayout.road2);

    layoutPushPosition(ret, 3, STRUCTURE_TOWER, autoLayout.getTower());

    layoutPushPosition(ret, 4, STRUCTURE_STORAGE, autoLayout.storage);

    return ret;
}


