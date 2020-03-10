// tslint:disable-next-line:ordered-imports
import { AVOID_COST, PLAIN_COST, ROAD_COST, SWAMP_COST } from "config/config";
import { BodyFactory } from "creeps/BodyFactory";
import { LayoutPath } from "creeps/Movement";
import { Traveler } from "utils/Traveler";

export const roomHelper = {
    getRally(roomName: string): RoomPosition {
        const rallyFlag = Game.rooms[roomName].find(FIND_FLAGS, { filter: x => x.name.startsWith("rally") });
        if (rallyFlag && rallyFlag.length > 0) {
            return rallyFlag[0].pos;
        }
        return new RoomPosition(25, 25, roomName);
    },

    markPosition(pos: RoomPosition) {
        const room = Game.rooms[pos.roomName];
        if (!room) { return; }  // No visibility
        room.visual.circle(pos.x, pos.y, { fill: 'blue', radius: 0.55 });
    },

    createCostMatrix(roomName: string): CostMatrix | undefined {
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
    },

    createPathfindingMatrix(roomName: string): boolean | CostMatrix {
        const room = Game.rooms[roomName];
        if (!room) {
            return true;
        }
        const matrix = new PathFinder.CostMatrix();

        Traveler.addStructuresToMatrix(room, matrix, ROAD_COST);
        // addTerrainToMatrix(matrix, roomName);

        // avoid controller
        if (room.controller) {
            roomHelper.blockOffPosition(matrix, room.controller.pos, 3, AVOID_COST);
            roomHelper.blockOffPosition(matrix, room.controller.pos, 2, AVOID_COST + 3);
        }

        // avoid container/link adjacency
        const sources = room.find(FIND_SOURCES);
        for (const source of sources) {
            let structure = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: (x) => x.structureType === STRUCTURE_CONTAINER });
            if (!structure) {
                structure = source.pos.findInRange(FIND_STRUCTURES, 1, { filter: (x) => x.structureType === STRUCTURE_LINK });
            }

            if (structure && structure.length > 0) {
                roomHelper.blockOffPosition(matrix, structure[0].pos, 1, AVOID_COST);
            }
        }

        // avoid going too close to lairs
        for (const lair of room.find(FIND_STRUCTURES, { filter: (x) => x.structureType === STRUCTURE_KEEPER_LAIR })) {
            roomHelper.blockOffPosition(matrix, lair.pos, 1, AVOID_COST);
        }

        return matrix;
    },

    blockOffPosition(costs: CostMatrix, roomPos: RoomPosition | UnserializedRoomPosition, range: number, cost = 30, terrainLookup?: RoomTerrain) {
        if (!terrainLookup) {
            terrainLookup = Game.map.getRoomTerrain(roomPos.roomName);
        }
        for (let xDelta = -range; xDelta <= range; xDelta++) {
            for (let yDelta = -range; yDelta <= range; yDelta++) {
                const _x = roomPos.x + xDelta;
                const _y = roomPos.y + yDelta;
                const terrain = terrainLookup.get(_x, _y)
                if (terrain === TERRAIN_MASK_WALL) { continue; }
                costs.set(_x, _y, Math.max(costs.get(_x, _y), cost));
            }
        }
    },

    displayCostMatrix(costMatrix: CostMatrix, roomName?: string, dots = true, color = '#ffff00'): void {
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
    },


    addTerrainToMatrix(matrix: CostMatrix, roomName: string) {
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
    },

    findShortestPath(start: RoomPosition, goals: Array<{ pos: RoomPosition, id: Id<Structure> }>) {
        let shortest = 9999;
        let ret = null;
        for (const goal of goals) {
            const result = roomHelper.findPath(start, goal.pos, 1);
            if (result && result.length < shortest) {
                ret = goal;
                shortest = result.length;
            }
        }

        return ret;
    },


    findPath(start: RoomPosition, finish: RoomPosition, rangeAllowance: number): RoomPosition[] | undefined {
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

                const matrix = roomHelper.createPathfindingMatrix(roomName);


                return matrix;
            },
        });

        if (!ret.incomplete) {
            return ret.path;
        }
        return undefined;
    },

    clampDirection(direction: number): number {
        while (direction < 1) { direction += 8; }
        while (direction > 8) { direction -= 8; }
        return direction;
    },

    cartAnalyze(dist: number, load: number, spawnRoom: SpawnRoom, offRoad: boolean = false): cartAnalyze {
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
    },

    workAnalyze(workNeeded: number, spawnRoom: SpawnRoom, offRoad: boolean = false): workAnalyze {
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
    },

    deserializeRoomPosition(roomPosition?: UnserializedRoomPosition | RoomPosition): RoomPosition {
        if (!roomPosition) { throw "Empty roomPosition" }
        return new RoomPosition(roomPosition.x, roomPosition.y, roomPosition.roomName);
    },

    deserializeRoomPositions(roomPositions?: Array<UnserializedRoomPosition | RoomPosition>): RoomPosition[] {
        const ret: RoomPosition[] = [];
        if (!roomPositions) { return ret; }
        for (const p of roomPositions) {
            ret.push(new RoomPosition(p.x, p.y, p.roomName));
        }
        return ret;
    },

    intersection<T extends UnserializedRoomPosition>(posList1: T[], posList2: T[]): T[] {
        const posList2Numbers = posList2.map((el) => (el.x + 1) * 50 + el.y);

        // Create a set and add all numbers from poslist2
        const posSet = new Set();
        posList2Numbers.forEach((num) => posSet.add(num));

        // Filter posList1 by member-testing the Set.
        const intersection = posList1.filter((el) => posSet.has((el.x + 1) * 50 + el.y));
        return intersection;
    },

    unique<T extends UnserializedRoomPosition>(posList1: T[]) {
        return _.unique(posList1, false, (el) => (el.x + 1) * 50 + el.y);
    },

    layoutPushPosition(layout: RCLRoomLayout, rcl: number, struct: BuildableStructureConstant, pos?: RoomPosition) {
        if (pos) {
            if (!layout[rcl]) { layout[rcl] = { build: {} } };
            layout[rcl].build[struct] = [pos.lightRoomPos]
        }
    },

    layoutPushPositions(layout: RCLRoomLayout, rcl: number, struct: BuildableStructureConstant, pos?: RoomPosition[]) {
        if (pos && pos.length > 0) {
            pos = _.unique(pos);
            if (!layout[rcl]) { layout[rcl] = { build: {} } };
            layout[rcl].build[struct] = _.map(pos, x => x.lightRoomPos);
        }
    },

    getRoomWallLevel(room: Room, forceCheck: boolean = false) {
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
                    if (room.storage && room.storage.store.energy > 100000 && room.memory.fort < 500000) {
                        room.memory.fort = room.memory.fort += 10000;
                        console.log('FORT: ' + room.print + ' new fort level: ' + room.memory.fort);
                    }
                }
            } else {
                room.memory.fort = undefined;
            }
        }
        return room.memory.fort || 0;
    },
    getRoomCoord(roomName: string): RoomCoord {
        const worldSize = 256;
        const room = /^([WE])([0-9]+)([NS])([0-9]+)$/.exec(roomName);
        if (!room) {
            throw new Error('Invalid room name');
        }
        const rx = worldSize / 2 + (room[1] === 'W' ? -Number(room[2]) : Number(room[2]) + 1);
        const ry = worldSize / 2 + (room[3] === 'N' ? -Number(room[4]) : Number(room[4]) + 1);
        if (!(rx >= 0 && rx <= worldSize && ry >= 0 && ry <= worldSize)) {
            throw new Error('Invalid room name');
        }
        return { xx: rx, yy: ry };
    },
    getRoomUUID(roomName: string): number {
        const worldSize = 256;
        const coord = this.getRoomCoord(roomName);
        return 256 * coord.xx + coord.yy;
    },
    roomType(roomName: string): 'SK' | 'CORE' | 'CTRL' | 'ALLEY' {
        const coords = roomHelper.getRoomCoord(roomName);
        const _x = coords.xx > 0 ? coords.xx - 1 : coords.xx;
        const _y = coords.yy > 0 ? coords.yy - 1 : coords.yy;
        if (_x % 10 === 0 || _y % 10 === 0) {
            return 'ALLEY';
        } else if (_x % 10 !== 0 && _x % 5 === 0 && _y % 10 !== 0 && _y % 5 === 0) {
            return 'CORE';
        } else if (_x % 10 <= 6 && _x % 10 >= 4 && _y % 10 <= 6 && _y % 10 >= 4) {
            return 'SK';
        } else {
            return 'CTRL';
        }
    },

    findClosestPlainTile(pos: RoomPosition): RoomPosition {
        const terrain = Game.map.getRoomTerrain(pos.roomName);
        for (let range = 1; range < 20; range++) {
            for (let x = pos.x - range; x < pos.x + range; x++) {
                for (let y = pos.y - range; y < pos.y + range; y++) {
                    if (terrain.get(x, y) === 0) {
                        return new RoomPosition(x, y, pos.roomName);
                    }
                }
            }
        }
        return pos;
    },

    getSpotCandidate1(pos: RoomPosition, center?: RoomPosition) {
        let spots = pos.openAdjacentSpots(true, true);
        if (spots.length === 0) { return undefined; }
        if (!center) {
            return _.max(spots, (x: RoomPosition) => x.openAdjacentSpots(true, true).length);
        } else {
            spots = spots.filter(x => x.openAdjacentSpots(true, true).length >= 5);
            if (spots.length === 0) { return _.max(pos.openAdjacentSpots(true, true), (x: RoomPosition) => x.openAdjacentSpots(true, true).length); }
            return LayoutPath.findClosestByPathLayout(center, spots);
        }
    },

    getSpotCandidate2(pos: RoomPosition, center?: RoomPosition) {
        const spots = pos.openAdjacentSpots(true, true);
        if (spots.length === 0) { return undefined; }
        const spots2 = roomHelper.unique(_.flatten(spots.map(x => x.openAdjacentSpots(true, true))));
        if (spots2.length === 0) { return this.getSpotCandidate1(pos, center); }
        if (!center) {
            return _.max(spots2, (x: RoomPosition) => x.openAdjacentSpots(true, true).length);
        } else {
            const _spots2 = spots2.filter(x => x.openAdjacentSpots(true, true).length >= 5);
            if (_spots2.length === 0) { return _.max(spots2, (x: RoomPosition) => x.openAdjacentSpots(true, true).length); }
            return LayoutPath.findClosestByPathLayout(center, _spots2);
        }
    },

    getSpotCandidate3(pos: RoomPosition, center?: RoomPosition) {
        const spots = pos.openAdjacentSpots(true, true);
        if (spots.length === 0) { return undefined; }
        const spots2 = roomHelper.unique(_.flatten(spots.map(x => x.openAdjacentSpots(true, true))));
        if (spots2.length === 0) { return this.getSpotCandidate1(pos, center); }
        const spots3 = roomHelper.unique(_.flatten(spots2.map(x => x.openAdjacentSpots(true, true))));
        if (spots3.length === 0) { return this.getSpotCandidate2(pos, center); }
        if (!center) {
            return _.max(spots3, (x: RoomPosition) => x.openAdjacentSpots(true, true).length);
        } else {
            const _spots3 = spots3.filter(x => x.openAdjacentSpots(true, true).length >= 5);
            if (_spots3.length === 0) { return _.max(spots3, (x: RoomPosition) => x.openAdjacentSpots(true, true).length); }
            return LayoutPath.findClosestByPathLayout(center, _spots3);
        }
    },

    getContainerPosition(point: RoomPosition, center?: RoomPosition) {
        if (!center) {
            if (Memory.rooms[point.roomName].center) {
                center = roomHelper.deserializeRoomPosition(Memory.rooms[point.roomName].center);
            } else {
                center = new RoomPosition(25, 25, point.roomName);
            }
        }
        const spot = this.getSpotCandidate1(point, center);
        return spot || _.head(point.openAdjacentSpots(true, true));
    },

    getLinkPosition(point: RoomPosition, container: RoomPosition, center?: RoomPosition) {
        if (!center) {
            if (Memory.rooms[point.roomName].center) {
                center = roomHelper.deserializeRoomPosition(Memory.rooms[point.roomName].center);
            } else {
                center = new RoomPosition(25, 25, point.roomName);
            }
        }
        return this.getSpotCandidate1(container, center) || _.head(point.openAdjacentSpots(true, true));
    },

    getControllerContainerPosition(point: RoomPosition) {
        let center;
        if (Memory.rooms[point.roomName].center) {
            center = roomHelper.deserializeRoomPosition(Memory.rooms[point.roomName].center);
        } else {
            center = new RoomPosition(25, 25, point.roomName);
        }
        return this.getSpotCandidate2(point, center) || _.head(point.openAdjacentSpots(true, true));
    },

    getControllerLinkPosition(point: RoomPosition) {
        let center;
        if (Memory.rooms[point.roomName].center) {
            center = roomHelper.deserializeRoomPosition(Memory.rooms[point.roomName].center);
        } else {
            center = new RoomPosition(25, 25, point.roomName);
        }
        return this.getSpotCandidate3(point, center) || _.head(point.openAdjacentSpots(true, true));
    },
};
