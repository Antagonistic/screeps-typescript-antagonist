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
        _findBox(creep, source);
      } else {
        // In case its not on box cos of obstruction
        if (creep.ticksToLive % 50 === 0) {
          _findBox(creep, source);
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

function _findBox(creep: Creep, source: Source) {
  const box: Container[] = source.pos.findInRange<Container>(FIND_STRUCTURES, 2,
    {filter: (x: Structure) => x.structureType === STRUCTURE_CONTAINER});
  if (box && box.length > 0) {
    creep.moveTo(box[0], {visualizePathStyle: {stroke: "#ffffff"}});
    return;
  }
  const boxSite: ConstructionSite[] = source.pos.findInRange(FIND_MY_CONSTRUCTION_SITES, 2,
    {filter: (x: ConstructionSite) => x.structureType === STRUCTURE_CONTAINER});
  if (boxSite && boxSite.length > 0) {
    creep.moveTo(boxSite[0], {visualizePathStyle: {stroke: "#ffffff"}});
    return;
  }
  console.log(creep.name + " could not find its box!");
  creep.moveTo(source, {visualizePathStyle: {stroke: "#ffffff"}});
}
