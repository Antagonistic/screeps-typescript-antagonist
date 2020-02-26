{
    const g = global as any;
    if (!g.Creep) { g.Creep = g.Creep || { prototype: {} }; }
}

import * as creepActions from "creeps/creepActions";

import { TargetAction } from 'config/Constants';

const energyStructures: string[] = [
    STRUCTURE_EXTENSION,
    STRUCTURE_TOWER,
    STRUCTURE_SPAWN
]

Object.defineProperty(Creep.prototype, 'target', {
    get() {
        if (this.memory.target) {
            const t = Game.getObjectById(this.memory.target);
            if (t == null) {
                this.memory.target = undefined;
                this.memory.actionTarget = undefined;
                return undefined;
            }
            return t;
        }
        return undefined;
    },
    set(newValue: _TargetAble) {
        this.memory.target = newValue.id;
        this.memory.actionTarget = undefined;
    },
    configurable: true,
});

Object.defineProperty(Creep.prototype, 'partner', {
    get() {
        if (!this._partner) {
            if (this.memory.partnerId) {
                this._partner = Game.getObjectById(this.memory.partnerId);
                if (this._partner == null) {
                    this._partner = undefined;
                    this.memory.partnerId = undefined;
                }
            }
        }
        return this._partner;
    },
    set(newVal: Creep) {
        this._partner = newVal;
        this.memory.partnerId = newVal.id;
    },
    configurable: true
});

Creep.prototype.setTarget = function (target: _TargetAble, targetAction: TargetAction) {
    if (this.memory.debug) { console.log('DEBUG: settarget: ' + target + ' ' + targetAction); }
    if (!this.target && !this.action) {
        this.target = target;
        this.memory.targetAction = targetAction;
    }
    return this.actionTarget();
}

Creep.prototype.clearTarget = function (): void {
    if (this.memory.debug) { console.log('DEBUG: clearTarget: ' + this.name); }
    this.memory.target = undefined;
    this.memory.targetAction = undefined;
    this.memory.energyTarget = undefined;
}

Object.defineProperty(Creep.prototype, 'working', {
    get() {
        const working = this.memory.working;
        if (working && _.sum(this.carry) === 0) {
            this.memory.working = false;
            this.clearTarget();
            return false;
        } else if (!working && _.sum(this.carry) === this.carryCapacity) {
            this.memory.working = true;
            this.clearTarget();
            return true;
        } else {
            return working;
        }
    },
    configurable: true,
});

Object.defineProperty(Creep.prototype, 'action', {
    get() {
        if (this._action) { return this._action; }
        if (this.memory.waitTime) {
            if (Game.time >= this.memory.waitTime) {
                this.memory.waitTime = undefined;
            } else {
                this.say('⏰');
                this._action = true;
                return true;
            }
        }
        /*if (this.memory.recycle) {
            this._action = false;
        }*/
        this._action = false;
        return false;
    },
    set(newVal) {
        if (!this.action) {
            this._action = newVal;
        }
    },
    configurable: true,
});

Creep.prototype.wait = function (time: number): void {
    this.say('⏰');
    this.action = true;
    this.memory.waitTime = Game.time + time;
}

Creep.prototype.actionTarget = function (): boolean {
    if (this.action) { return true; }
    if (!this.memory.target || !this.memory.targetAction) { return false; }
    const t = this.target;
    if (!t) {
        this.clearTarget();
        return false;
    }
    if (this.memory.debug) { console.log('DEBUG: actionTarget: ' + this.name + ' ' + this.memory.targetAction + ' ' + t + ' ' + t!.pos.print); }
    switch (this.memory.targetAction) {
        case TargetAction.MOVETO: {
            const _t = t as Creep | Structure;
            if (this.pos.isNearTo(_t.pos.x, _t.pos.y)) {
                this.clearTarget();
                return false;
            }
            creepActions.moveTo(this, _t, false);
        }
        case TargetAction.BUILD: {
            creepActions.moveToBuild(this, t as ConstructionSite);
            this.say("🛠️");
            if (t.pos.room) { t.pos.room.visual.text("🛠️", t.pos); }
            this.action = true;
            return true;
        }
        case TargetAction.REPAIR: {
            const tRep = t as Structure;
            if (tRep.hits < tRep.hitsMax) {
                creepActions.moveToRepair(this, tRep);
                this.say("🔧");
                if (t.pos.room) { t.pos.room.visual.text("🔧", t.pos); }
                this.action = true;
                return true;
            }
            this.clearTarget();
            return false;
        }
        case TargetAction.MINE: {
            const tMine = t as Source | Mineral | Deposit;
            if (tMine instanceof Source) {
                if (tMine.energy <= 0) {
                    this.clearTarget();
                    return false;
                }
            }
            const ret = this.harvest(tMine);
            if (ret === ERR_NOT_IN_RANGE) {
                creepActions.moveTo(this, tMine.pos, false);
                this.say('⛏️');
                this.action = true;
                return true;
            } else if (ret === OK) {
                this.say('⛏️');
                this.action = true;
                return true;
            } else {
                return false;
            }
        }
        case TargetAction.PICKUP: {
            const tPick = t as Resource;
            creepActions.moveToPickup(this, tPick);
            this.action = true;
            return true;
        }
        case TargetAction.DEPOSITENERGY: {
            const _t = t as Creep | AnyStoreStructure;
            // if (this.memory.debug) { console.log('DEBUG: getFreeCapacity ' + _t.store.getFreeCapacity(RESOURCE_ENERGY)) }
            const freeCap = _t.store.getFreeCapacity(RESOURCE_ENERGY);
            let myEnergy = this.store.energy;
            if (freeCap > 0 && myEnergy > 0) {

                if (!this.pos.isNearTo(_t.pos)) {
                    creepActions.moveTo(this, _t.pos);
                    this.action = true;
                    this.say("💰");
                    return true;
                }
                // creepActions.moveToTransfer(this, _t);
                if (myEnergy > freeCap && _t instanceof Structure) {
                    // multi-fill!
                    const struct = this.pos.findInRange(FIND_STRUCTURES, 1, { filter: x => energyStructures.includes(x.structureType) });
                    if (struct && struct.length > 0) {
                        for (const _s of struct) {
                            const s = _s as StructureExtension | StructureTower | StructureSpawn;
                            if (myEnergy <= 0) {
                                break;
                            }
                            const amount = s.store.getFreeCapacity(RESOURCE_ENERGY);
                            myEnergy -= amount;
                            this.transfer(s, RESOURCE_ENERGY, amount);
                        }
                    } else {
                        // just send to target
                        this.transfer(_t, RESOURCE_ENERGY);
                    }

                } else {
                    const ret = this.transfer(_t, RESOURCE_ENERGY);
                    if (ret === ERR_NOT_IN_RANGE) {
                        creepActions.moveTo(this, _t.pos);
                    }
                }
                this.action = true;
                this.say("💰");
                return true;
            } else {
                this.clearTarget();
                return false;
            }
        }
        case TargetAction.DEPOSIT: {
            const _t = t as Creep | AnyStoreStructure;
            if (_t.store.getFreeCapacity() > 10 && this.store.getUsedCapacity() > 0) {
                creepActions.moveToTransferAll(this, _t);
                this.action = true;
                return true;
            } else {
                this.clearTarget();
                return false;
            }
        }
        case TargetAction.WITHDRAWENERGY: {
            const _t = t as AnyStoreStructure | Ruin | Tombstone;
            if (_t.store.energy > 10 && this.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
                creepActions.moveToWithdraw(this, _t);
                this.action = true;
                return true;
            } else {
                this.clearTarget();
                return false;
            }
        }
        case TargetAction.WITHDRAW: {
            const _t = t as AnyStoreStructure | Ruin | Tombstone;
            if (_.sum(_t.store) > 10 && (this.carryCapacity - _.sum(this.store)) > 0) {
                creepActions.moveToWithdrawAll(this, _t);
                this.action = true;
                return true;
            } else {
                this.clearTarget();
                return false;
            }
        }
        case TargetAction.HEAL: {
            const _t = t as Creep;
            if (this.hits < this.hitsMax) { // Heal self first
                this.heal(this);
                this.action = true;
                return true;
            }
            if (_t.hits < _t.hitsMax) {
                if (this.heal(_t) === ERR_NOT_IN_RANGE) {
                    this.moveTo(_t);
                }
                this.action = true;
                return true;
            }
            return false;
        }
        case TargetAction.ATTACK: {
            const _t = t as Creep | Structure;
            if (this.pos.isNearTo(_t)) {
                this.attack(_t)
            } else {
                creepActions.moveTo(this, _t.pos);
            }
            this.action = true;
            return true;
        }
        case TargetAction.ATTACK_RANGED: {
            const _t = t as Creep | Structure;
            if (this.rangedAttack(_t) === ERR_NOT_IN_RANGE) {
                creepActions.moveTo(this, _t.pos);
            }
            this.action = true;
            return true;
        }
        case TargetAction.DISMANTLE: {
            const _t = t as Structure;
            if (this.pos.isNearTo(_t)) {
                this.dismantle(_t)
            } else {
                creepActions.moveTo(this, _t.pos);
            }
            this.action = true;
            return true;
        }
        case TargetAction.PRAISE: {
            const _t = t as StructureController;
            if (this.store.energy === 0) { this.clearTarget(); }
            if (this.pos.inRangeTo(_t, 2)) {
                this.upgradeController(_t);
                if (!this.memory.inPosition) {
                    creepActions.yieldRoad(this, _t, true);
                }
            } else {
                creepActions.moveTo(this, _t.pos);
            }
            this.action = true;
            return true;
        }
        case TargetAction.SIGN: {
            const _t = t as StructureController;
            if (!_t.sign || _t.sign.text === Memory.sign) { this.clearTarget(); return false; }
            if (this.pos.isNearTo(_t.pos)) {
                this.signController(_t, Memory.sign);
            } else {
                creepActions.moveTo(this, _t.pos);
            }
            this.action = true;
            return true;
        }
        default: {
            console.log(this.name + ' performed unknown action ' + this.memory.targetAction);
            this.clearTarget();
        }
    }
    return false;
}

Creep.prototype.rally = function (): void {
    if (!this.action) {
        if (this.memory.debug) { console.log('DEBUG: rally: ' + this.name); }
        this.clearTarget();
        const rally = this.room.rally;
        if (this.pos.isNearTo(rally)) {
            this.wait(3);
        } else {
            creepActions.moveTo(this, rally, false);
        }
        this.say('🍺');
        this.action = true;
    }
}
