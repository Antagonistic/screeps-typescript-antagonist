import * as creepActions from "../creepActions";

/**
 * Runs all creep actions.
 *
 * @export
 * @param {Creep} creep
 */
export function run(creep: Creep, path: () => RoomPosition[]): void {

    let action: boolean = false;
    action = creepActions.actionRecycle(creep, action);

    if (!action && creepActions.canWork(creep)) {
        action = creepActions.actionMoveToRoom(creep, action, creep.memory.home);
        action = creepActions.actionFillEnergy(creep, action);
        action = creepActions.actionFillTower(creep, action);
        action = creepActions.actionFillBufferChest(creep, action);
        action = creepActions.actionFillEnergyStorage(creep, action);
        action = creepActions.actionFillUpgrader(creep, action);
        action = creepActions.actionUpgrade(creep, action);
    } else {
        action = creepActions.actionMoveToRoom(creep, action);
        action = creepActions.actionGetDroppedEnergy(creep, action, true);
        action = creepActions.actionGetContainerEnergy(creep, action, 2, true);
    }
}
