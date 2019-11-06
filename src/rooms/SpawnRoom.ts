import * as Config from "config/config";

import { log } from "lib/logger/log";
import { LogisticsManager } from "operation/LogisticsManager";

export class SpawnRoom implements SpawnRoom {
  public spawns: StructureSpawn[];
  public room: Room;
  public availableSpawnCount: number;
  public availableSpawnEnergy: number;
  public isAvailable: boolean;
  public energyCapacityAvailable: number;
  public rclLevel: number;
  public logistics: LogisticsManager;

  constructor(room: Room) {
    this.room = room;
    this.spawns = this.room.find(FIND_MY_SPAWNS);
    this.availableSpawnCount = _.filter(this.spawns, (s: StructureSpawn) => !s.spawning).length;
    this.availableSpawnEnergy = this.room.energyAvailable;
    this.isAvailable = this.availableSpawnCount > 0;
    this.energyCapacityAvailable = this.room.energyCapacityAvailable;
    this.rclLevel = this.room.controller === undefined ? 0 : this.room.controller.level;
    this.logistics = new LogisticsManager(this);
  }

  public spawn(build: BodyPartConstant[], name: string, memory?: any): boolean {
    if (SpawnRoom.calculateBodyCost(build) > this.energyCapacityAvailable) { return false; }
    this.isAvailable = false;
    for (const spawn of this.spawns) {
      if (spawn.spawning == null) {
        const uuid: number = Memory.uuid;

        const properties: CreepMemory = {
          uuid,
          working: false
        }
        if (memory) { _.assign(properties, memory); }

        const status: number | string = spawn.spawnCreep(build, name, { memory: properties });

        if (status === OK) {
          // success!
          Memory.uuid = uuid + 1;
          this.availableSpawnCount = 0;
          return true;
        }
        if (status === ERR_INVALID_ARGS) {
          console.log("SPAWN: invalid args for creep\nbuild:", build, "\nname:", name, "\ncount:", build.length);
          return false;
        }
        else if (status === ERR_NOT_ENOUGH_RESOURCES) {
          if (Game.time % 10 === 0) {
            console.log("SPAWN:", this.room.name, "not enough energy for", name, "cost:", SpawnRoom.calculateBodyCost(build),
              "current:", this.availableSpawnEnergy, "max", this.energyCapacityAvailable);
          }
          return false;
        }
        console.log("spawn unhandled status: " + status);
      }
    }
    return false;
  }

  public static calculateBodyCost(body: BodyPartConstant[]): number {
    let sum = 0;
    for (const part of body) {
      sum += BODYPART_COST[part];
    }
    return sum;
  }

  public maxUnitsPerCost(unitCost: number, proportion: number = 1): number {
    return Math.floor((this.energyCapacityAvailable * proportion) / unitCost);
  }

  public maxUnits(body: BodyPartConstant[], proportion?: number) {
    const cost = SpawnRoom.calculateBodyCost(body);
    return Math.min(this.maxUnitsPerCost(cost, proportion), Math.floor(50 / body.length));
  }

  public createCreep(bodyParts: BodyPartConstant[], role: string, memory?: any,
    room: Room = this.room, creepName?: string): boolean {
    if (!bodyParts || !this.availableSpawnCount) { return false; }
    for (const spawn of this.spawns) {
      if (!spawn.spawning) {
        let status: number | string = spawn.canCreateCreep(bodyParts, undefined);
        if (status === OK) {

          const uuid: number = Memory.uuid;
          Memory.uuid = uuid + 1;
          if (!creepName) {
            creepName = room.name + " - " + role + uuid;
          } else {
            creepName = creepName + uuid;
          }

          const properties: CreepMemory = {
            home: spawn.room.name,
            role,
            room: room.name,
            uuid,
            working: false,
          };
          if (memory) { _.assign(properties, memory); }

          log.info("Started creating new creep: " + creepName);
          if (Config.ENABLE_DEBUG_MODE) {
            log.info("Body: " + bodyParts);
          }

          status = spawn.createCreep(bodyParts, creepName, properties);
        }
        if (typeof status !== "string" && status !== OK && status !== ERR_NOT_ENOUGH_ENERGY) {
          if (Config.ENABLE_DEBUG_MODE) {
            log.info("Failed creating new creep: " + status);
          }
          return false;
        } else if (status === OK) {
          this.availableSpawnCount = 0;
          return true;
        }
      }
    }
    return false;
  }
}
