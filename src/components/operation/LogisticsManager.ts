import { SpawnRoom } from "components/rooms/SpawnRoom";


export class LogisticsManager {
    public spawnRoom: SpawnRoom;
    public room: Room;
    constructor(spawnRoom: SpawnRoom) {
        this.spawnRoom = spawnRoom;
        this.room = spawnRoom.room;

    }
}
