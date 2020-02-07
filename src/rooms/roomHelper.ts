// tslint:disable-next-line:ordered-imports
import { AVOID_COST, PLAIN_COST, ROAD_COST, SWAMP_COST } from "config/config";
import { BodyFactory } from "creeps/BodyFactory";
import { Traveler } from "utils/Traveler";

export function hasStructure(pos: RoomPosition, struct: BuildableStructureConstant, clear: boolean = false): boolean {
    if (Game.map.getRoomTerrain(pos.roomName).get(pos.x, pos.y) === TERRAIN_MASK_WALL && struct !== STRUCTURE_EXTRACTOR) { return true; }
    const structures = pos.lookFor(LOOK_STRUCTURES);
    if (_.any(structures, x => x.structureType === struct)) { return true; }
    const construct = pos.lookFor(LOOK_CONSTRUCTION_SITES);
    if (_.any(construct, x => x.structureType === struct)) { return true; }
    if (clear && struct !== "road" && struct !== "rampart" && struct !== "container") {
        const road = _.find(structures, x => x.structureType === STRUCTURE_ROAD);
        if (road) { road.destroy(); }
        const constRoad = _.find(construct, x => x.structureType === STRUCTURE_ROAD);
        if (constRoad) { constRoad.remove(); }
    }
    return false;
}

export function buildIfNotExist(pos: RoomPosition, struct: BuildableStructureConstant, name?: string): ScreepsReturnCode {
    if (hasStructure(pos, struct)) { return OK; }
    let ret: ScreepsReturnCode;
    if (Game.rooms[pos.roomName] && Game.rooms[pos.roomName].getTerrain().get(pos.x, pos.y) === TERRAIN_MASK_WALL && struct !== STRUCTURE_EXTRACTOR) { return OK; }
    if (struct === STRUCTURE_SPAWN) {
        if (!name) {
            name = "Spawn_" + pos.roomName + "_" + Memory.uuid++;
        }
        ret = pos.createConstructionSite(STRUCTURE_SPAWN, name)
    } else {
        ret = pos.createConstructionSite(struct);
    }
    if (ret !== OK) {
        if (ret === ERR_RCL_NOT_ENOUGH) {
            return ret;
        }
        console.log("Failed to construct " + struct + " at " + pos.print + "! " + ret);

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
    /*const constructionSites = room.find(FIND_MY_CONSTRUCTION_SITES);
    for (const site of constructionSites) {
        if (site.structureType === STRUCTURE_ROAD) {
            matrix.set(site.pos.x, site.pos.y, ROAD_COST);
        }
        else {
            matrix.set(site.pos.x, site.pos.y, 0xff);
        }
    }*/

    return matrix;
}

export function createPathfindingMatrix(roomName: string): boolean | CostMatrix {
    const room = Game.rooms[roomName];
    if (!room) {
        return true;
    }
    const matrix = new PathFinder.CostMatrix();

    Traveler.addStructuresToMatrix(room, matrix, ROAD_COST);
    // addTerrainToMatrix(matrix, roomName);

    // avoid controller
    if (room.controller) {
        blockOffPosition(matrix, room.controller, 3, AVOID_COST);
        blockOffPosition(matrix, room.controller, 2, AVOID_COST + 3);
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
            const _x = roomObject.pos.x + xDelta;
            const _y = roomObject.pos.y + yDelta;
            const terrain = terrainLookup.get(_x, _y)
            if (terrain === TERRAIN_MASK_WALL) { continue; }
            costs.set(_x, _y, Math.max(costs.get(_x, _y), cost));
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

export function clampDirection(direction: number): number {
    while (direction < 1) { direction += 8; }
    while (direction > 8) { direction -= 8; }
    return direction;
}

export function cartAnalyze(dist: number, load: number, spawnRoom: SpawnRoom, offRoad: boolean = false): cartAnalyze {
    const maxEnergy = spawnRoom.energyCapacityAvailable;
    // console.log('offRoad ' + offRoad);
    // console.log('maxEnergy ' + maxEnergy);
    const maxParts = Math.min(Math.floor(offRoad ? (maxEnergy / 200) : (maxEnergy / 150)), 16);
    // console.log('maxParts ' + maxParts);
    const throughput = dist * load * 2.1;
    // console.log('throughput ' + throughput);
    const carryNeeded = Math.ceil(throughput / (CARRY_CAPACITY * 2));
    // console.log('carryNeeded ' + carryNeeded);
    const cartsNeed = Math.max(Math.ceil(carryNeeded / maxParts), 1);
    // console.log('cartsNeed ' + cartsNeed);
    const carryNeed = Math.min(Math.max(Math.floor(carryNeeded / cartsNeed), 1) + 1, maxParts);
    // console.log('carryNeed ' + carryNeed);
    return { count: cartsNeed, carry: carryNeed };
}

export function workAnalyze(workNeeded: number, spawnRoom: SpawnRoom, offRoad: boolean = false): workAnalyze {
    const maxEnergy = spawnRoom.energyCapacityAvailable;
    let unitCost;
    let potency;
    if (offRoad || maxEnergy <= 450) {
        unitCost = BodyFactory.calculateBodyCost(BodyFactory.workerBody(1, 1, 1))
        potency = 1;
    } else {
        unitCost = BodyFactory.calculateBodyCost(BodyFactory.workerBody(3, 1, 2))
        potency = 3;
    }
    const maxParts = Math.min(Math.floor(maxEnergy / unitCost), 20);
    const potencyNeeded = Math.ceil(workNeeded / potency)
    const workersNeeded = Math.max(Math.ceil(potencyNeeded / maxParts), 1);
    const workPerWorker = Math.min(Math.max(Math.ceil(potencyNeeded / workersNeeded), 1), maxParts) * potency;
    // console.log('maxEnergy: ' + maxEnergy + ' unitCost: ' + unitCost + ' maxParts: ' + maxParts + ' potencyNeeded: ' + potencyNeeded + ' workersNeeded: ' + workersNeeded + ' workPerWorker: ' + workPerWorker);
    return { count: workersNeeded, work: workPerWorker };
}

export function getRoomCoordinates(roomName: string): RoomCoord {

    const coordinateRegex = /(E|W)(\d+)(N|S)(\d+)/g;
    const match = coordinateRegex.exec(roomName);
    if (!match) { return { x: 0, y: 0, xDir: "", yDir: "" }; }

    const xDir = match[1];
    const x = match[2];
    const yDir = match[3];
    const y = match[4];

    return {
        x: Number(x),
        xDir,
        y: Number(y),
        yDir,
    };
}

export function deserializeRoomPosition(roomPosition?: UnserializedRoomPosition | RoomPosition): RoomPosition | undefined {
    if (!roomPosition) { return undefined; }
    return new RoomPosition(roomPosition.x, roomPosition.y, roomPosition.roomName);
}

export function deserializeRoomPositions(roomPositions?: Array<UnserializedRoomPosition | RoomPosition>): RoomPosition[] {
    const ret: RoomPosition[] = [];
    if (!roomPositions) { return ret; }
    for (const p of roomPositions) {
        ret.push(new RoomPosition(p.x, p.y, p.roomName));
    }
    return ret;
}

export function layoutPushPosition(layout: RCLRoomLayout, rcl: number, struct: BuildableStructureConstant, pos?: RoomPosition) {
    if (pos) {
        if (!layout[rcl]) { layout[rcl] = { build: {} } };
        layout[rcl].build[struct] = [pos.lightRoomPos]
    }
}

export function layoutPushPositions(layout: RCLRoomLayout, rcl: number, struct: BuildableStructureConstant, pos?: RoomPosition[]) {
    if (pos && pos.length > 0) {
        if (!layout[rcl]) { layout[rcl] = { build: {} } };
        layout[rcl].build[struct] = _.map(pos, x => x.lightRoomPos);
    }
}

/**
 * Get the type of the room
 */
export function roomType(roomName: string): 'SK' | 'CORE' | 'CTRL' | 'ALLEY' {
    const coords = getRoomCoordinates(roomName);
    if (coords.x % 10 === 0 || coords.y % 10 === 0) {
        return 'ALLEY';
    } else if (coords.x % 10 !== 0 && coords.x % 5 === 0 && coords.y % 10 !== 0 && coords.y % 5 === 0) {
        return 'CORE';
    } else if (coords.x % 10 <= 6 && coords.x % 10 >= 4 && coords.y % 10 <= 6 && coords.y % 10 >= 4) {
        return 'SK';
    } else {
        return 'CTRL';
    }
}

export function getRoomWallLevel(room: Room, forceCheck: boolean = false) {
    if (!room.memory.fort) {
        room.memory.fort = 10000;
    }
    if (forceCheck || Game.time % 200 === 20) {
        if (room.controller && room.controller.my && room.controller.level >= 5) {
            const walls = room.find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART });
            const maxWall = _.max(walls, x => x.hits).hits;
            const minWall = _.min(walls, x => x.hits).hits;
            console.log('FORT: ' + room.print + ' minWall: ' + minWall + '  maxWall: ' + maxWall + ' fort: ' + room.memory.fort);
            if (minWall > room.memory.fort * 0.9) {
                if (room.storage && room.storage.store.energy > 100000) {
                    room.memory.fort = room.memory.fort += 10000;
                    console.log('FORT: ' + room.print + ' new fort level: ' + room.memory.fort);
                }
            }
        } else {
            room.memory.fort = undefined;
        }
    }
    return room.memory.fort || 0;
}
