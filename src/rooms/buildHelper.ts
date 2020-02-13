import { defenceHelper } from "./defenceHelper";
import { layoutManager } from "./layoutManager";
import { roomHelper } from "./roomHelper";


export const buildHelper = {
    hasStructure(pos: RoomPosition, struct: BuildableStructureConstant, clear: boolean = false): boolean {
        if (Game.map.getRoomTerrain(pos.roomName).get(pos.x, pos.y) === TERRAIN_MASK_WALL && struct !== STRUCTURE_EXTRACTOR) { return true; }
        const structures = pos.lookFor(LOOK_STRUCTURES);
        if (_.any(structures, x => x.structureType === struct)) { return true; }
        const construct = pos.lookFor(LOOK_CONSTRUCTION_SITES);
        if (_.any(construct, x => x.structureType === struct)) { return true; }
        if (clear && struct !== "road" && struct !== "rampart" && struct !== "container") {
            const road = _.find(structures, x => x.structureType === STRUCTURE_ROAD);
            if (road) { road.destroy(); }
            const constRoad = _.find(construct, x => x.structureType === STRUCTURE_ROAD);
            if (constRoad) { constRoad.remove(); }
        }
        return false;
    },

    buildIfNotExist(pos: RoomPosition, struct: BuildableStructureConstant, name?: string): ScreepsReturnCode {
        if (buildHelper.hasStructure(pos, struct)) { return OK; }
        let ret: ScreepsReturnCode;
        if (Game.rooms[pos.roomName] && Game.rooms[pos.roomName].getTerrain().get(pos.x, pos.y) === TERRAIN_MASK_WALL && struct !== STRUCTURE_EXTRACTOR) { return OK; }
        if (struct === STRUCTURE_SPAWN) {
            if (!name) {
                name = "Spawn_" + pos.roomName + "_" + Memory.uuid++;
            }
            ret = pos.createConstructionSite(STRUCTURE_SPAWN, name)
        } else {
            ret = pos.createConstructionSite(struct);
        }
        if (ret !== OK) {
            if (ret === ERR_RCL_NOT_ENOUGH) {
                return ret;
            }
            console.log("Failed to construct " + struct + " at " + pos.print + "! " + ret);
        }
        return ret;
    },

    runBuildStructure(room: Room, buildOne: boolean = true, road: boolean = false, wall: boolean = false) {
        let count = 0;
        if (!room.memory.layoutTime || room.memory.layoutTime < Game.time) {
            layoutManager.applyLayouts(room);
        }
        for (const key in room.memory.structures) {
            const _key = key as BuildableStructureConstant;
            if (!road && _key === STRUCTURE_ROAD) { continue; }
            if (!wall && (_key === STRUCTURE_WALL || _key === STRUCTURE_RAMPART)) { continue; }
            const structs = room.memory.structures[_key];
            if (structs) {
                for (const s of structs) {
                    const pos = roomHelper.deserializeRoomPosition(s);
                    if (pos) {
                        if (!buildHelper.hasStructure(pos, _key, false)) {
                            const ret = buildHelper.buildIfNotExist(pos, _key);
                            if (ret === OK) {
                                if (buildOne) {
                                    console.log('BUILD: Making new ' + _key + ' at ' + pos.print);
                                    return true;
                                } else {
                                    count++;
                                }
                            }
                            if (ret === ERR_RCL_NOT_ENOUGH) { // No more of this type allowed, skip to next key
                                break;
                            }
                        }
                    }
                }
            }
        }
        if (count > 0) {
            console.log(`BUILD: Making ${count} new structures at ${room.print}`);
            return true;
        }
        return false;
    },

    runIterativeBuild(room: Room, spawnRoom: SpawnRoom) {
        if (buildHelper.runBuildStructure(room, true, false, true)) {
            return true;
        } else {
            if (spawnRoom.rclLevel >= 6 && room.memory.bunkerDefence) {
                const roomSpots = _.flatten(Object.values(spawnRoom.room.memory.structures)) as UnserializedRoomPosition[];
                const ret = defenceHelper.assaultRampartSim(spawnRoom.room, roomSpots);
                if (ret === false || ret === true) {
                    return false;
                } else {
                    for (const r of ret) {
                        const pos = roomHelper.deserializeRoomPosition(r);
                        if (pos) {
                            console.log('BUILD: Making new ' + STRUCTURE_RAMPART + ' at ' + pos.print);
                            pos.createConstructionSite(STRUCTURE_RAMPART);
                        }
                    }
                    return true;
                }
            }
        }
        return false;
    }


}
