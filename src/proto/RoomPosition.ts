Object.defineProperty(RoomPosition.prototype, 'print', {
    get() {
        return '<a href="#!/room/' + Game.shard.name + '/' + this.roomName + '">[' + this.roomName + ', ' + this.x +
            ', ' + this.y + ']</a>';
    },
    configurable: true,
});

Object.defineProperty(RoomPosition.prototype, 'printPlain', {
    get() {
        return `[${this.roomName}, ${this.x}, ${this.y}]`;
    },
    configurable: true,
});

Object.defineProperty(RoomPosition.prototype, 'room', { // identifier for the pos, used in caching
    get() {
        return Game.rooms[this.roomName];
    },
    configurable: true,
});

Object.defineProperty(RoomPosition.prototype, 'lightRoomPos', { // identifier for the pos, used in caching
    get(): LightRoomPos {
        return { x: this.x, y: this.y };
    },
    configurable: true,
});

Object.defineProperty(RoomPosition.prototype, 'isEdge', { // if the position is at the edge of a room
    get() {
        return this.x === 0 || this.x === 49 || this.y === 0 || this.y === 49;
    },
    configurable: true,
});

Object.defineProperty(RoomPosition.prototype, 'isVisible', { // if the position is in a defined room
    get() {
        return Game.rooms[this.roomName] !== undefined;
    },
    configurable: true,
});

RoomPosition.prototype.lookForStructure = function (structureType: StructureConstant): Structure | undefined {
    return _.find(this.lookFor(LOOK_STRUCTURES), s => s.structureType === structureType);
};

RoomPosition.prototype.findStructureInRange = function (structureType: StructureConstant, range: number = 1): Structure | undefined {
    const ret = _.find(this.findInRange(FIND_STRUCTURES, range, { filter: x => x.structureType === structureType })) as Structure | undefined;
    if (!ret) { return undefined; }
    return ret;
}

RoomPosition.prototype.openAdjacentSpots = function (ignoreCreeps?: boolean): RoomPosition[] {
    const positions = [];
    for (let i = 1; i <= 8; i++) {
        const testPosition = this.getPositionAtDirection(i);
        if (!testPosition) { continue; }
        if (testPosition.isEdge) { continue; }
        if (testPosition.isPassible(ignoreCreeps)) {
            // passed all tests
            positions.push(testPosition);
        }
    }
    return positions;
};

RoomPosition.prototype.getPositionAtDirection = function (direction: number, range?: number): RoomPosition | undefined {
    if (!range) {
        range = 1;
    }
    let x = this.x;
    let y = this.y;
    const room = this.roomName;

    if (direction === 1) {
        y -= range;
    }
    else if (direction === 2) {
        y -= range;
        x += range;
    }
    else if (direction === 3) {
        x += range;
    }
    else if (direction === 4) {
        x += range;
        y += range;
    }
    else if (direction === 5) {
        y += range;
    }
    else if (direction === 6) {
        y += range;
        x -= range;
    }
    else if (direction === 7) {
        x -= range;
    }
    else if (direction === 8) {
        x -= range;
        y -= range;
    }
    if (x < 0 || x > 49 || y < 0 || y > 49) { return undefined; }
    return new RoomPosition(x, y, room);
};

RoomPosition.prototype.isPassible = function (ignoreCreeps?: boolean): boolean {
    if (this.isNearExit(0)) { return false; }

    // look for walls
    if (_.head(this.lookFor(LOOK_TERRAIN)) !== "wall") {

        // look for creeps
        if (ignoreCreeps || this.lookFor(LOOK_CREEPS).length === 0) {

            // look for impassible structions
            if (_.filter(this.lookFor(LOOK_STRUCTURES), (struct: Structure) => {
                return struct.structureType !== STRUCTURE_ROAD
                    && struct.structureType !== STRUCTURE_CONTAINER
                    && struct.structureType !== STRUCTURE_RAMPART;
            }).length === 0) {

                // passed all tests
                return true;
            }
        }
    }

    return false;
};

RoomPosition.prototype.isNearExit = function (range: number): boolean {
    return this.x - range <= 0 || this.x + range >= 49 || this.y - range <= 0 || this.y + range >= 49;
};
