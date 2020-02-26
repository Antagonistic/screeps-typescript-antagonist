import { mockGlobal, mockInstanceOf, mockStructure, mockRoomPositionConstructor } from "screeps-jest"

import 'proto/Misc'
import 'proto/RoomPosition'

const ROOM_SIZE = 50;
const TERRAIN_MASK_PLAIN = 0;

export function mockRoom(roomData: RoomASCIIData): Room {
    mockRoomPositionConstructor(global);
    const map = roomData.map.replace(/\s/g, '');

    // Mocks the controller
    const controller = getIndicesOf('C', map)
        .map(indexToCoordinates)
        .map(([x, y]) => new RoomPosition(x, y, roomData.name))
        .map(mockController)[0];

    // Mocks the sources
    const sources = getIndicesOf('S', map)
        .map(indexToCoordinates)
        .map(([x, y]) => new RoomPosition(x, y, roomData.name))
        .map(pos => mockInstanceOf<Source>({ pos }));

    // Mocks the minerals
    const minerals = getIndicesOf('[ULKZOHX]', map)
        .map(index => {
            const [x, y] = indexToCoordinates(index);
            const pos = new RoomPosition(x, y, roomData.name);
            return mockMineral(pos, map[index] as MineralConstant);
        });

    // Mocks Keeper Lairs
    const lairs = getIndicesOf('P', map)
        .map(indexToCoordinates)
        .map(([x, y]) => new RoomPosition(x, y, roomData.name))
        .map(pos => mockStructure(STRUCTURE_KEEPER_LAIR, { pos }));

    // Mocks room.find
    const find = (findConstant: FindConstant, opts: FilterOptions<FIND_STRUCTURES>) => {
        switch (findConstant) {
            case FIND_SOURCES:
                return sources;
            case FIND_MINERALS:
                return minerals;
            case FIND_STRUCTURES:
                if (opts && opts.filter && (opts.filter as FilterObject).structureType === STRUCTURE_KEEPER_LAIR) {
                    return lairs;
                }
                return [];
            default:
                return [];
        }
    };

    // Mocks terrain
    const terrain = mockInstanceOf<RoomTerrain>({
        get(x: number, y: number) {
            switch (map[coordinatesToIndex(x, y)]) {
                case '-':
                    return TERRAIN_MASK_PLAIN;
                case '+':
                    return TERRAIN_MASK_SWAMP;
                default:
                    return TERRAIN_MASK_WALL;
            }
        }
    });

    return mockInstanceOf<Room>({
        name: roomData.name,
        controller,
        find,
        getTerrain: () => terrain
    });
}

function mockMineral(pos: RoomPosition, mineralType: MineralConstant): Mineral {
    return mockInstanceOf<Mineral>({
        mineralType,
        pos
    });
}

function mockController(pos: RoomPosition): StructureController {
    return mockInstanceOf<StructureController>({
        structureType: STRUCTURE_CONTROLLER,
        pos
    });
}

/**
 * Finds the indices of all the matches for the given regular expression in a string.
 */
function getIndicesOf(regExp: string, str: string): number[] {
    const regex = new RegExp(regExp, 'g');
    const indices = [];
    let result: RegExpExecArray | null;

    while ((result = regex.exec(str))) {
        indices.push(result.index);
    }
    return indices;
}

function indexToCoordinates(index: number): [number, number] {
    return [index % ROOM_SIZE, Math.floor(index / ROOM_SIZE)];
}

function coordinatesToIndex(x: number, y: number) {
    return y * ROOM_SIZE + x;
}

/**
 * Function for extracting room data from existing rooms. Assumes the room is not visible, so you have to provide the
 * list of structures to add, besides terrain.
 */
export function extractRoomData(roomName: string, ...structures: Array<[number, number, string]>): RoomASCIIData {
    const terrain = Game.map.getRoomTerrain(roomName);
    const map: string[][] = [];
    const charFor = {
        [TERRAIN_MASK_WALL]: '#',
        [TERRAIN_MASK_SWAMP]: '+',
        [TERRAIN_MASK_PLAIN]: '-'
    };

    for (let y = 0; y < ROOM_SIZE; y++) {
        map.push([]);
        for (let x = 0; x < ROOM_SIZE; x++) {
            map[y].push(charFor[terrain.get(x, y)]);
        }
    }
    structures.forEach(([x, y, structureCode]) => {
        map[y][x] = structureCode;
    });
    return {
        name: roomName,
        map: map.map(line => line.join(' ')).join('\n')
    };
}


export function mockScreeps() {
    const g = global as any

    g.Game = mockGlobal<Game>("Game",
        {
            rooms: {}
        }
    );
    g.Creep = (() => {
        function Creep() { ; }

        return Creep
    })()
    g.RawMemory = mockGlobal<RawMemory>("RawMemory", { _parsed: true });
    g.Memory = mockGlobal<Memory>("Memory", {
        cpu: {
            average: 0,
            history: []
        },
        empire: undefined,
        profiler: {},
        uuid: 0
    });
};

// mockScreeps()
