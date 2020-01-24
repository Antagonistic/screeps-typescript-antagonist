import { Operation } from "operation/operations/Operation";
import { Mission } from "./Mission";

import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";

@profile
export class PairAttackMission extends Mission {
    public target?: Structure | Creep;
    public warrior: Creep[] = [];
    public priest: Creep[] = [];
    public active: boolean;
    public grouped: boolean;
    constructor(operation: Operation, name: string, target?: Structure | Creep) {
        super(operation, name);
        this.target = target;
        this.active = this.target !== undefined;
        this.grouped = false;
    }

    public initMission(): void {
        this.grouped = this.groupUp();
    }

    public spawn(): void {
        this.warrior = this.spawnRole(this.name + 'war', this.maxTeam, this.getWarriorBody, { role: "warrior" });
        this.priest = this.spawnRole(this.name + 'heal', this.maxTeam, this.getWarriorBody, { role: "priest" });
    }

    public maxTeam = () => this.active ? 1 : 0

    public work(): void {
        if (this.grouped) {
            this.workTeams();
        } else {
            for (const w of this.warrior) {
                w.rally();
            }
            for (const p of this.priest) {
                p.rally();
            }
        }
    }

    public workTeams() {
        ;
    }

    public groupUp(): boolean {
        let grouped = true;
        for (const w of this.warrior) {
            if (!w.partner) {
                grouped = false;
                for (const p of this.priest) {
                    if (!p.partner) {
                        w.partner = p;
                        p.partner = w;
                        grouped = true;
                    }
                }
                if (!grouped) { return false; }
            }
        }
        return grouped;
    }

    public finalize(): void {
        ;
    }
}
