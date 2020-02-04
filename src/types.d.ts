// import "./Profiler/typings"

// import { ActionTarget } from 'config/config';

// example declaration file - remove these and add your own custom typings
declare namespace NodeJS {
  interface Global {
    log: any;
    cc: any;
    emp: Empire;
    Profiler: Profiler;

    lastMemoryTick: number | undefined;
    LastMemory: any;
    Memory: any;
  }
}

interface RawMemory {
  _parsed: any;
}

interface Game {
  operations: { [opName: string]: any }
}

interface _TargetAble {
  id: Id<this>;
  pos: RoomPosition;
}

interface MarketHistory {
  resourceType: ResourceConstant;
  date: string;
  transactions: number;
  volume: number;
  avgPrice: number;
  stddevPrice: number;
}

interface Market {
  getHistory(resource: ResourceConstant): MarketHistory[];
}

// declare enum ActionTarget { }

/*type ACTIONBUILD = "build";
type ACTIONREPAIR = "repair";
type ACTIONMINE = "mine";
type ACTIONPICKUP = "pickup";
type ACTIONWITHDRAW = "withdraw";
type ACTIONWITHDRAWENERGY = "withdrawenergy";
type ACTIONDEPOSIT = "deposit";
type ACTIONDEPOSITENERGY = "depositenergy";
type ACTIONHEAL = "heal";
type ACTIONATTACK = "attack";
type ACTIONATTACK_RANGED = "attackranged";
type ACTIONDISMANTLE = "dismantle";

type TargetAction = ACTIONBUILD | ACTIONREPAIR | ACTIONMINE | ACTIONPICKUP | ACTIONWITHDRAW | ACTIONWITHDRAWENERGY | ACTIONDEPOSIT | ACTIONDEPOSITENERGY | ACTIONHEAL | ACTIONATTACK | ACTIONATTACK_RANGED | ACTIONDISMANTLE;
*/
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
  target?: Id<_TargetAble>;
  targetAction?: string;
  energyTarget?: string;
  isBoosted?: boolean;
  inPosition?: boolean;
  _trav?: any;
  _travel?: any;
  oversize?: number;
  debug?: boolean;
  waitTime?: number;
  partnerId?: Id<Creep>;
}

interface RoomMemory {
  // state: RoomStates;
  home?: string;
  homelevel?: number;
  spawns?: string[];
  remote?: string[];
  neighbors?: string[];
  layout?: LayoutMemory[];
  lastSeen?: Number;
  nextScan?: Number;
  visual?: boolean;
  dest?: RoomPosition[];
  hostile?: boolean;
  type?: string;
  fort?: number;
  noRemote?: boolean;

  towers?: string[];
  // mine_structures: number;
  // stable_structures: boolean;
  bufferChests?: string[];
  remoteRoom?: string[];
  mininglinks?: string[] | undefined;
  spawnlinks?: string[] | undefined;
  controllerlinks?: string[] | undefined;
  availBoost?: { [name: string]: string; };
  rally?: RoomPosition;
  battery?: string;
  buildState?: number;
  supervisor?: LightRoomPos[];
  spawnRoom?: string;
  controllerBattery?: Id<StructureContainer | StructureLink>;
  avoid?: number;

  // snake layout variables
  snakeInit?: boolean;
  snakeRoad1?: RoomPosition[];
  snakeRoad2?: RoomPosition[];
  snakeExt1?: RoomPosition[];
  snakeExt2?: RoomPosition[];
  snakeStorage?: RoomPosition;
  snakeSpawn?: RoomPosition;
}

interface LayoutMemory {
  name: string;
  flagName: string;
}

interface Memory {
  uuid: number;
  log: any;
  empire: any;
  sign?: any;
  cpu: {
    history: number[];
    average: number;
  };
}

interface WorldMap {
  controlledRooms: { [roomName: string]: Room };
  init(): { [roomName: string]: SpawnRoom };
  expandInfluence(spawn: SpawnRoom): string[];
}


interface RoomCoord {
  x: number;
  y: number;
  xDir: string;
  yDir: string;
}

interface SpawnRoom {
  spawns: StructureSpawn[];
  room: Room;
  availableSpawnCount: number;
  availableSpawnEnergy: number;
  energyCapacityAvailable: number;
  logistics: any;
  createCreep(bodyParts: string[] | null, role: string, memory?: any, room?: Room, creepName?: string): boolean;
}

interface Empire {
  spawnRooms: { [roomName: string]: SpawnRoom };
  map: WorldMap;
  // operations: { [operationName: string]: IOperation };
  // init(): void;
  getSpawnRoom(roomName: string): any;
}

interface RCLRoomLayout {
  anchor: LightRoomPos;
  road: LightRoomPos[];
  [RCL: number]: RoomLayout;
}

interface RoomLayout {
  build: { [key: string]: LightRoomPos[] };
  memory?: any;
}

interface LightRoomPos {
  x: number;
  y: number;
}

interface cartAnalyze {
  count: number;
  carry: number;
}

// Prototypes
interface Creep {
  target?: _TargetAble;
  action: boolean;
  partner?: Creep;
  readonly working: boolean;
  setTarget(target: _TargetAble, targetAction: string): boolean;
  clearTarget(): void;
  actionTarget(): boolean;
  wait(time: number): void;
  rally(): void;
}

interface RoomPosition {
  readonly print: string;
  readonly printPlain: string;
  readonly room?: Room;
  readonly lightRoomPos: LightRoomPos;
  readonly isEdge: boolean;
  readonly isVisible: boolean;
  lookForStructure(structureType: StructureConstant): Structure | undefined;
  openAdjacentSpots(ignoreCreeps?: boolean): RoomPosition[];
  getPositionAtDirection(direction: number, range?: number): RoomPosition;
  isPassible(ignoreCreeps?: boolean): boolean;
  isNearExit(range: number): boolean
}

interface Room {
  _storage?: StructureStorage;
  owner: string | undefined;
  reserved: string | undefined;
  readonly print: string;
  readonly printPlain: string;
  readonly rally: RoomPosition;
  readonly creeps: Creep[];
  readonly hostiles: Creep[];
  readonly invaders: Creep[];
  readonly sourceKeepers: Creep[];
  readonly playerHostiles: Creep[];
  readonly dangerousHostiles: Creep[];
  readonly dangerousPlayerHostiles: Creep[];
  readonly flags: Flag[];
  readonly drops: Resource[];
  readonly droppedEnergy: Resource[];
  readonly droppedPower: Resource[];
  readonly ruins: Ruin[];
  readonly tombstones: Tombstone[];
}

interface Source {
  energyPerTick: number;
}

interface RoomVisual {
  structure(x: number, y: number, type: string, opts?: { opacity?: number }): RoomVisual;
  connectRoads(opts?: { opacity?: number }): RoomVisual | void;
  box(x: number, y: number, w: number, h: number, style?: LineStyle): RoomVisual;
  roads?: Array<[number, number]>;
}

declare const __REVISION__: string;
