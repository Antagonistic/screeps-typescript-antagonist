import { ControllerOperation, initNewControllerOperation } from "./operations/ControllerOperation";
import { MiningOperation } from "./operations/MiningOperation";
import { Operation } from "./operations/Operation";

import { empire } from "../../Empire";

import { log } from "../../lib/logger/log";

// interface IOPERATION_CLASSES {
// {[opType: string]: IOperation; };
// [key: string]: IOperation;
// }

const OPERATION_CLASSES: any = {
  controller: ControllerOperation,
  mining: MiningOperation
};

export function init(): Operation[] {
  const operationList: { [operationName: string]: Operation } = {};
  for (const flagName in Game.flags) {
    for (const typeName in OPERATION_CLASSES) {
      if (!OPERATION_CLASSES.hasOwnProperty(typeName)) continue;
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

  if (Game.time % 100 == 0) {
    for (const roomName in Game.rooms) {
      const room = Game.rooms[roomName];
      if (room.controller && room.controller.my) {
        let hasControllerOp = false;
        const flags = room.find(FIND_FLAGS);
        for (const flag of flags) {
          if (flag.name.startsWith("controller")) {
            hasControllerOp = true;
          }
        }
        if (!hasControllerOp) { initNewControllerOperation(room); }
      }
    }
  }

  Game.operations = operationList;
  return _.sortBy(operationList, (operation: Operation) => operation.priority);
}
