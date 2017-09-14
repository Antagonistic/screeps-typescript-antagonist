// import {Operation} from "../operations/Operation";

export class Mission implements IMission {
  public name: string;
  public operation: IOperation;

  public roles: {[roleName: string]: Creep[]};

  constructor(operation: IOperation, name: string) {
    this.name = name;
    this.operation = operation;
    this.roles = {};
  }
}
