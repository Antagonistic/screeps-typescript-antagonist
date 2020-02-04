import { AutoSnakeLayout } from "rooms/AutoSnakeLayout";

export function snakeLayout(room: Room, flag: Flag): RCLRoomLayout {
    const ret: RCLRoomLayout = {
        anchor: { x: flag.pos.x, y: flag.pos.y },
        road: [],
        1: {
            build: {
                spawn: [{ x: 0, y: 0 }]
            }
        }
    }

    const autoLayout = new AutoSnakeLayout(room.name);
    autoLayout.run();



    ret[0] = { build: { spawn: [autoLayout.spawn!.lightRoomPos] } }
    ret[1] = { build: { road: _.map(autoLayout.road1!, x => x.lightRoomPos), extension: _.map(autoLayout.getExt(), x => x.lightRoomPos) } }
    ret[2] = { build: { road: _.map(autoLayout.road2!, x => x.lightRoomPos) } }
    ret[4] = { build: { storage: [autoLayout.storage!.lightRoomPos] } }

    // console.log(JSON.stringify(ret));
    return ret;
}


