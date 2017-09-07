// add objects to `global` here
declare namespace NodeJS {
  interface Global {
    log: any;
    cc: any;
  }
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

interface Memory {
  uuid: number;
  log: any;
  squads: {
    [name: string]: Squad;
  };
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


declare const __REVISION__: string
