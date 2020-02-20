{
    const g = global as any;
    if (!g.Room) { g.Room = g.Room || { prototype: {} }; }
}

import { roomHelper } from "rooms/roomHelper";

Object.defineProperty(Room.prototype, 'print', {
    get() {
        return '<a href="#!/room/' + Game.shard.name + '/' + this.name + '">[' + this.name + ']</a>';
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'printPlain', {
    get() {
        return `[${this.name}]`;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'UUID', {
    get() {
        if (!this.memory.UUID) {
            this.memory.UUID = roomHelper.getRoomUUID(this.name);
        }
        return this.memory.UUID;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'storage', {
    get() {
        if (!this._storage) {
            this._storage = _.find(this.find(FIND_STRUCTURES, { filter: (x: Structure) => x.structureType === STRUCTURE_STORAGE && x.isActive() }));
        }
        return this._storage;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'creeps', {
    get() {
        if (!this._creeps) {
            this._creeps = this.find(FIND_MY_CREEPS);
        }
        return this._creeps;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'owner', {
    get() {
        return this.controller && this.controller.owner ? this.controller.owner.username : undefined;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'reserved', {
    get() {
        return this.controller && this.controller.reservation ? this.controller.reservation.username : undefined;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'rally', {
    get() {
        if (!this._rally) {
            const rallyFlag = _.filter(this.flags,
                (x: Flag) => x.name.startsWith("rally")
            );
            if (rallyFlag && rallyFlag.length > 0) {
                this._rally = rallyFlag[0].pos;
            } else {
                this._rally = new RoomPosition(25, 25, this.name);
            }
        }
        return this._rally;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'hostiles', {
    get() {
        if (!this._hostiles) {
            this._hostiles = this.find(FIND_HOSTILE_CREEPS);
        }
        return this._hostiles;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'invaders', {
    get() {
        if (!this._invaders) {
            this._invaders = _.filter(this.hostiles, (creep: Creep) => creep.owner.username === 'Invader');
        }
        return this._invaders;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'sourceKeepers', {
    get() {
        if (!this._sourceKeepers) {
            this._sourceKeepers = _.filter(this.hostiles, (creep: Creep) => creep.owner.username === 'Source Keeper');
        }
        return this._sourceKeepers;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'playerHostiles', {
    get() {
        if (!this._playerHostiles) {
            this._playerHostiles = _.filter(this.hostiles,
                (creep: Creep) => creep.owner.username !== 'Invader'
                    && creep.owner.username !== 'Source Keeper');
        }
        return this._playerHostiles;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'dangerousHostiles', {
    get() {
        if (!this._dangerousHostiles) {
            if (this.my) {
                this._dangerousHostiles = _.filter(this.hostiles,
                    (creep: Creep) => creep.getActiveBodyparts(ATTACK) > 0
                        || creep.getActiveBodyparts(WORK) > 0
                        || creep.getActiveBodyparts(RANGED_ATTACK) > 0
                        || creep.getActiveBodyparts(HEAL) > 0
                        || creep.owner.username === "Invader");
            } else {
                this._dangerousHostiles = _.filter(this.hostiles,
                    (creep: Creep) => creep.getActiveBodyparts(ATTACK) > 0
                        || creep.getActiveBodyparts(RANGED_ATTACK) > 0
                        || creep.getActiveBodyparts(HEAL) > 0
                        || creep.owner.username === "Invader");
            }
        }
        return this._dangerousHostiles;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'dangerousPlayerHostiles', {
    get() {
        if (!this._dangerousPlayerHostiles) {
            this._dangerousPlayerHostiles = _.filter(this.playerHostiles,
                (c: Creep) => c.getActiveBodyparts(ATTACK) > 0
                    || c.getActiveBodyparts(WORK) > 0
                    || c.getActiveBodyparts(RANGED_ATTACK) > 0
                    || c.getActiveBodyparts(HEAL) > 0);
        }
        return this._dangerousPlayerHostiles;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'flags', {
    get() {
        if (!this._flags) {
            this._flags = this.find(FIND_FLAGS);
        }
        return this._flags;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'drops', {
    get() {
        if (!this._drops) {
            this._drops = _.groupBy(this.find(FIND_DROPPED_RESOURCES), (r: Resource) => r.resourceType);
        }
        return this._drops;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'droppedEnergy', {
    get() {
        return this.drops[RESOURCE_ENERGY] || [];
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'droppedPower', {
    get() {
        return this.drops[RESOURCE_POWER] || [];
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'ruins', {
    get() {
        if (!this._ruins) {
            this._ruins = this.find(FIND_RUINS);
        }
        return this._ruins;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'tombstones', {
    get() {
        if (!this._tombstones) {
            this._tombstones = this.find(FIND_TOMBSTONES);
        }
        return this._tombstones;
    },
    configurable: true,
});

Object.defineProperty(Room.prototype, 'sortedSources', {
    get() {
        if (!this._sortedSources) {
            const center = this.controller?.pos || new RoomPosition(25, 25, this.name);
            this._sortedSources = _.sortBy(this.find(FIND_SOURCES), [(x: Source) => x.pos.getRangeTo(center)]);
        }
        return this._sortedSources;
    },
    configurable: true,
});
