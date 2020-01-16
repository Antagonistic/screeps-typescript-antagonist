import { Traveler } from "utils/Traveler";
// tslint:disable-next-line:ordered-imports
import { ROAD_COST, AVOID_COST, SWAMP_COST, PLAIN_COST } from "config/config";


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
    const structures = pos.lookFor(LOOK_STRUCTURES);
    if (_.any(structures, x => x.structureType === struct)) { return true; }
    const construct = pos.lookFor(LOOK_CONSTRUCTION_SITES);
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
    if (Game.rooms[pos.roomName] && Game.rooms[pos.roomName].getTerrain().get(pos.x, pos.y) === TERRAIN_MASK_WALL) { return OK; }
    if (struct === STRUCTURE_SPAWN) {
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

export function getRally(roomName: string): RoomPosition {
    const rallyFlag = Game.rooms[roomName].find(FIND_FLAGS, { filter: x => x.name.startsWith("rally") });
    if (rallyFlag && rallyFlag.length > 0) {
        return rallyFlag[0].pos;
    }
    return new RoomPosition(25, 25, roomName);
}

export function markPosition(pos: RoomPosition) {
    const room = Game.rooms[pos.roomName];
    if (!room) { return; }  // No visibility
    room.visual.circle(pos.x, pos.y, { fill: 'blue', radius: 0.55 });
}

export function createCostMatrix(roomName: string): CostMatrix | undefined {
    const room = Game.rooms[roomName];
    if (!room) {
        return undefined;
    }

    const matrix = new PathFinder.CostMatrix();

    // addTerrainToMatrix(matrix, roomName);

    Traveler.addStructuresToMatrix(room, matrix, ROAD_COST);

    // add construction sites too
    const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
    for (const site of constructionSites) {
        if (site.structureType === STRUCTURE_ROAD) {
            matrix.set(site.pos.x, site.pos.y, ROAD_COST);
        }
        else {
            matrix.set(site.pos.x, site.pos.y, 0xff);
        }
    }

    return matrix;
}

export function createPathfindingMatrix(roomName: string): boolean | CostMatrix {
    const room = Game.rooms[roomName];
    if (!room) {
        return true;
    }
    const matrix = createCostMatrix(roomName);
    if (!matrix) {
        return false;
    }

    // avoid controller
    if (room.controller) {
        blockOffPosition(matrix, room.controller, 3, AVOID_COST);
    }

    // avoid container/link adjacency
    const sources = room.find(FIND_SOURCES);
    for (const source of sources) {
        let structure = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: (x) => x.structureType === STRUCTURE_CONTAINER });
        if (!structure) {
            structure = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: (x) => x.structureType === STRUCTURE_LINK });
        }

        if (structure && structure.length > 0) {
            blockOffPosition(matrix, structure[0], 1, AVOID_COST);
        }
    }

    // avoid going too close to lairs
    for (const lair of room.find(FIND_STRUCTURES, { filter: (x) => x.structureType === STRUCTURE_KEEPER_LAIR })) {
        blockOffPosition(matrix, lair, 1, AVOID_COST);
    }

    return matrix;
}

export function blockOffPosition(costs: CostMatrix, roomObject: RoomObject, range: number, cost = 30) {
    const terrainLookup = Game.map.getRoomTerrain(roomObject.room!.name);
    for (let xDelta = -range; xDelta <= range; xDelta++) {
        for (let yDelta = -range; yDelta <= range; yDelta++) {
            const terrain = terrainLookup.get(roomObject.pos.x + xDelta, roomObject.pos.y + yDelta)
            if (terrain === TERRAIN_MASK_WALL) { continue; }
            costs.set(roomObject.pos.x + xDelta, roomObject.pos.y + yDelta, cost);
        }
    }
}

export function displayCostMatrix(costMatrix: CostMatrix, roomName?: string, dots = true, color = '#ffff00'): void {
    const vis = new RoomVisual(roomName);
    let x: number;
    let y: number;

    if (dots) {
        let cost: number;
        const max = AVOID_COST;
        /*for (y = 0; y < 50; ++y) {
            for (x = 0; x < 50; ++x) {
                cost = costMatrix.get(x, y);
                if (cost < 0xff) {
                    max = Math.max(max, costMatrix.get(x, y));
                }
            }
        }*/
        for (y = 0; y < 50; ++y) {
            for (x = 0; x < 50; ++x) {
                cost = costMatrix.get(x, y);
                if (cost === 0xff) {
                    vis.circle(x, y, { radius: 1 / 2, fill: '#ff0000' });
                } else if (cost > 0) {
                    vis.circle(x, y, { radius: costMatrix.get(x, y) / max / 2, fill: color });
                }
            }
        }
    } else {
        for (y = 0; y < 50; ++y) {
            for (x = 0; x < 50; ++x) {
                vis.text(costMatrix.get(x, y).toString(), x, y, { color });
            }
        }
    }
}


export function addTerrainToMatrix(matrix: CostMatrix, roomName: string) {
    const terrainLookup = Game.map.getRoomTerrain("E2S7");
    for (let x = 0; x < 50; x++) {
        for (let y = 0; y < 50; y++) {
            const terrain = terrainLookup.get(x, y);
            // const terrain = Game.map.getTerrainAt(x, y, roomName);
            if (terrain === TERRAIN_MASK_WALL) {
                matrix.set(x, y, 0xff);
            }
            else if (terrain === TERRAIN_MASK_SWAMP) {
                matrix.set(x, y, SWAMP_COST);
            }
            else {
                matrix.set(x, y, 1);
            }
        }
    }
    return;
}

export function findShortestPath(start: RoomPosition, goals: Array<{ pos: RoomPosition, id: string }>) {
    let shortest = 9999;
    let ret = null;
    for (const goal of goals) {
        const result = findPath(start, goal.pos, 1);
        if (result && result.length < shortest) {
            ret = goal;
            shortest = result.length;
        }
    }

    return ret;
}


export function findPath(start: RoomPosition, finish: RoomPosition, rangeAllowance: number): RoomPosition[] | undefined {
    const maxDistance = Game.map.getRoomLinearDistance(start.roomName, finish.roomName);
    const ret = PathFinder.search(start, [{ pos: finish, range: rangeAllowance }], {
        plainCost: PLAIN_COST,
        swampCost: SWAMP_COST,
        // tslint:disable-next-line:object-literal-sort-keys
        maxOps: 12000,
        roomCallback: (roomName: string): CostMatrix | boolean => {

            // disqualify rooms that involve a circuitous path
            if (Game.map.getRoomLinearDistance(start.roomName, roomName) > maxDistance) {
                return false;
            }

            const matrix = createPathfindingMatrix(roomName);


            return matrix;
        },
    });

    if (!ret.incomplete) {
        return ret.path;
    }
    return undefined;
}

export function lookForStructure(pos: RoomPosition, structureType: string): Structure {
    const structures = pos.lookFor(LOOK_STRUCTURES);
    return _.find(structures, { structureType }) as Structure;
}

export function clampDirection(direction: number): number {
    while (direction < 1) { direction += 8; }
    while (direction > 8) { direction -= 8; }
    return direction;
}
