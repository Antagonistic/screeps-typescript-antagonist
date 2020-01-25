import { SpawnRoom } from "rooms/SpawnRoom";
import { Mission } from "../missions/Mission";

import * as creepActions from "creeps/creepActions";
import { TargetAction } from "config/config";
import { Traveler } from "utils/Traveler";

export enum OperationPriority { Emergency, OwnedRoom, VeryHigh, High, Medium, Low, VeryLow }

const emergencyStorageLimit: number = 500;

export abstract class Operation {
  public name: string;
  public type: string;

  public flag: Flag;
  public room: Room | undefined;
  public roomName: string;

  public memory: any;
  public priority: OperationPriority;

  public spawnRoom: SpawnRoom;
  public remoteSpawning: boolean;

  public missions: { [roleName: string]: Mission } = {};

  public stableOperation: boolean;

  public rallyPos: RoomPosition;

  public energyStructures: Structure[] = [];
  public droppedEnergy: Resource[] = [];
  public tombStones: Tombstone[] = [];
  public ruins: Ruin[] = [];
  public initGetEnergy: boolean;

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
    if (!this.spawnRoom) { console.log(this.name + ' null spawnRoom'); }
    this.remoteSpawning = this.spawnRoom.room.name !== this.roomName;
    const rallyFlag = Game.flags["rally_" + this.roomName];
    if (rallyFlag) {
      this.rallyPos = rallyFlag.pos;
    } else {
      this.rallyPos = new RoomPosition(25, 25, this.roomName);
    }
    this.initGetEnergy = false;
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

  public getToHomeRange() {
    if (this.memory.range === undefined) {
      if (!this.room || !this.room.memory.home) { return 99; }
      const route = Traveler.routeDistance(this.room.memory.home, this.room.name);
      if (!route) {
        this.memory.range = 99;
      } else {
        this.memory.range = Object.keys(route).length;
      }
    }
    return this.memory.range;
  }

  public finalize(): void {
    for (const missionName in this.missions) {
      try {
        this.missions[missionName].finalize();
        //  this.memory[missionName] = this.missions[missionName].memory;
        if (Game.time % 1000 === 88) {
          this.memory.range = undefined;
        }
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

  public creepGetEnergy(creep: Creep, action: boolean, scavange: boolean = false, priority: boolean = false): boolean {
    // console.log("creepGetEnergy entry " + action);
    if (action) { return action; }
    // if (!this.remoteSpawning) { return this.spawnRoom.logistics.creepGetEnergy(creep, this, scavange, priority); }
    // if (!this.room) { creepActions.moveTo(creep, this.flag.pos); return true; }
    // if (creep.room.name !== this.spawnRoom.room.name) {
    //
    // } else {
    if (!creepActions.actionGetEnergyCache(creep, false)) {
      if (!this.initGetEnergy) {
        const hauler = creep.room.find(FIND_MY_CREEPS, { filter: x => x.memory.target === creep.id && x.store.energy > 10 });
        if (hauler && hauler.length > 0) {
          creep.setTarget(hauler[0], TargetAction.MOVETO);
          return true;
        }
        this.droppedEnergy = creep.room.find(FIND_DROPPED_RESOURCES, { filter: x => x.resourceType === RESOURCE_ENERGY && x.amount >= 10 });
        this.tombStones = creep.room.find(FIND_TOMBSTONES, { filter: x => x.store.energy >= 10 });
        this.ruins = creep.room.find(FIND_RUINS, { filter: x => x.store.energy >= 10 });
        const structures = creep.room.find(FIND_STRUCTURES);
        // console.log("" + this.droppedEnergy.length);
        for (const s of structures) {
          switch (s.structureType) {
            case STRUCTURE_CONTAINER: {
              if (s.store.energy >= creep.carryCapacity / 2) {
                this.energyStructures.push(s);
              }
              break;
            }
            case STRUCTURE_STORAGE: {
              if (s.store.energy >= emergencyStorageLimit) {
                this.energyStructures.push(s);
              } else {
                if (!s.my) { s.destroy(); }
                break;
              }
            }
            case STRUCTURE_TERMINAL: {
              if (s.store.energy >= creep.carryCapacity / 2) {
                this.energyStructures.push(s);
              } else {
                if (!s.my) { s.destroy(); }
              }
              break;
            }
            case STRUCTURE_LINK: {
              if (s.energy >= 200) {
                this.energyStructures.push(s);
              }
              break;
            }
            default: { ; }
          }
        }
        this.initGetEnergy = true;
      }
      let t;
      if (priority) { // Hijack a nearby hauler
        const hauler = creep.pos.findInRange(FIND_MY_CREEPS, 5, { filter: x => x.memory.role === "hauler" && x.memory.working && x.carry.energy > 50 });
        if (hauler && hauler.length > 0) {
          hauler[0].say("HiJack");
          hauler[0].memory.target = creep.id;
          creep.setTarget(hauler[0], TargetAction.MOVETO);
          return true;
        }
      }
      if (scavange) {
        if (this.droppedEnergy.length > 0) {
          t = creep.pos.findClosestByRange(this.droppedEnergy);
          if (t) {
            creep.memory.energyTarget = t.id;
            return creepActions.actionGetEnergyCache(creep, false);
          }
        }
        if (this.tombStones.length > 0) {
          t = creep.pos.findClosestByRange(this.tombStones);
          if (t) {
            creep.memory.energyTarget = t.id;
            return creepActions.actionGetEnergyCache(creep, false);
          }
        }
        if (this.ruins.length > 0) {
          t = creep.pos.findClosestByRange(this.ruins);
          if (t) {
            creep.memory.energyTarget = t.id;
            return creepActions.actionGetEnergyCache(creep, false);
          }
        }
      }
      t = creep.pos.findClosestByRange(this.energyStructures);
      if (t) {
        creep.memory.energyTarget = t.id;
        return creepActions.actionGetEnergyCache(creep, false);
      }
      if (!scavange) {
        if (this.droppedEnergy.length > 0) {
          t = creep.pos.findClosestByRange(this.droppedEnergy);
          if (t) {
            creep.memory.energyTarget = t.id;
            return creepActions.actionGetEnergyCache(creep, false);;
          }
        }
      }
      if (this.remoteSpawning && creep.getActiveBodyparts(WORK)) {
        // Harvest for it
        const sources = creep.room.find(FIND_SOURCES);
        creep.memory.energyTarget = sources[creep.memory.uuid % sources.length].id;
        return creepActions.actionGetEnergyCache(creep, false);
      }
      if (creep.carry.energy > 0) {
        creep.memory.working = true;
      }
      creepActions.moveTo(creep, this.rallyPos);
      creep.say("-energy");
      return false;
    } else {
      return true;
    }
  }
  // }
}
