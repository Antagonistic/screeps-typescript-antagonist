import { profile } from "Profiler";

@profile
export class HUD {
    constructor() {
        this.globalVisual = new RoomVisual();

    }
    public globalVisual: RoomVisual;

    public run(): void {
        // this.globalVisual.box(0, 10, 10, 10);
        const text: string[] = [];
        text.push("Antagonistic Stagnation");
        text.push(`CPU: ${Game.cpu.getUsed().toPrecision(3)}`);
        text.push(`Bucket: ${Game.cpu.bucket}`);
        this.globalVisual.multitext(text, 1, 1, {});
    }

}