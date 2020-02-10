import { profile } from "Profiler/Profiler";
import { roomHelper } from "rooms/roomHelper";
import { AutoLayout } from "./AutoLayout";

@profile
export class AutoSnakeLayout extends AutoLayout {
    public snakeMatrix?: CostMatrix;

    public road1?: RoomPosition[];
    public road2?: RoomPosition[];
    public ext1?: RoomPosition[];
    public ext2?: RoomPosition[];
    public storage?: RoomPosition;
    public spawn?: RoomPosition;

    public run(visual: boolean = false) {
        if (!Memory.rooms[this.roomName].snakeInit || Game.time % 10 === 0) {
            if (Game.rooms[this.roomName]) {
                this.snakeMatrix = this.combine(this.getWalkableGridMatrix(), this.blockOffMatrix());
                if (visual) { this.viewCostMatrix(this.snakeMatrix); }
                this.runSnakeLayout();
            }
        } else {
            this.readCache();
        }
        if (visual) { this.runVisual(); }
    }

    public runVisual() {
        if (this.road1) { this.visual.poly(this.road1, { stroke: '#0000AA' }) };
        if (this.road2) { this.visual.poly(this.road2, { stroke: '#00AA00' }) };
        if (this.storage) { this.visual.structure(this.storage.x, this.storage.y, STRUCTURE_STORAGE) };
        if (this.spawn) { this.visual.structure(this.spawn.x, this.spawn.y, STRUCTURE_SPAWN) };
        Memory.rooms[this.roomName].snakeExt1 = this.ext1;
        if (this.ext1) { this.ext1.forEach(i => this.visual.structure(i.x, i.y, STRUCTURE_EXTENSION)) };
        if (this.ext2) { this.ext2.forEach(i => this.visual.structure(i.x, i.y, STRUCTURE_EXTENSION)) };
        this.getContainers().forEach(i => this.visual.structure(i.x, i.y, STRUCTURE_CONTAINER));
        const tower = this.getTower();
        if (tower) { this.visual.structure(tower.x, tower.y, STRUCTURE_TOWER); }
    }

    public cacheResult() {
        Memory.rooms[this.roomName].snakeInit = true;
        Memory.rooms[this.roomName].snakeRoad1 = this.road1;
        Memory.rooms[this.roomName].snakeRoad2 = this.road2;
        Memory.rooms[this.roomName].snakeExt1 = this.ext1;
        Memory.rooms[this.roomName].snakeExt2 = this.ext2;
        Memory.rooms[this.roomName].snakeStorage = this.storage;
        Memory.rooms[this.roomName].snakeSpawn = this.spawn;
    }

    public readCache() {
        this.road1 = roomHelper.deserializeRoomPositions(Memory.rooms[this.roomName].snakeRoad1);
        this.road2 = roomHelper.deserializeRoomPositions(Memory.rooms[this.roomName].snakeRoad2);
        this.ext1 = roomHelper.deserializeRoomPositions(Memory.rooms[this.roomName].snakeExt1);
        this.ext2 = roomHelper.deserializeRoomPositions(Memory.rooms[this.roomName].snakeExt2);
        this.storage = roomHelper.deserializeRoomPosition(Memory.rooms[this.roomName].snakeStorage);
        this.spawn = roomHelper.deserializeRoomPosition(Memory.rooms[this.roomName].snakeSpawn);
    }

    public clearCache() {
        Memory.rooms[this.roomName].snakeInit = undefined;
        Memory.rooms[this.roomName].snakeRoad1 = undefined;
        Memory.rooms[this.roomName].snakeRoad2 = undefined;
        Memory.rooms[this.roomName].snakeExt1 = undefined;
        Memory.rooms[this.roomName].snakeExt2 = undefined;
        Memory.rooms[this.roomName].snakeStorage = undefined;
        Memory.rooms[this.roomName].snakeSpawn = undefined;
    }

    public getExt() {
        if (!this.ext1 || !this.ext2) { return [] }
        return _.filter(_.flatten(_.zip(this.ext1, this.ext2)), x => x instanceof RoomPosition);
    }

    public getContainers() {
        const ret: RoomPosition[] = [];
        const room = Game.rooms[this.roomName];
        if (room) {
            const sources = room.find(FIND_SOURCES);
            for (const s of sources) {
                const pos = AutoLayout.getSpotCandidate1(s.pos);
                if (pos) { ret.push(pos); }
            }
            if (room.controller) {
                const pos = AutoLayout.getSpotCandidate2(room.controller.pos);
                if (pos) { ret.push(pos); }
            }
        }
        return ret;
    }

    public getTower() {
        let candidates: RoomPosition[] = [];
        if (this.road1 && this.road1.length > 0) {
            let _candidates = AutoLayout.getOpenCardinalPosition(this.road1[0])
            if (_candidates.length > 0) {
                _candidates = _.filter(_candidates, (x: RoomPosition) => this.openPosition(x));
                if (_candidates.length > 0) { candidates = candidates.concat(_candidates); }
            }
        }
        if (this.road2 && this.road2.length > 0) {
            let _candidates = AutoLayout.getOpenCardinalPosition(this.road2[0])
            if (_candidates.length > 0) {
                _candidates = _.filter(_candidates, (x: RoomPosition) => this.openPosition(x));
                if (_candidates.length > 0) { candidates = candidates.concat(_candidates); }
            }
        }
        if (candidates.length === 0) {
            console.log('SNAKE: ' + this.roomName + ' has no space for tower?');
            return undefined;
        }
        return new RoomPosition(25, 25, this.roomName).findClosestByRange(candidates) || undefined;
    }

    public openPosition(pos: RoomPosition) {
        if (this.road1 && this.road1.length > 0) { if (_.any(this.road1, x => x.printPlain === pos.printPlain)) { return false; } }
        if (this.road2 && this.road2.length > 0) { if (_.any(this.road2, x => x.printPlain === pos.printPlain)) { return false; } }
        if (this.ext1 && this.ext1.length > 0) { if (_.any(this.ext1, x => x.printPlain === pos.printPlain)) { return false; } }
        if (this.ext2 && this.ext2.length > 0) { if (_.any(this.ext2, x => x.printPlain === pos.printPlain)) { return false; } }
        if (this.spawn) { if (this.spawn.printPlain === pos.printPlain) { return false; } }
        if (this.storage) { if (this.storage.printPlain === pos.printPlain) { return false; } }
        return true;
    }

    public runSnakeLayout(visual: boolean = false) {
        const room = Game.rooms[this.roomName];
        if (room) {
            const sources = room.find(FIND_SOURCES);
            const controller = room.controller;
            if (sources.length > 0 && controller) {
                this.storage = AutoLayout.getSpotCandidate3(controller.pos);
                if (this.storage) {
                    const closestSource = this.storage.findClosestByRange(sources);
                    this.spawn = AutoLayout.getSpotCandidate2(closestSource!.pos);
                    // this.visual.structure(this.storage.x, this.storage.y, STRUCTURE_STORAGE);
                    // this.visual.circle(controlSpot.x, controlSpot.y, { radius: 0.25, fill: '#0000BB' });
                    // const closest = controller.pos.findClosestByRange(sources);
                    let roadSpot: RoomPosition | undefined;
                    for (const s of sources) {
                        const sourceSpot = AutoLayout.getSpotCandidate1(s.pos);
                        if (sourceSpot) {
                            // this.visual.structure(sourceSpot.x, sourceSpot.y, STRUCTURE_CONTAINER);
                            if (visual) { this.visual.line(s.pos, controller.pos); }
                            if (!roadSpot) {
                                const path = this.PathFind(sourceSpot, this.storage, this.snakeMatrix!, 1);
                                roadSpot = _.last(path);
                                if (s === closestSource) {
                                    const close = _.find(AutoLayout.getOpenCardinalPosition(_.head(path)), x => x.inRangeTo(sourceSpot, 1));
                                    if (close) { this.spawn = close; }
                                }
                                this.road1 = path;
                            } else {
                                const path = this.PathFind(sourceSpot, roadSpot, this.snakeMatrix!, 0);
                                if (s === closestSource) {
                                    const close = _.find(AutoLayout.getOpenCardinalPosition(_.head(path)), x => x.inRangeTo(sourceSpot, 1));
                                    if (close) { this.spawn = close; }
                                }
                                this.road2 = path;
                            }

                        }
                    }
                }

                const _ext1 = _.unique(_.flatten(_.map(this.road1!, x => AutoLayout.getOpenCardinalPosition(x, true))), false, x => x.printPlain);
                this.ext1 = [];
                let count1 = 1;
                for (const ex of _ext1) {
                    if (ex.inRangeTo(sources[0], 2)) { continue; }
                    if (ex.inRangeTo(this.storage!, 2)) { continue; }
                    if (ex.inRangeTo(this.spawn!, 1)) { continue; }
                    this.ext1.push(ex);
                    count1++;
                    // if (count1 > 30) { break; }
                }
                const _ext2 = _.unique(_.flatten(_.map(this.road2!, x => AutoLayout.getOpenCardinalPosition(x, true))), false, x => x.printPlain);
                this.ext2 = [];
                let count2 = 1;
                for (const ex of _ext2) {
                    if (ex.inRangeTo(sources[1], 2)) { continue; }
                    if (ex.inRangeTo(this.storage!, 2)) { continue; }
                    if (ex.inRangeTo(this.spawn!, 1)) { continue; }
                    this.ext2.push(ex);
                    count2++;
                    // if (count2 > 30) { break; }
                }
            }
            this.cacheResult();
        }
    }
}
