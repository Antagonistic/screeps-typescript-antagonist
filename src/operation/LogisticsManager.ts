import { SpawnRoom } from "rooms/SpawnRoom";
import { Operation } from "./operations/Operation";


export class LogisticsManager {
    public spawnRoom: SpawnRoom;
    public room: Room;
    public operations: Operation[] = [];
    constructor(spawnRoom: SpawnRoom) {
        this.spawnRoom = spawnRoom;
        this.room = spawnRoom.room;
    }

    public registerOperation(operation: Operation) {
        this.operations.push(operation);
    }

}
