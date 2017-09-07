// import * as Config from "../../config/config";

import { log } from "../../lib/logger/log";

import * as BootStrapState from "./states/bootstrap";
import * as ClaimState from "./states/claim";
import * as MineState from "./states/mine";
import * as StableState from "./states/stable";
import * as TransitionState from "./states/transition";

export function run(room: Room): void {
  const roomstate = room.memory.state;
  const State = roomstate as RoomStates;
  if (!State) {
    if (room.controller && room.controller.my) {
      room.memory.state = RoomStates.CLAIM;
    } else {
      room.memory.state = RoomStates.NEUTRAL;
    }
  } else {
    switch (State) {
      case RoomStates.WAR:
        break;
      case RoomStates.NEUTRAL:

        break;
      case RoomStates.MINE:
        MineState.run(room);
        break;
      case RoomStates.CLAIM:
        ClaimState.run(room);
        break;
      case RoomStates.BOOTSTRAP:
        BootStrapState.run(room);
        break;
      case RoomStates.TRANSITION:
        TransitionState.run(room);
        break;
      case RoomStates.STABLE:
        StableState.run(room);
        break;
      default:

        break;
    }
  }
  // printState(room);
}

export function stateChange(room: Room, newState: RoomStates) {
  const state = room.memory.state;
  log.info(room.name + ": State changed from " + stateString(state) + "(" + state + ") to " +
    stateString(newState) + "(" + newState + ")");
  room.memory.state = newState;
}

export function stateString(state: RoomStates): string {
  switch (state) {
    case RoomStates.WAR:
      return "WAR";
    case RoomStates.NEUTRAL:
      return "NEUTRAL";
    case RoomStates.MINE:
      return "MINE";
    case RoomStates.CLAIM:
      return "CLAIM";
    case RoomStates.BOOTSTRAP:
      return "BOOTSTRAP";
    case RoomStates.TRANSITION:
      return "TRANSITION";
    case RoomStates.STABLE:
      return "STABLE";
    default:
      return "UNDEFINED";
  }
}

export function printState(room: Room): void {
  const roomstate = room.memory.state;
  const State = roomstate as RoomStates;
  const stateStr: string = stateString(State);
  log.info("Room " + room.name + " state is " + stateStr);
}
