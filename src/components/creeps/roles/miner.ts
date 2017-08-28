// import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep): void {
  const sourceID: string = creep.memory.sourceID;
  if (sourceID) {
    const source: Source | null = Game.getObjectById(sourceID);
    if (source) {
      const ret: number = creep.harvest(source);
      if (ret === ERR_NOT_IN_RANGE) {
        creep.moveTo(source);
      } else {
        if (ret === 0 && !creep.memory.container) {
          const basket: Container[] | null = creep.pos.findInRange<Container>(FIND_STRUCTURES, 0,
            {filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER});
          if (basket && basket.length > 0) {
            creep.memory.container = true;
          } else {
            const basketBuild: ConstructionSite[] | null = creep.pos.findInRange<ConstructionSite>(FIND_STRUCTURES, 0,
              {filter: (x: ConstructionSite) => x.structureType === STRUCTURE_CONTAINER});
            if (basketBuild && basketBuild.length > 0) {
              creep.memory.container = true;
            } else {
              creep.room.createConstructionSite(creep.pos, STRUCTURE_CONTAINER);
            }
          }
        }
      }
    } else {
      if (creep.room.name !== creep.memory.room) {
        // Wrong room, lets walk
        creep.moveTo(new RoomPosition(20, 20, creep.memory.room));
      }
    }
  } else {
    console.log("Miner has no specified source to mine!");
    const sources: Source[] = creep.room.find(FIND_SOURCES);
    creep.memory.sourceID = sources[0].id;
  }
}
