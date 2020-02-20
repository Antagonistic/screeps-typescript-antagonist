import { profile } from "Profiler";
import { layoutManager, SingleLayout } from "rooms/layoutManager";

@profile
export class LayoutVisualizer {
    public roomName: string;
    public room: Room;
    public valid: boolean = false;
    constructor(roomName: string) {
        this.roomName = roomName;
        this.room = Game.rooms[roomName];
        if (this.room) {
            if (this.room.memory.visual) {
                this.valid = true;
            }
        }
    }

    public run() {
        if (!this.room) { return; }

        try {
            const layouts = layoutManager.getLayouts(this.room);
            for (const l of layouts) {
                this.visualLayout(l);
            }
        }
        catch (err) {
            console.log("LayoutVisualizer error: " + err);
        }
    }

    private visualLayout(layout: SingleLayout) {
        const iter = Game.time % 7 + 2;
        if (layout.layout.road && layout.layout.road.length > 0) {
            this.renderPos(layout.layout.road, layout.pos, STRUCTURE_ROAD);
        }
        for (let i = 0; i < iter; i++) {
            if (layout.layout[i]) {
                const rclLayout = layout.layout[i];
                for (const key in rclLayout.build) {
                    const _key = key as BuildableStructureConstant;
                    const build = rclLayout.build[_key];
                    if (build) {
                        this.renderPos(build, layout.pos, _key);
                    }
                }
            }
        }
        this.room.visual.connectRoads();
    }

    private visualRCLLayout() {
        const iter = Game.time % 8;
    }

    private renderPos(pos: LightRoomPos[], anchor: LightRoomPos, type: StructureConstant) {
        for (const p of pos) {
            this.room.visual.structure(p.x - anchor.x, p.y - anchor.y, type);
        }
    }

}
