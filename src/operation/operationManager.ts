import { ControllerOperation } from "./operations/ControllerOperation";
import { MiningOperation } from "./operations/MiningOperation";
import { Operation } from "./operations/Operation";

import { Empire } from "../Empire";

import { log } from "../lib/logger/log";
import { GuardOperation } from "./operations/GuardOperation";
import { InvaderOperation } from "./operations/InvaderOperation";
import { LootOperation } from "./operations/LootOperation";
import { PowerOperation } from "./operations/PowerOperation";
import { SnakeOperation } from "./operations/SnakeOperation";

// interface IOPERATION_CLASSES {
// {[opType: string]: IOperation; };
// [key: string]: IOperation;
// }

const OPERATION_CLASSES: any = {
  controller: ControllerOperation,
  guard: GuardOperation,
  invader: InvaderOperation,
  loot: LootOperation,
  mining: MiningOperation,
  power: PowerOperation,
  snake: SnakeOperation
};

export function init(): Operation[] {
  const operationList: { [operationName: string]: Operation } = {};
  for (const flagName in Game.flags) {
    for (const typeName in OPERATION_CLASSES) {
      if (!OPERATION_CLASSES.hasOwnProperty(typeName)) { continue; }
      if (flagName.substring(0, typeName.length) === typeName) {
        const operationClass = OPERATION_CLASSES[typeName];
        const flag = Game.flags[flagName];
        const name = flagName.substring(flagName.indexOf("_") + 1);

        if (operationList.hasOwnProperty(name)) {
          log.info(`operation with name ${name} already exists (type: ${operationList[name].type})`);
          continue;
        }

        let operation: Operation;
        try {
          operation = new operationClass(flag, name, typeName);
          operationList[name] = operation;
          operation.init();
        } catch (e) {
          console.log("error parsing flag name and bootstrapping operation");
          console.log(e);
        }

        // operationList[name] = operation;
        // global[name] = operation;
      }
    }
  }

  Game.operations = operationList;
  return _.sortBy(operationList, (operation: Operation) => operation.priority);
}
