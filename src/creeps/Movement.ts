
export class LayoutPath {

    public static findClosestByPathLayout(origin: RoomPosition, goals: RoomPosition[], cost?: CostMatrix): RoomPosition | null {
        const ret = origin.findClosestByPath(goals, {
            maxRooms: 1, costCallback(roomName: string) {
                return cost || LayoutPath.LayoutCostMatrix(roomName);
            }
        });
        return ret;
    }

    public static LayoutCostMatrix(roomName: string) {
        if (!Memory.rooms[roomName]) {
            return false;
        }
        const mem = Memory.rooms[roomName];

        const matrix = new PathFinder.CostMatrix();
        const room = Game.rooms[roomName];

        const terrain = Game.map.getRoomTerrain(roomName);
        for (let y = 0; y < 50; ++y) {
            for (let x = 0; x < 50; ++x) {
                if (terrain.get(x, y) !== TERRAIN_MASK_WALL) {
                    matrix.set(x, y, 1);
                }
            }
        }

        if (mem.controllerPos) {
            LayoutPath.blockOffPosition(matrix, mem.controllerPos, 3, 3, terrain);
            LayoutPath.blockOffPosition(matrix, mem.controllerPos, 2, 5, terrain);
            LayoutPath.blockOffPosition(matrix, mem.controllerPos, 1, 7, terrain);
        }

        if (mem.sourcesPos) {
            for (const s of mem.sourcesPos) {
                LayoutPath.blockOffPosition(matrix, s, 2, 3, terrain);
            }
        }

        return matrix;
    }

    public static blockOffPosition(costs: CostMatrix, roomPos: RoomPosition | UnserializedRoomPosition, range: number, cost = 30, terrainLookup?: RoomTerrain) {
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
    }

    public static getDistanceTransform(roomName: string): CostMatrix {
        const distanceMatrix = new PathFinder.CostMatrix();
        const terrain = Game.map.getRoomTerrain(roomName);
        for (let y = 0; y < 50; ++y) {
            for (let x = 0; x < 50; ++x) {
                if (terrain.get(x, y) === TERRAIN_MASK_WALL) {
                    distanceMatrix.set(x, y, 0);
                }
                else {
                    distanceMatrix.set(x, y,
                        Math.min(distanceMatrix.get(x - 1, y - 1), distanceMatrix.get(x, y - 1),
                            distanceMatrix.get(x + 1, y - 1), distanceMatrix.get(x - 1, y)) + 1);
                }
            }
        }
        for (let y = 49; y >= 0; --y) {
            for (let x = 49; x >= 0; --x) {
                const value = Math.min(distanceMatrix.get(x, y),
                    distanceMatrix.get(x + 1, y + 1) + 1, distanceMatrix.get(x, y + 1) + 1,
                    distanceMatrix.get(x - 1, y + 1) + 1, distanceMatrix.get(x + 1, y) + 1);
                distanceMatrix.set(x, y, value);
            }
        }
        return distanceMatrix;
    }
}
