
export function run(): void {
  const squads: Squad[] = Memory.squads;
  if (squads && squads.length) {
    for (const squad of squads) {
      // console.log(squad.name);
      const currSquad: SquadComposition = {archer: 0, healer: 0, brawler: 0, siege: 0};

      for (const memberID of squad.members) {
        const member: Creep | null = Game.getObjectById(memberID);
        if (member === null) {
          const index: number = squad.members.indexOf(memberID);
          squad.members.splice(index);
        } else {
          const subrole: string = member.memory.role.subrole || "brawler";
          currSquad[subrole]++;
        }
      }
      /* console.log(currSquad.archer);
      if (currSquad.archer < squad.composition.archer) {
        console.log("Need " + squad.composition.archer + " archers, have " + currSquad.archer);
      }*/
    }
  }
}
