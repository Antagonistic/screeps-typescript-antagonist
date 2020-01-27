import { Operation } from "operation/operations/Operation";
import { Mission } from "./Mission";

import { TargetAction } from "config/config";
import * as creepActions from "creeps/creepActions";
import { profile } from "Profiler";

@profile
export class PairAttackMission extends Mission {
    public target?: Structure | Creep;
    public warrior: Creep[] = [];
    public priest: Creep[] = [];
    public active: boolean;
    public grouped: boolean;
    public hostiles: Creep[] = [];
    public arrived: boolean;
    constructor(operation: Operation, name: string, target?: Structure | Creep) {
        super(operation, name);
        this.target = target;
        this.active = this.target !== undefined;
        this.grouped = false;
        this.arrived = false;
    }

    public initMission(): void {
        this.grouped = this.groupUp();
    }

    public spawn(): void {
        this.warrior = this.spawnRole(this.name + 'war', this.maxTeam, () => this.getWarriorBody(), { role: "warrior" });
        this.priest = this.spawnRole(this.name + 'heal', this.maxTeam, () => this.getPriestBody(), { role: "priest" });

        if (this.warrior.length > 0) {
            this.hostiles = this.warrior[0].room.dangerousHostiles;
            if (this.hostiles.length === 0) {
                this.hostiles = this.warrior[0].room.hostiles;
            }
            if (this.target && this.target.room.name === this.warrior[0].room.name) {
                this.arrived = true;
            }
        }
    }

    public maxTeam = () => this.active ? 1 : 0

    public work(): void {
        if (this.operation.ended) {
            for (const w of this.warrior) {
                creepActions.actionRecycle(w, false);
            }
            for (const p of this.priest) {
                creepActions.actionRecycle(p, false);
            }
        }
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
        if (this.hostiles.length > 0 || this.arrived) {
            this.fightHostiles();
        } else {
            this.walk();
        }

    }

    public fightHostiles() {
        for (const w of this.warrior) {
            w.actionTarget();
            if (w.memory.debug) { console.log('hostiles: ' + JSON.stringify(this.hostiles)); }
            if (w.memory.debug) { console.log('targetroom: ' + (this.target && this.target.room.name === w.room.name)); }
            if (!w.action) {
                if (this.hostiles.length > 0) {
                    const closest = w.pos.findClosestByPath(this.hostiles);
                    if (closest) {
                        w.setTarget(closest, TargetAction.ATTACK);
                    }
                }
            }
            if (!w.action) {
                if (this.target && this.target.room.name === w.room.name) {
                    w.setTarget(this.target, TargetAction.ATTACK);
                }
            }
        }
        for (const p of this.priest) {
            p.actionTarget();
            if (!p.action) {
                if (p.partner && p.partner.hits < p.partner.hitsMax) {
                    p.setTarget(p.partner, TargetAction.HEAL);
                } else {
                    if (p.partner) {
                        creepActions.moveTo(p, p.partner, false);
                    }
                }
            }
        }
    }

    public walk() {
        if (this.target) {
            for (const w of this.warrior) {
                if (w.memory.debug) { console.log('walk: ' + this.target); }
                creepActions.moveTo(w, this.target);
            }
            for (const p of this.priest) {
                creepActions.moveTo(p, this.target);
            }
        } else if (!this.operation.flag.room) {
            for (const w of this.warrior) {
                if (w.memory.debug) { console.log('walkRoom: ' + this.operation.roomName); }
                creepActions.actionMoveToRoom(w, false, this.operation.roomName);
            }
            for (const p of this.priest) {
                creepActions.actionMoveToRoom(p, false, this.operation.roomName);
            }
        }
        else {
            for (const w of this.warrior) {
                if (w.memory.debug) { console.log('walkRoomHome: ' + this.operation.spawnRoom.room.name); }
                creepActions.actionMoveToRoom(w, false, this.operation.spawnRoom.room.name);
            }
            for (const p of this.priest) {
                creepActions.actionMoveToRoom(p, false, this.operation.spawnRoom.room.name);
            }
        }
    }

    public groupUp(): boolean {
        let grouped = true;
        for (const w of this.warrior) {
            if (w.memory.debug) { console.log('partner: ' + w.partner || "none"); }
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
