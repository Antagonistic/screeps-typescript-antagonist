
// import * as CreepManager from "../creeps/creepManager";

import * as soldier from "../creeps/roles/soldier";

// import {empire} from "../../Empire";

import {SpawnRoom} from "../rooms/SpawnRoom";

export function run(): void {
  console.log("WAR");
}

export function spawnWarCreeps(spawn: SpawnRoom, creeps: Creep[], spawnAction: boolean): boolean {
  if (!spawnAction && spawn && spawn.availableSpawnCount) {
    // console.log(spawn.name + " " + spawn.spawning);
    // const squads: string[] = Memory.squads;
    // if (squads && squads.length) {
    for (const squadName in Memory.squads) {
      const squad = Memory.squads[squadName];
      if (squad) {
        // console.log(squad.name);
        const currSquad: SquadComposition = {archer: 0, healer: 0, brawler: 0, siege: 0};

        const members = _.filter(creeps, (c) => c.memory.role === "soldier" && c.memory.squad === squad.name);
        currSquad.archer = _.filter(members, (c) => c.memory.subrole === "archer").length || 0;
        currSquad.healer = _.filter(members, (c) => c.memory.subrole === "healer").length || 0;
        currSquad.brawler = _.filter(members, (c) => c.memory.subrole === "brawler").length || 0;
        currSquad.siege = _.filter(members, (c) => c.memory.subrole === "siege").length || 0;
          /*for (const memberID of squad.members) {
            const member: Creep | null = Game.getObjectById(memberID);
            if (member === null) {
              const index: number = squad.members.indexOf(memberID);
              squad.members.splice(index);
            } else {
              const subrole: string = member.memory.role.subrole || "brawler";
              currSquad[subrole]++;
            }
          }*/
        if (currSquad.archer < (squad.composition.archer || 0)) {
          const ret = soldier.build(Game.rooms[squad.assignedRoom], spawn, "archer", squad.name, spawnAction);
          if (ret === true) {
            console.log("need archer: " + currSquad.archer + "/" + squad.composition.archer);
            return true;
          }
        }
        if (currSquad.healer < (squad.composition.healer || 0)) {
          const ret = soldier.build(Game.rooms[squad.assignedRoom], spawn, "healer", squad.name, spawnAction);
          if (ret === true) {
            console.log("need healer: " + currSquad.healer + "/" + squad.composition.healer);
            return true;
          }
        }
        if (currSquad.brawler < (squad.composition.brawler || 0)) {
          const ret = soldier.build(Game.rooms[squad.assignedRoom], spawn, "brawler", squad.name, spawnAction);
          if (ret === true) {
            console.log("need brawler: " + currSquad.brawler + "/" + squad.composition.brawler);
            return true;
          }
        }
        if (currSquad.siege < (squad.composition.siege || 0)) {
          const ret = soldier.build(Game.rooms[squad.assignedRoom], spawn, "siege", squad.name, spawnAction);
          if (ret === true) {
            console.log("need siege: " + currSquad.siege + "/" + squad.composition.siege);
            return true;
          }
        }
      }
    }
  }
  return spawnAction;
}
