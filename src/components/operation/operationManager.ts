import {ControllerOperation} from "./operations/ControllerOperation";
import {MiningOperation} from "./operations/MiningOperation";
import {Operation} from "./operations/Operation";

import {empire} from "../../Empire";

import { log } from "../../lib/logger/log";

// interface IOPERATION_CLASSES {
  // {[opType: string]: IOperation; };
  // [key: string]: IOperation;
// }

const OPERATION_CLASSES: {[opType: string]: typeof Operation; } = {
  controller: ControllerOperation,
  mining: MiningOperation
};

export function init(): void {
  const operationList: {[operationName: string]: IOperation} = empire.operations = {};
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

            let operation;
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
  // console.log("There are " + Object.keys(empire.operations).length + " operations");
}
