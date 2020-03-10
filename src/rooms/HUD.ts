import { profile } from "Profiler";
import { Empire } from "Empire";
import { EnergyStateString } from "config/Constants";

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
        text.push(`CPU    : ${Game.cpu.getUsed().toPrecision(3)}`);
        text.push(`Bucket : ${Game.cpu.bucket}`);
        this.globalVisual.multitext(text, 1, 1, {});

        this.runAllRooms();
    }

    public runControlledRoom(room: Room, offset: number = 0): void {
        const text: string[] = [];
        text.push(`RoomName    : ${room.name}`);
        text.push(`EnergyState : ${EnergyStateString[room.memory.energyState || 0]}`);
        text.push(`LastSpawned : ${room.memory.lastSpawned}`);
        text.push(`Fort        : ${room.memory.fort}`);
        text.push(`Energy      : ${room.memory.lastEnergy}`);
        this.globalVisual.multitext(text, 1 + (offset * 7), 3, {});
    }

    public runAllRooms() {
        let offset = 0;
        for (const sRName in global.emp.spawnRooms) {
            const sR = global.emp.spawnRooms[sRName];
            if (sR) {
                this.runControlledRoom(sR.room, offset);
                offset++;
            }
        }
    }

}
