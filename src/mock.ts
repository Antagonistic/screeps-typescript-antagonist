import { mockGlobal, mockInstanceOf } from "screeps-jest"


export const mockScreeps = () => {
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

    g.RoomObject = (() => {
        function RoomObject() { ; }

        return RoomObject
    })()

    g.RoomPosition = (() => {
        function RoomObject() { ; }

        return RoomObject
    })()
}

mockScreeps()
