
export function noLayout(room: Room, flag: Flag): RCLRoomLayout {
    const ret: RCLRoomLayout = {
        anchor: { x: 0, y: 0 },
        road: [],
        1: {
            build: {
                spawn: [{ x: 0, y: 0 }]
            }
        }
    }
    return ret;
}
