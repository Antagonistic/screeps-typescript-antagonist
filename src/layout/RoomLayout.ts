import { PLAN_SEGMENT, RoomClass, MAX_PLAN_SEGMENTS } from "config/Constants";
import { roomHelper } from "rooms/roomHelper";
import { ifError } from "assert";

export class RoomLayout {
    public data: RoomPlannerLayout;
    public roomName: string;

    constructor(roomName: string, empty: boolean = false) {
        this.roomName = roomName;
        if (empty) {
            this.data = this.getEmpty();
        } else {
            this.data = this.loadDataFromSegment(this.getSegment());
        }
    }

    protected getSegment() {
        return PLAN_SEGMENT + (roomHelper.getRoomUUID(this.roomName) % MAX_PLAN_SEGMENTS);
    }

    protected getEmpty(): RoomPlannerLayout {
        return {
            valid: false,
            core: {},
            POI: [],
            memory: {},
            layoutTime: Game.time,
            class: RoomClass.SQUARE
        };
    }

    protected loadDataFromSegment(segment: number): RoomPlannerLayout {
        const _data = RawMemory.segments[segment];
        let data: SavedLayouts = JSON.parse(_data);
        if (!data) { data = {} }
        return data[this.roomName];
    }

    protected saveToSegment(segment: number) {
        if (this.data.valid) {
            const _data = RawMemory.segments[segment];
            let data: SavedLayouts = {};
            try {
                data = JSON.parse(_data);
            }
            catch {
                console.log(`ROOMPLANNER: ${this.roomName} uninitialized segment ${segment}`);
            }
            data[this.roomName] = this.data;
            RawMemory.segments[segment] = JSON.stringify(data);
            console.log(`ROOMPLANNER: ${this.roomName} layout saved`);
        }
    }

    public applyLayout() {
        let RCL = 1;
        if (!this.data.valid) {
            console.log(`ROOMPLANNER: ${this.roomName} applying invalid layout!`);
        }
        const room = Game.rooms[this.roomName];
        const mem = Memory.rooms[this.roomName];
        if (room && room.controller && room.controller.my) {
            RCL = room.controller.level || 1;
        }
        const mineralActive = RCL > 6;
        const remotes = !mem.noRemote;

        mem.structures = {};

        this.applyRoomStructurePos(mem.structures, this.data.core, RCL);

        if (mineralActive && this.data.mineral) {
            this.applyRoomStructurePos(mem.structures, this.data.mineral, RCL);
        }
        if (remotes && this.data.remotes && RCL >= 4) {
            const remotes = Object.values(this.data.remotes);
            if (remotes.length > 0) {
                for (const r of remotes) {
                    const rmem = Memory.rooms[r.name];
                    if (rmem && rmem.active) {
                        this.applyRoomStructurePos(mem.structures, r.core, RCL);
                    }
                }
            }
        }
    }

    protected applyRoomStructurePos(target: RoomStructurePositions, source: RoomStructurePositions, RCL: number) {
        for (const _key in source) {
            const key = _key as BuildableStructureConstant;
            const present = target[key]?.length || 0;
            const max = CONTROLLER_STRUCTURES[key][RCL] - present;
            const list = source[key];
            if (list) {
                if (target[key]) {
                    _.take(list, max).forEach(x => target[key]!.push(x));
                }
                else {
                    target[key] = _.take(list, max);
                }
            }
        }
    }

    public visual() {
        const vis: MultiRoomVisual = {};
        vis[this.roomName] = new RoomVisual(this.roomName)
        this.renderPos(this.data.core, vis);
        if (this.data.mineral) { this.renderPos(this.data.mineral, vis); }
        if (this.data.remotes && Object.keys(this.data.remotes).length > 0) {
            _.each(this.data.remotes, x => {
                vis[x.name] = new RoomVisual(x.name);
                if (x.rally) { vis[x.name].circle(x.rally, { radius: 0.5, fill: "#FF2121" }) };
                this.renderPos(x.core, vis)
            });
        }
        if (!this.data.valid) {
            console.log(`ROOMPLANNER: Invalid layout ${_.flatten(Object.values(this.data.core)).length} structures`)
        }
        _.each(Object.values(vis), x => x.connectRoads());
        if (this.data.rally) {
            vis[this.roomName].circle(this.data.rally, { radius: 0.5, fill: "#FF2121" });
        }
    }

    protected renderPos(layout: RoomStructurePositions, visual: MultiRoomVisual) {
        for (const _key in layout) {
            const key = _key as BuildableStructureConstant;
            if (key === STRUCTURE_RAMPART) { continue; }
            for (const p of layout[key]!) {
                if (!visual[p.roomName]) { visual[p.roomName] = new RoomVisual(p.roomName); }
                visual[p.roomName].structure(p.x, p.y, key);
            }
        }
    }
}
