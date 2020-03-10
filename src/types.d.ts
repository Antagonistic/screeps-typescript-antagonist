// import "./Profiler/typings"

// import { ActionTarget } from 'config/config';

// example declaration file - remove these and add your own custom typings
declare namespace NodeJS {
  interface Global {
    log: any;
    cc: any;
    emp: import('./Empire').Empire;
    Profiler: Profiler;

    lastMemoryTick: number | undefined;
    LastMemory: any;
    Memory: any;
  }
}

interface RawMemory {
  _parsed: any;
}

interface UnserializedRoomPosition {
  x: number;
  y: number;
  roomName: string;
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
  highCPU?: boolean;
}

interface RoomMemory {
  // state: RoomStates;
  home?: string;
  homelevel?: number;
  spawns?: string[];
  remote?: string[];
  layout?: LayoutMemory[];
  lastSeen?: Number;
  nextScan?: Number;
  visual?: number;
  dest?: UnserializedRoomPosition[];
  hostile?: boolean;
  type?: string;
  fort?: number;
  noRemote?: boolean;

  towers?: string[];
  // mine_structures: number;
  // stable_structures: boolean;
  bufferChests?: string[];
  remoteRoom?: string[];
  availBoost?: { [name: string]: string; };
  rally?: UnserializedRoomPosition;
  battery?: string;
  buildState?: number;
  supervisor?: LightRoomPos[];
  spawnRoom?: string;
  controllerBattery?: Id<StructureContainer | StructureStorage | StructureLink>;
  avoid?: number;

  structures?: RoomStructurePositions;
  secondaryRoads?: UnserializedRoomPosition[];
  layoutTime?: number;
  lastSpawned?: string;
  bunkerDefence?: boolean;
  noLinkMine?: boolean;
  UUID?: number;
  roadCon?: Id<ConstructionSite>[];
  roadRep?: Id<Structure>[];
  lastEnergy?: number;
  dismantle?: Id<Structure>[];
  sourcesPos?: UnserializedRoomPosition[] | null;
  controllerPos?: UnserializedRoomPosition | null;
  mineralInfo?: MineralInfo | null;
  neighbors?: string[];
  center?: UnserializedRoomPosition;
  queueReaction?: LabReaction[];
  energyState?: import("./config/Constants").EnergyState;
  roomClass?: import("./config/Constants").RoomClass;
  sLink?: Id<StructureLink>;
  cLink?: Id<StructureLink>;
  links?: Id<StructureLink>[];
  owner?: string;
  active?: boolean;
}

type RoomStructurePositions = { [key in BuildableStructureConstant]?: UnserializedRoomPosition[] };
type RoomStructurePositionsLight = { [key in BuildableStructureConstant]?: LightRoomPos[] };
type CostMatrices = { [key: string]: CostMatrix };

interface LayoutMemory {
  name: string;
  flagName: string;
}

interface MineralInfo {
  pos: UnserializedRoomPosition;
  type: MineralConstant;
  density: number;
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

interface RefillPath {
  origin: UnserializedRoomPosition;
  path: RefillPathNode;
}

interface RefillPathNode {
  fill: OwnedStructure[];

}

interface SpawnRoom {
  spawns: StructureSpawn[];
  room: Room;
  availableSpawnCount: number;
  availableSpawnEnergy: number;
  energyCapacityAvailable: number;
  logistics: any;
  rclLevel: number;
  createCreep(bodyParts: string[] | null, role: string, memory?: any, room?: Room, creepName?: string): boolean;
}

/*interface Empire {
  spawnRooms: { [roomName: string]: SpawnRoom };
  map: WorldMap;
  init(): { [roomName: string]: SpawnRoom };
  // operations: { [operationName: string]: IOperation };
  // init(): void;
  getSpawnRoom(roomName: string): any;
}*/

interface RCLRoomLayout {
  relative?: boolean;
  anchor: LightRoomPos;
  road: LightRoomPos[];
  [RCL: number]: RoomLayout;
}

interface RoomLayout {
  build: RoomLayoutBuild;
  memory?: any;
}

interface LabReaction {
  product: Chemical;
  input: Chemical[];
}

interface Chemical {
  building: Id<StructureLab | StructureFactory>;
  element: ResourceConstant;
  amount: number;
}

type RoomLayoutBuild = { [key in StructureConstant]?: LightRoomPos[] };

interface LightRoomPos {
  x: number;
  y: number;
}

interface cartAnalyze {
  count: number;
  carry: number;
}

interface workAnalyze {
  count: number;
  work: number;
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
  openAdjacentSpots(ignoreCreeps?: boolean, ignoreStructures?: boolean): RoomPosition[];
  getPositionAtDirection(direction: number, range?: number): RoomPosition | undefined;
  isPassible(ignoreCreeps?: boolean, ignoreStructures?: boolean): boolean;
  isNearExit(range: number): boolean
  findStructureInRange(structureType: StructureConstant, range: number): Structure | undefined;
}

interface RoomCoord {
  xx: number;
  yy: number;
}

interface Room {
  _storage?: StructureStorage;
  owner: string | undefined;
  reserved: string | undefined;
  readonly my: boolean;
  readonly coord: RoomCoord;
  readonly UUID: number;
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
  readonly drops: { [key: string]: Resource[] };
  readonly droppedEnergy: Resource[];
  readonly droppedPower: Resource[];
  readonly ruins: Ruin[];
  readonly tombstones: Tombstone[];
  readonly sortedSources: Source[];
  energyState: import("./config/Constants").EnergyState;
}

interface Source {
  energyPerTick: number;
}

interface RoomVisual {
  multitext(textLines: string[], x: number, y: number, opts?: any): RoomVisual;
  structure(x: number, y: number, type: string, opts?: { opacity?: number }): RoomVisual;
  connectRoads(opts?: { opacity?: number }): RoomVisual | void;
  box(x: number, y: number, w: number, h: number, style?: LineStyle): RoomVisual;
  roads?: Array<[number, number]>;
}

interface RoomASCIIData {
  name: string;
  map: string;
}

interface RoomPlannerLayout {
  valid: boolean;
  core: RoomStructurePositions;
  remotes?: { [key: string]: RemotePlan };
  mineral?: RoomStructurePositions;
  POI: RoomPosition[];
  rally?: RoomPosition;
  memory: RoomMemory;
  layoutTime: number;
  class: import('./config/Constants').RoomClass;
}

interface RemotePlan {
  core: RoomStructurePositions;
  isSK: boolean;
  numSource: number;
  rally?: RoomPosition;
  score: number;
  name: string;
}

interface RoomPlannerLayoutTemplate {
  anchor: LightRoomPos;
  absolute: boolean;
  build: RoomStructurePositionsLight;
  memory: RoomMemory;
}
type SavedLayouts = { [key: string]: RoomPlannerLayout };
type MultiRoomVisual = { [key: string]: RoomVisual };

declare const __REVISION__: string;
