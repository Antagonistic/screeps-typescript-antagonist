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

    public run(visual: boolean = false) {
        ;
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

    public static getAjacentOpenSpots(pos: RoomPosition) {

        const positions = [];
        for (let i = 1; i <= 8; i++) {
            const testPosition = pos.getPositionAtDirection(i);

            if (!testPosition.isNearExit(0) && _.head(testPosition.lookFor(LOOK_TERRAIN)) !== "wall") {
                // passed all tests
                positions.push(testPosition);
            }
        }
        return positions;
    }

    public static getSpotCandidate1(pos: RoomPosition) {
        const spots = this.getAjacentOpenSpots(pos);
        if (spots.length === 0) { return undefined; }
        const spotArr = [];
        let maxOpen = 0;
        let maxS;
        for (const s1 of spots) {
            const _s = this.getAjacentOpenSpots(s1);
            // this.visual.text('' + _s.length, s1);
            if (_s.length > maxOpen) {
                maxOpen = _s.length;
                maxS = s1;
            }
        }
        return maxS;
    }

    public static getSpotCandidate2(pos: RoomPosition) {
        const spots = this.getAjacentOpenSpots(pos);
        if (spots.length === 0) { return undefined; }
        const spotArr = [];
        let maxOpen = 0;
        let maxS;
        for (const s1 of spots) {
            const _s = this.getAjacentOpenSpots(s1);
            // this.visual.text('' + _s.length, s1);
            for (const s2 of _s) {
                if ((s2.x + s2.y) % 2 === 0) { continue; }
                const _s2 = this.getAjacentOpenSpots(s2);
                // this.visual.text('' + _s2.length, s2);
                if (_s2.length > maxOpen) {
                    maxOpen = _s2.length;
                    maxS = s2;
                }
            }
        }
        return maxS;
    }

    public static getSpotCandidate3(pos: RoomPosition) {
        const spots = this.getAjacentOpenSpots(pos);
        if (spots.length === 0) { return undefined; }
        const spotArr = [];
        let maxOpen = 0;
        let maxS;
        for (const s1 of spots) {
            const _s = this.getAjacentOpenSpots(s1);
            for (const s2 of _s) {
                if ((s2.x + s2.y) % 2 === 0) { continue; }
                const _s2 = this.getAjacentOpenSpots(s2);
                for (const s3 of _s2) {
                    if ((s3.x + s3.y) % 2 === 0) { continue; }
                    const _s3 = this.getAjacentOpenSpots(s3);
                    if (_s3.length > maxOpen) {
                        maxOpen = _s3.length;
                        maxS = s3;
                    }
                }
            }
        }
        return maxS;
    }

    public static getOpenCardinalPosition(pos: RoomPosition, ignoreCreeps?: boolean): RoomPosition[] {
        const positions = [];
        for (let i = 1; i <= 8; i += 2) {
            const testPosition = pos.getPositionAtDirection(i);
            if (!testPosition.isNearExit(0) && _.head(testPosition.lookFor(LOOK_TERRAIN)) !== "wall") {
                // if (testPosition.isPassible(ignoreCreeps)) {
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
