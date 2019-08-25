import { Operation } from "./Operation";

export class MiningOperation extends Operation {
    public finalizeOperation(): void {
        throw new Error("Method not implemented.");
    }
    public initOperation() {
        ;
    }
}
