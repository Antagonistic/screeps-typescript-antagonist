import * as roomHelper from "rooms/roomHelper";

export class AutoLayout {
    public roomName: string;
    public walkableMatrix?: CostMatrix;
    public gridWalkableMatrix?: CostMatrix;
    public distanceMatrix?: CostMatrix;
    public distanceCartMatrix?: CostMatrix;
    public walls?: RoomPosition[];
    public testMatrix?: CostMatrix;
    public visual: RoomVisual;
    constructor(roomName: string) {
        this.roomName = roomName;
        this.visual = new RoomVisual(this.roomName);
    }

    public run() {
        // this.distanceMatrix = this.distanceTransform();
        // this.gridWalkableMatrix = this.ComputeWalkableGridMatrix();
        // const cost = roomHelper.createPathfindingMatrix(this.roomName);
        if (Game.rooms[this.roomName]) {
            // roomHelper.blockOffPosition(cost, Game.rooms[this.roomName].controller!, 3, 0xff);
            this.testMatrix = this.combine(this.getWalkableGridMatrix(), this.blockOffMatrix());
            this.viewCostMatrix(this.testMatrix);
            // this.visual.poly(roomHelper.findPath(Game.rooms[this.roomName].controller!.pos, new RoomPosition(25, 25, this.roomName), 1)!);
        }

        this.placeSourceSpawn();
    }

    public placeSourceSpawn() {
        const room = Game.rooms[this.roomName];
        if (room) {
            let road1: RoomPosition[];
            let road2: RoomPosition[];
            const sources = room.find(FIND_SOURCES);
            const controller = room.controller;
            if (sources.length > 0 && controller) {
                const controlSpot = this.getSpotCandidate2(controller.pos);
                if (controlSpot) {
                    this.visual.structure(controlSpot.x, controlSpot.y, STRUCTURE_STORAGE);
                    // this.visual.circle(controlSpot.x, controlSpot.y, { radius: 0.25, fill: '#0000BB' });
                    // const closest = controller.pos.findClosestByRange(sources);
                    let roadSpot: RoomPosition | undefined;
                    for (const s of sources) {
                        const spot = this.getSpotCandidate1(s.pos);
                        if (spot) {
                            this.visual.structure(spot.x, spot.y, STRUCTURE_CONTAINER);
                            this.visual.line(s.pos, controller.pos);
                            if (!roadSpot) {
                                const path = this.PathFind(spot, controlSpot, this.testMatrix!, 1);
                                roadSpot = _.last(path);
                                road1 = path;
                                this.visual.poly(path, { stroke: '#0000AA' });
                            } else {
                                const path = this.PathFind(spot, roadSpot, this.testMatrix!, 0);
                                road2 = path;
                                this.visual.poly(path, { stroke: '#00AA00' });
                            }

                            // const path = roomHelper.findPath(new RoomPosition(25, 25, this.roomName), s.pos, 1)!
                            // console.log(JSON.stringify(path));
                        }
                    }
                }

                const ext1 = _.unique(_.flatten(_.map(road1!, x => this.getOpenCardinalPosition(x, true))), false, x => x.printPlain);
                let count1 = 1;
                for (const ex of ext1) {
                    if (ex.isNearTo(sources[0])) { continue; }
                    if (count1 === 1) {
                        this.visual.structure(ex.x, ex.y, STRUCTURE_SPAWN);
                    } else {
                        this.visual.structure(ex.x, ex.y, STRUCTURE_EXTENSION);
                    }
                    count1++;
                    if (count1 > 30) { break; }
                }
                const ext2 = _.unique(_.flatten(_.map(road2!, x => this.getOpenCardinalPosition(x, true))), false, x => x.printPlain);
                let count2 = 1;
                for (const ex of ext2) {
                    if (ex.isNearTo(sources[1])) { continue; }
                    this.visual.structure(ex.x, ex.y, STRUCTURE_EXTENSION);
                    count2++;
                    if (count2 > 30) { break; }
                }
            }

        }
    }

    public viewCostMatrix(costMatrix: CostMatrix) {
        for (let y = 0; y < 50; ++y) {
            for (let x = 0; x < 50; ++x) {
                const value = costMatrix.get(x, y);
                if (value > 0) {
                    if (value === 0xff) {
                        this.visual.circle(x, y, { radius: 0.35, fill: '#AA4848' })
                    } else if (value === 1) {
                        this.visual.circle(x, y, { radius: 0.15, fill: '#48AA48' })
                        // this.visual.text('' + value, x, y);
                    }
                    else {
                        this.visual.circle(x, y, { radius: Math.min(15, value) / 25, fill: '#787878' })
                        this.visual.text('' + value, x, y);
                    }
                }

            }
        }
    }

    public blockOffMatrix() {
        const matrix = new PathFinder.CostMatrix();
        const room = Game.rooms[this.roomName];
        roomHelper.blockOffPosition(matrix, room.controller!, 3, 3);
        roomHelper.blockOffPosition(matrix, room.controller!, 2, 5);
        roomHelper.blockOffPosition(matrix, room.controller!, 1, 7);

        for (const s of room.find(FIND_SOURCES)) {
            roomHelper.blockOffPosition(matrix, s, 2, 3);
        }

        return matrix;
    }

    public blockExits(costMatrix: CostMatrix) {
        const terrain = Game.map.getRoomTerrain(this.roomName);
        for (let x = 0; x < 50; x++) {
            if (terrain.get(x, 0) !== TERRAIN_MASK_WALL) {
                this.set3x3(costMatrix, x, 0, 0);
            }
            if (terrain.get(x, 49) !== TERRAIN_MASK_WALL) {
                this.set3x3(costMatrix, x, 49, 0);
            }
        }
        for (let y = 0; y < 50; y++) {
            if (terrain.get(0, y) !== TERRAIN_MASK_WALL) {
                this.set3x3(costMatrix, 0, y, 0);
            }
            if (terrain.get(49, y) !== TERRAIN_MASK_WALL) {
                this.set3x3(costMatrix, 49, y, 0);
            }
        }
    }

    public op3x3(x: number, y: number, func: () => void) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy < 1; dy++) {
                const _x = x + dx;
                const _y = y + dy;
                if (_x < 0 || _x > 49 || _y < 0 || _y > 49) { continue; }
                func()
            }
        }
    }

    public op5x5(x: number, y: number, func: () => void) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy < 1; dy++) {
                const _x = x + dx;
                const _y = y + dy;
                if (_x < 0 || _x > 49 || _y < 0 || _y > 49) { continue; }
                func()
            }
        }
    }

    public set3x3(costMatrix: CostMatrix, x: number, y: number, value: number) {
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy < 1; dy++) {
                const _x = x + dx;
                const _y = y + dy;
                if (_x < 0 || _x > 49 || _y < 0 || _y > 49) { continue; }
                costMatrix.set(_x, _y, value);
            }
        }
    }

    public combine(cost1: CostMatrix, cost2: CostMatrix) {
        const ret = new PathFinder.CostMatrix();
        for (let y = 0; y < 50; ++y) {
            for (let x = 0; x < 50; ++x) {
                const v1 = cost1.get(x, y);
                const v2 = cost2.get(x, y);
                if (v1 > 0) {
                    ret.set(x, y, Math.max(v1, v2));
                } else {
                    ret.set(x, y, 0);
                }
            }
        }
        return ret;
    }

    public getWalkableMatrix(): CostMatrix {
        if (!this.walkableMatrix) {
            this.walkableMatrix = new PathFinder.CostMatrix();
            const terrain = Game.map.getRoomTerrain(this.roomName);
            for (let y = 0; y < 50; ++y) {
                for (let x = 0; x < 50; ++x) {
                    if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
                        this.walkableMatrix.set(x, y, 1);
                    }
                }
            }
        }
        return this.walkableMatrix;
    }

    public PathFind(from: RoomPosition, to: RoomPosition, costMatrix: CostMatrix, range: number = 1) {
        const ret = PathFinder.search(from, { pos: to, range }, {
            maxRooms: 1, plainCost: 12, swampCost: 12, roomCallback(roomName: string) {
                return costMatrix;
            }
        });
        /*if (ret.incomplete) {
             ret.path;
        }*/

        this.visual.poly(ret.path);
        return ret.path;
    }

    public getSpotCandidate1(pos: RoomPosition) {
        const spots = pos.openAdjacentSpots(true);
        if (spots.length === 0) { return undefined; }
        const spotArr = [];
        let maxOpen = 0;
        let maxS;
        for (const s1 of spots) {
            const _s = s1.openAdjacentSpots(true);
            // this.visual.text('' + _s.length, s1);
            if (_s.length > maxOpen) {
                maxOpen = _s.length;
                maxS = s1;
            }
        }
        return maxS;
    }

    public getSpotCandidate2(pos: RoomPosition) {
        const spots = pos.openAdjacentSpots(true);
        if (spots.length === 0) { return undefined; }
        const spotArr = [];
        let maxOpen = 0;
        let maxS;
        for (const s1 of spots) {
            const _s = s1.openAdjacentSpots(true);
            // this.visual.text('' + _s.length, s1);
            for (const s2 of _s) {
                if ((s2.x + s2.y) % 2 === 0) { continue; }
                const _s2 = s2.openAdjacentSpots(true);
                // this.visual.text('' + _s2.length, s2);
                if (_s2.length > maxOpen) {
                    maxOpen = _s2.length;
                    maxS = s2;
                }
            }
        }
        return maxS;
    }

    public getOpenCardinalPosition(pos: RoomPosition, ignoreCreeps?: boolean): RoomPosition[] {
        const positions = [];
        for (let i = 1; i <= 8; i += 2) {
            const testPosition = pos.getPositionAtDirection(i);

            if (testPosition.isPassible(ignoreCreeps)) {
                // passed all tests
                positions.push(testPosition);
            }
        }
        return positions;
    }

    public getWalkableGridMatrix(): CostMatrix {
        if (!this.gridWalkableMatrix) {
            this.gridWalkableMatrix = new PathFinder.CostMatrix();
            const terrain = Game.map.getRoomTerrain(this.roomName);
            for (let y = 0; y < 50; ++y) {
                for (let x = 0; x < 50; ++x) {
                    // if (x % 2 === 0 && y % 2 === 1) { continue; }
                    if ((x + y) % 2 === 1) { continue; }
                    if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
                        // if (this.getDistanceTransform()) {
                        const dist = Math.max(7 - this.getDistanceTransformCart().get(x, y) * 2, 1);
                        // const dist = 2;
                        // const dist = this.getDistanceTransform().get(x, y);
                        this.gridWalkableMatrix.set(x, y, dist);
                        this.visual.circle(x, y, { radius: dist / 25, fill: '#686868' })
                        /*} else {
                            this.gridWalkableMatrix.set(x, y, 1);
                            this.visual.circle(x, y, { radius: 0.2 })
                        }*/
                    } else {
                        this.gridWalkableMatrix.set(x, y, 0);
                    }
                }
            }
        }
        return this.gridWalkableMatrix;
    }

    public getDistanceTransform(): CostMatrix {
        if (!this.distanceMatrix) {
            this.distanceMatrix = new PathFinder.CostMatrix();
            const terrain = Game.map.getRoomTerrain(this.roomName);
            for (let y = 0; y < 50; ++y) {
                for (let x = 0; x < 50; ++x) {
                    if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
                        this.distanceMatrix.set(x, y, 0);
                    }
                    else {
                        this.distanceMatrix.set(x, y,
                            Math.min(this.distanceMatrix.get(x - 1, y - 1), this.distanceMatrix.get(x, y - 1),
                                this.distanceMatrix.get(x + 1, y - 1), this.distanceMatrix.get(x - 1, y)) + 1);
                    }
                }
            }
            for (let y = 49; y >= 0; --y) {
                for (let x = 49; x >= 0; --x) {
                    const value = Math.min(this.distanceMatrix.get(x, y),
                        this.distanceMatrix.get(x + 1, y + 1) + 1, this.distanceMatrix.get(x, y + 1) + 1,
                        this.distanceMatrix.get(x - 1, y + 1) + 1, this.distanceMatrix.get(x + 1, y) + 1);
                    this.distanceMatrix.set(x, y, value);
                    // this.visual.circle(x, y, { radius: value / 25 });
                }
            }
        }
        return this.distanceMatrix;
    }

    public getDistanceTransformCart(): CostMatrix {
        if (!this.distanceCartMatrix) {
            this.distanceCartMatrix = new PathFinder.CostMatrix();
            const terrain = Game.map.getRoomTerrain(this.roomName);
            for (let y = 0; y < 50; ++y) {
                for (let x = 0; x < 50; ++x) {
                    if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
                        this.distanceCartMatrix.set(x, y, 0);
                    }
                    else {
                        this.distanceCartMatrix.set(x, y,
                            Math.min(this.distanceCartMatrix.get(x, y - 1),
                                this.distanceCartMatrix.get(x - 1, y)) + 1);
                    }
                }
            }
            for (let y = 49; y >= 0; --y) {
                for (let x = 49; x >= 0; --x) {
                    const value = Math.min(this.distanceCartMatrix.get(x, y),
                        this.distanceCartMatrix.get(x, y + 1) + 1,
                        this.distanceCartMatrix.get(x + 1, y) + 1);
                    this.distanceCartMatrix.set(x, y, value);
                    // this.visual.circle(x, y, { radius: value / 25 });
                }
            }
        }
        return this.distanceCartMatrix;
    }
}
