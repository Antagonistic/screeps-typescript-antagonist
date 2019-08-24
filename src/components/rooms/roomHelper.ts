

export function openAdjacentSpots(pos: RoomPosition, ignoreCreeps?: boolean): RoomPosition[] {
    let positions = [];
    for (let i = 1; i <= 8; i++) {
        let testPosition = getPositionAtDirection(pos, i);

        if (isPassible(testPosition, ignoreCreeps)) {
            // passed all tests
            positions.push(testPosition);
        }
    }
    return positions;
};

export function getPositionAtDirection(pos: RoomPosition, direction: number, range?: number): RoomPosition {
    if (!range) {
        range = 1;
    }
    let x = pos.x;
    let y = pos.y;
    let room = pos.roomName;

    if (direction === 1) {
        y -= range;
    }
    else if (direction === 2) {
        y -= range;
        x += range;
    }
    else if (direction === 3) {
        x += range;
    }
    else if (direction === 4) {
        x += range;
        y += range;
    }
    else if (direction === 5) {
        y += range;
    }
    else if (direction === 6) {
        y += range;
        x -= range;
    }
    else if (direction === 7) {
        x -= range;
    }
    else if (direction === 8) {
        x -= range;
        y -= range;
    }
    return new RoomPosition(x, y, room);
};

export function isPassible(pos: RoomPosition, ignoreCreeps?: boolean): boolean {
    if (isNearExit(pos, 0)) return false;

    // look for walls
    if (_.head(pos.lookFor(LOOK_TERRAIN)) !== "wall") {

        // look for creeps
        if (ignoreCreeps || pos.lookFor(LOOK_CREEPS).length === 0) {

            // look for impassible structions
            if (_.filter(pos.lookFor(LOOK_STRUCTURES), (struct: Structure) => {
                return struct.structureType !== STRUCTURE_ROAD
                    && struct.structureType !== STRUCTURE_CONTAINER
                    && struct.structureType !== STRUCTURE_RAMPART;
            }).length === 0) {

                // passed all tests
                return true;
            }
        }
    }

    return false;
};

export function isNearExit(pos: RoomPosition, range: number): boolean {
    return pos.x - range <= 0 || pos.x + range >= 49 || pos.y - range <= 0 || pos.y + range >= 49;
};
