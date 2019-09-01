// example declaration file - remove these and add your own custom typings

declare namespace NodeJS {
  interface Global {
    log: any;
    cc: any;
    emp: IEmpire;
  }
}

interface Game {
  operations: { [opName: string]: any }
}

// memory extension samples
interface CreepMemory {
  home?: string;
  role?: string;
  room?: string;
  working: boolean;
  uuid: number;
  hasworkpart?: boolean;
  recycle?: boolean;
  reserve?: any;
  sourceID?: string;
  squad?: string;
  renew?: boolean;
  target?: string;
  isBoosted?: boolean;
}

interface RoomMemory {
  state: RoomStates;
  home: string;
  towers: string[];
  mine_structures: number;
  stable_structures: boolean;
  bufferChests: string[];
  remoteRoom: string[];
  mininglinks: string[] | undefined;
  spawnlinks: string[] | undefined;
  controllerlinks: string[] | undefined;
  availBoost?: { [name: string]: string; };
  rally: RoomPosition;
  battery?: string;
}

interface Memory {
  uuid: number;
  log: any;
  empire: any;
  profiler: { [identifier: string]: ProfilerData };
  cpu: {
    history: number[];
    average: number;
  };
}

interface ProfilerData {
  startOfPeriod: number;
  lastTickTracked: number;
  total: number;
  count: number;
  costPerCall: number;
  costPerTick: number;
  callsPerTick: number;
  cpu: number;
  consoleReport: boolean;
  period: number;
}

interface IWorldMap {
  controlledRooms: { [roomName: string]: Room };
  init(): { [roomName: string]: ISpawnRoom };
}

// interface IMission {
//   name: string;
//   operation: IOperation;

//   roles: { [roleName: string]: Creep[] };
// }

// interface IOperation {
//   name: string;
//   type: string;

//   flag: Flag;
//   room: Room | undefined;

//   missions: { [missionName: string]: IMission };

//   init(): void;
// }

interface ISpawnRoom {
  spawns: StructureSpawn[];
  room: Room;
  availableSpawnCount: number;
  availableSpawnEnergy: number;
  createCreep(bodyParts: string[] | null, role: string, memory?: any, room?: Room, creepName?: string): boolean;
}

interface IEmpire {
  spawnRooms: { [roomName: string]: ISpawnRoom };
  map: IWorldMap;
  // operations: { [operationName: string]: IOperation };
  //init(): void;
  getSpawnRoom(roomName: string): any;
}

interface SquadComposition {
  archer?: number;
  healer?: number;
  siege?: number;
  brawler?: number;
}

interface Squad {
  name: string;
  composition: SquadComposition;
  members: string[];
  assignedRoom: string;
}

declare const enum RoomStates {
  NONE = 0,
  WAR = 1,
  NEUTRAL = 2,
  MINE = 3,
  CLAIM = 4,
  BOOTSTRAP = 5,
  TRANSITION = 6,
  STABLE = 7
}

declare const __REVISION__: string;
