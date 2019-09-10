

export function openAdjacentSpots(pos: RoomPosition, ignoreCreeps?: boolean): RoomPosition[] {
    const positions = [];
    for (let i = 1; i <= 8; i++) {
        const testPosition = getPositionAtDirection(pos, i);

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
    const room = pos.roomName;

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
    if (isNearExit(pos, 0)) { return false; }

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

export function hasStructure(pos: RoomPosition, struct: BuildableStructureConstant): boolean {
    const structures = pos.lookFor("structure");
    if (_.any(structures, x => x.structureType === struct)) { return true; }
    const construct = pos.lookFor("constructionSite");
    if (_.any(construct, x => x.structureType === struct)) { return true; }
    if (struct !== "road" && struct !== "rampart" && struct !== "container") {
        const road = _.findLast(structures, x => x.structureType === STRUCTURE_ROAD);
        if (road) { road.destroy(); }
        const constRoad = _.findLast(construct, x => x.structureType === STRUCTURE_ROAD);
        if (constRoad) { constRoad.remove(); }
    }
    return false;
}

export function buildIfNotExist(pos: RoomPosition, struct: BuildableStructureConstant, name?: string): ScreepsReturnCode {
    if (hasStructure(pos, struct)) { return OK; }
    let ret: ScreepsReturnCode;
    if (struct === STRUCTURE_POWER_SPAWN) {
        if (!name) {
            name = "Spawn_" + pos.roomName + "_" + Memory.uuid++;
        }
        ret = pos.createConstructionSite(STRUCTURE_SPAWN, name)
    } else {
        ret = pos.createConstructionSite(struct);
    }
    if (ret !== OK) {
        console.log("Failed to construct " + struct + " at " + pos.x + "," + pos.y + "!");
    }
    return ret;
}

export function isNearExit(pos: RoomPosition, range: number): boolean {
    return pos.x - range <= 0 || pos.x + range >= 49 || pos.y - range <= 0 || pos.y + range >= 49;
};
