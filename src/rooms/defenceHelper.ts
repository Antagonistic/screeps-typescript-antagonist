import { roomHelper } from "./roomHelper";

const targetStructure: StructureConstant[] = [
    STRUCTURE_CONTAINER,
    STRUCTURE_EXTENSION,
    STRUCTURE_LAB,
    STRUCTURE_LINK,
    STRUCTURE_NUKER,
    STRUCTURE_OBSERVER,
    STRUCTURE_FACTORY,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_SPAWN,
    STRUCTURE_STORAGE,
    STRUCTURE_TERMINAL,
    STRUCTURE_TOWER
]

export const defenceHelper = {
    assaultRampartSim(room: Room, spots: Array<RoomPosition | UnserializedRoomPosition>) {
        let target: Structure | undefined = room.storage;
        if (!target) {
            target = _.head(room.find(FIND_MY_SPAWNS));
        }
        if (!target) {
            return false;
        }
        const randomExit = _.sample(room.find(FIND_EXIT));
        const path = PathFinder.search(randomExit, { pos: target.pos, range: 3 }, {
            roomCallback(roomName) {
                const _room = Game.rooms[roomName];
                if (!_room) { return false; }
                return defenceHelper.rampartMatrix(_room);
            }
        });
        room.visual.poly(path.path);
        if (path.incomplete) { return true; }
        console.log(path.incomplete);

        const rampartLoc = _.take(roomHelper.intersection(path.path, roomHelper.unique(spots)), 3);
        return rampartLoc;
    },

    findExposedStructure(room: Room) {
        const structures = room.find(FIND_MY_STRUCTURES, { filter: x => targetStructure.includes(x.structureType) });
        if (structures.length === 0) { return false; }
        const goals = _.map(structures, x => ({ pos: x.pos, range: 3 }));
        const randomExit = _.sample(room.find(FIND_EXIT));

        const path = PathFinder.search(randomExit, goals, {
            roomCallback(roomName) {
                const _room = Game.rooms[roomName];
                if (!_room) { return false; }
                return defenceHelper.rampartMatrix(_room);
            }
        });
        room.visual.poly(path.path);
        if (path.incomplete || path.path.length === 0) { return true; }

        // console.log(path.incomplete);
        return _.last(path.path).findClosestByRange(structures);
    },

    rampartMatrix(room: Room) {
        const matrix = new PathFinder.CostMatrix();
        const ramparts = room.find(FIND_STRUCTURES, { filter: x => x.structureType === STRUCTURE_RAMPART || x.structureType === STRUCTURE_WALL });
        const rampartConstruct = room.find(FIND_CONSTRUCTION_SITES, { filter: x => x.structureType === STRUCTURE_WALL || x.structureType === STRUCTURE_RAMPART });
        for (const r of ramparts) {
            matrix.set(r.pos.x, r.pos.y, 0xFF);
        }
        for (const r of rampartConstruct) {
            matrix.set(r.pos.x, r.pos.y, 0xFF);
        }
        return matrix;
    }
}
