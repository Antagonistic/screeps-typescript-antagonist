export class Operation implements IOperation {
  public name: string;
  public type: string;

  public flag: Flag;
  public room: Room | undefined;

  public missions: {[roleName: string]: IMission} = {};

  constructor(flag: Flag, name: string, type: string) {
    this.flag = flag;
    this.name = name;
    this.type = type;
    this.room = flag.room;

    this.missions = {};
  }

  public init(): void {
    // console.log("Operation " + this.name + " initialized!");
  }
}
