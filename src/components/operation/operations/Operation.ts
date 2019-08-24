import { Mission } from "../missions/Mission";
import { SpawnRoom } from "components/rooms/SpawnRoom";

export enum OperationPriority { Emergency, OwnedRoom, VeryHigh, High, Medium, Low, VeryLow }

export abstract class Operation {
  name: string;
  type: string;

  flag: Flag;
  room: Room | undefined;

  memory: any;
  priority: OperationPriority;

  spawnRoom: SpawnRoom;

  missions: { [roleName: string]: Mission } = {};

  constructor(flag: Flag, name: string, type: string) {
    this.flag = flag;
    this.name = name;
    this.type = type;
    this.room = flag.room;
    this.memory = flag.memory;
    this.priority = OperationPriority.Medium;
    if (flag.room) {
      this.spawnRoom = global.emp.getSpawnRoom(flag.room.name);
    }
    else {
      this.spawnRoom = global.emp.getSpawnRoom(null);
    }
    this.missions = {};
  }

  abstract initOperation(): void;
  abstract finalizeOperation(): void;

  init(): void {
    // console.log("Operation " + this.name + " initialized!");
    try {
      this.initOperation();
    } catch (e) {
      console.log("ERROR: Operation error: init: " + this.name)
      console.log(e.stack)
    }


    for (let missionName in this.missions) {
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

  spawn(): void {
    for (let missionName in this.missions) {
      try {
        this.missions[missionName].spawn();
      } catch (e) {
        console.log("error caught in spawn phase, operation:", this.name, "mission:", missionName);
        console.log(e.stack);
      }
    }
  }

  work(): void {
    for (let missionName in this.missions) {
      try {
        this.missions[missionName].work();
      } catch (e) {
        console.log("error caught in work phase, operation:", this.name, "mission:", missionName);
        console.log(e.stack);
      }
    }
  }

  finalize(): void {
    for (let missionName in this.missions) {
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
      //this.flag.memory = this.memory;
    } catch (e) {
      console.log("error caught in finalize phase, operation:", this.name);
      console.log(e.stack);
    }
  }

  addMission(mission: Mission) {
    // it is important for every mission belonging to an operation to have
    // a unique name or they will be overwritten here
    this.missions[mission.name] = mission;
  }
}
