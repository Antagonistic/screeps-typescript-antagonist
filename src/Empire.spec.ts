import { mockScreeps } from 'mock';

import { mockGlobal, mockInstanceOf, mockStructure } from 'screeps-jest';

import { Empire } from 'Empire';


mockScreeps();

const Memory = mockGlobal<Memory>("Memory", {
    cpu: {
        average: 0,
        history: []
    },
    empire: undefined,
    profiler: {},
    rooms: {},
    sign: undefined,
    uuid: 0,
});

const myController = mockInstanceOf<StructureController>({ my: true });
// @ts-ignore
const myRoom = mockInstanceOf<Room>({
    controller: myController,
    find: () => []
});

describe('Empire', () => {

    it('should construct correctly', () => {
        global.emp = new Empire();
        global.emp.init();
    })
});
