import * as creepActions from "../creepActions";

import * as CreepManager from "../creepManager";

import RoomStates from "../../state/roomStates";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {
  if (creepActions.canWork(creep)) {
    creepActions.moveToBuild(creep);
  } else {
    creepActions.getAnyEnergy(creep);
  }
}

export function getBody(room: Room): string[] | null {
  const availableEnergy: number = room.energyCapacityAvailable;
  if (availableEnergy >= 650) {
    return [MOVE, MOVE, MOVE, WORK, WORK, WORK, WORK, CARRY, CARRY];
  } else {
    return [MOVE, WORK, WORK, CARRY];
  }
}

export function build(room: Room, spawn: Spawn, creeps: Creep[], State: RoomStates, spawnAction: boolean): boolean {
  if (spawnAction === false) {
    const _constructions: ConstructionSite[] = room.find(FIND_MY_CONSTRUCTION_SITES);
    const _builders = _.filter(creeps, (creep) => creep.memory.role === "builder");

    if (_constructions.length > 0) {
      const buildSum = _.sum(_constructions, (x: ConstructionSite) => (x.progressTotal - x.progress));
      let numBuilders: number = 0;

      switch (State) {
        case RoomStates.BOOTSTRAP:
        case RoomStates.TRANSITION:
          numBuilders = 1;
          break;
        case RoomStates.STABLE:
          numBuilders = 1;
          if (buildSum > 40000) {
            numBuilders = 3;
          } else if (buildSum > 10000) {
            numBuilders = 2;
          }
          break;
      }

      if (_builders.length < numBuilders) {
        return CreepManager.createCreep(spawn, getBody(room), "builder");
      }
    } else {
      // No more need for builders, recycle them
      for (const _builder of _builders) {
        _builder.memory.recycle = true;
      }
    }
  }
  return spawnAction;
}
