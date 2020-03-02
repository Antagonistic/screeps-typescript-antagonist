import { PLAN_SEGMENT, RoomClass } from "config/Constants";

export class RoomLayout {
    public data: RoomPlannerLayout;
    public roomName: string;

    constructor(roomName: string, empty: boolean = false) {
        this.roomName = roomName;
        if (empty) {
            this.data = this.getEmpty();
        } else {
            this.data = this.loadDataFromSegment(PLAN_SEGMENT);
        }
    }

    protected getEmpty(): RoomPlannerLayout {
        return {
            valid: true,
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
                console.log(`ROOMPLANNER: ${this.roomName} uninitialized segment`);
            }
            data[this.roomName] = this.data;
            RawMemory.segments[segment] = JSON.stringify(data);
            console.log(`ROOMPLANNER: ${this.roomName} layout saved`);
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
