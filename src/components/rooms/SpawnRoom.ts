import * as Config from "../../config/config";

import { log } from "../../lib/logger/log";

export class SpawnRoom {
  public spawns: Spawn[];
  public room: Room;
  public availableSpawnCount: number;
  public availableSpawnEnergy: number;

  constructor(room: Room) {
    this.room = room;
    this.spawns = this.room.find(FIND_MY_SPAWNS);
    this.availableSpawnCount = _.filter(this.spawns, (s) => !s.spawning).length;
    this.availableSpawnEnergy = this.room.energyAvailable;
  }

  public createCreep(bodyParts: string[] | null, role: string, memory?: any,
                     room: Room = this.room, creepName?: string): boolean {
    if (!bodyParts || !this.availableSpawnCount) return false;
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

          const properties: { [key: string]: any } = {
            home: spawn.room.name,
            role,
            room: room.name,
            uuid,
            working: false,
          };
          if (memory) _.assign(properties, memory);

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
        } else  if (status === OK) {
          this.availableSpawnCount = 0;
          return true;
        }
      }
    }
    return false;
  }
}
