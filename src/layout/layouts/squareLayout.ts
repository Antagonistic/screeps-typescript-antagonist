/* tslint:disable:object-literal-sort-keys*/

// http://screeps.dissi.me/#N4IgdghgtgpiBcIAuMAeSCiqAOB7ATkiADQgDOAFhPgCYLlW0AMJI+AxgDb0AcrARgFcAlpxrCwAczIJQaFGDLDcYWSDwz4AbVCoEAJgCMpAJ4HDAX2K6D+0+as34+gMz3nl6yD3OA7O6NHbwMeAM8nIwD9IJ9XKJiDABZ4r1iANhSI-xAzZ2jUgwBOTOCPAJcEvPLK-WScgwqC5wz650aI0NbXGuKu9tL9Oy7Emrdhmuzc2prOqZGmwYC0iaWZ1YXjLt8aoanthZa9ta2egP2IzameUYDrhbqrmsOQla67iN7Hhd2im67C15TAELWa-BafX4AXSsyFwAHcYPg1BoEDoBg8HOCwjVLklTl1lhsAsCIs9nADoaQwIIANaI5G4TRo9LYylsXAQOjwUAo7QRH55Y5TfIRMZTfqxSYNGoY5zzUkBeUDACsAWVMvWCoJfyOCylfh2tyFLzZnAkNIZTIiqvGbJQ+CgEgg3G56kZqIisv06rZZCQBAgkjgrt5zIMZO9FjZuH4ZERADd6SH3XyBrjmlGYWRsBA4apk1aVZr0WdM6Q8Aj8ABlHN5y0ekv-TMWCxAA

interface RoomPlannerLayoutTemplate {
    anchor: LightRoomPos;
    absolute: boolean;
    build: RoomStructurePositionsLight;
    memory: RoomMemory;
}

const squareLayout: RoomPlannerLayoutTemplate = {
    absolute: false,
    anchor: { x: 0, y: 0 },
    build: {
        storage: [{ x: 1, y: 0 }],
        terminal: [{ x: -1, y: 0 }],
        link: [{ x: 0, y: 1 }],
        spawn: [{ x: 0, y: -1 }],
        extension: [{ x: -2, y: 1 }, { x: -3, y: 1 }, { x: -3, y: 2 }, { x: -4, y: 2 }, { x: -4, y: 3 }, { x: -4, y: 4 }, { x: -3, y: 4 }, { x: -2, y: 4 }, { x: -2, y: 3 }, { x: -1, y: 3 },
        { x: -1, y: 2 }, { x: 2, y: -1 }, { x: 3, y: -1 }, { x: 3, y: -2 }, { x: 4, y: -2 }, { x: 4, y: -3 }, { x: 4, y: -4 }, { x: 3, y: -4 }, { x: 2, y: -4 }, { x: 2, y: -3 },
        { x: 1, y: -3 }, { x: 1, y: -2 }, { x: -1, y: -3 }, { x: -2, y: -3 }, { x: -2, y: -4 }, { x: -3, y: -4 }, { x: -4, y: -3 }, { x: -4, y: -2 }, { x: -3, y: -2 }, { x: -3, y: -1 }],
        tower: [{ x: -4, y: 1 }, { x: 4, y: -1 }],
        road: [{ x: -1, y: -2 }, { x: -2, y: -2 }, { x: -3, y: -3 }, { x: 1, y: 1 }, { x: 1, y: -1 }, { x: -1, y: 1 }, { x: -2, y: 0 }, { x: -3, y: 0 }, { x: -4, y: 0 }, { x: 0, y: 2 }, { x: 0, y: 3 }, { x: 0, y: 4 }],
    },
    memory: {
        noLinkMine: true,
        noRemote: true,
        supervisor: [{ "x": 0, "y": 0 }]
    }
};
