import { SpawnRoom } from "rooms/SpawnRoom";
import { Mission } from "../missions/Mission";

export enum OperationPriority { Emergency, OwnedRoom, VeryHigh, High, Medium, Low, VeryLow }

export abstract class Operation {
  public name: string;
  public type: string;

  public flag: Flag;
  public room: Room | undefined;
  public roomName: string;

  public memory: any;
  public priority: OperationPriority;

  public spawnRoom: SpawnRoom;

  public missions: { [roleName: string]: Mission } = {};

  public stableOperation: boolean;

  public rallyPos: RoomPosition;

  constructor(flag: Flag, name: string, type: string) {
    this.flag = flag;
    this.name = name;
    this.type = type;
    this.room = flag.room;
    this.memory = flag.memory;
    this.priority = OperationPriority.Medium;
    this.stableOperation = true;
    if (flag.room) {
      this.spawnRoom = global.emp.getSpawnRoom(flag.room.name);
      this.roomName = flag.room.name;
    }
    else {
      this.roomName = flag.pos.roomName;
      this.spawnRoom = global.emp.getSpawnRoom(this.roomName);
    }
    const rallyFlag = Game.flags["rally_" + this.roomName];
    if (rallyFlag) {
      this.rallyPos = rallyFlag.pos;
    } else {
      this.rallyPos = new RoomPosition(25, 25, this.roomName);
    }
    this.missions = {};
  }

  public abstract initOperation(): void;
  public abstract finalizeOperation(): void;

  public init(): void {
    // console.log("Operation " + this.name + " initialized!");
    try {
      this.initOperation();
    } catch (e) {
      console.log("ERROR: Operation error: init: " + this.name)
      console.log(e.stack)
    }


    for (const missionName in this.missions) {
      try {
        // this.missions[]
        this.missions[missionName].initMission();
      }
      catch (e) {
        console.log("error caught in initMission phase, operation:", this.name, "mission:", missionName);
        console.log(e.stack);
      }

    }
  }

  public spawn(): void {
    for (const missionName in this.missions) {
      try {
        this.missions[missionName].spawn();
      } catch (e) {
        console.log("error caught in spawn phase, operation:", this.name, "mission:", missionName);
        console.log(e.stack);
      }
    }
  }

  public work(): void {
    for (const missionName in this.missions) {
      try {
        this.missions[missionName].work();
      } catch (e) {
        console.log("error caught in work phase, operation:", this.name, "mission:", missionName);
        console.log(e.stack);
      }
    }
  }

  public finalize(): void {
    for (const missionName in this.missions) {
      try {
        this.missions[missionName].finalize();
        //  this.memory[missionName] = this.missions[missionName].memory;
      } catch (e) {
        console.log("error caught in finalize phase, operation:", this.name, "mission:", missionName);
        console.log(e.stack);
      }
    }

    try {
      this.finalizeOperation();
      // this.flag.memory = this.memory;
    } catch (e) {
      console.log("error caught in finalize phase, operation:", this.name);
      console.log(e.stack);
    }
  }

  public addMission(mission: Mission) {
    // it is important for every mission belonging to an operation to have
    // a unique name or they will be overwritten here
    this.missions[mission.name] = mission;
  }
}
