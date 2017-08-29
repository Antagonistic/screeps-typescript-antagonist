import RoomStates from "../state/roomStates";

export function run(room: Room): void {
  const state: RoomStates = room.memory.state;
  switch  (state) {
    case RoomStates.BOOTSTRAP:
    case RoomStates.TRANSITION:
    case RoomStates.STABLE:
      if (room.memory.stable_structures) {
        return;
      }
      console.log("Placing stable room layouts!");
      const spawns: Spawn[] = room.find(FIND_MY_SPAWNS);
      const spawnPos: RoomPosition[] = _.map(spawns, (x) => x.pos);
      const sources: Source[] = room.find(FIND_SOURCES);
      const sourcePos: RoomPosition[] = _.map(sources, (x) => x.pos);
      if (!spawns || spawns.length === 0) {
        console.log("StructureManager can't find any spawns!");
        return;
      }
      // Place a container per source
      // for (const source of sources) {
        // const path: Path = room.findPath(source.pos, spawns[0].pos,
        //  {ignoreCreeps: true, ignoreRoads: true, swampCost: 1 })
      // }

      for (const spawn of spawnPos) {
        for (const source of sourcePos) {
          _buildRoad(spawn, source, true, true);
        }
        if (room.controller) {
          _buildRoad(spawn, room.controller.pos, true, false);
        }
      }
      room.memory.stable_structures = true;
      break;
  }
}

function _buildRoad(from: RoomPosition, goal: RoomPosition, rangeOne: boolean = true, placeContainer: boolean = true) {
  let foundpath: PathFinderPath;
  if (rangeOne) {
    foundpath = PathFinder.search(from, { pos: goal, range: 1 }, {swampCost: 1});
  } else {
    foundpath = PathFinder.search(from, { pos: goal, range: 0 }, {swampCost: 1});
  }
  if (placeContainer) {
    const contPos = foundpath.path.pop();
    contPos.createConstructionSite(STRUCTURE_CONTAINER);
  }
  for (const step of foundpath.path) {
    step.createConstructionSite(STRUCTURE_ROAD);
  }
}
