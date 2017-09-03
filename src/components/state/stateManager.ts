// import * as Config from "../../config/config";

import { log } from "../../lib/logger/log";

import RoomStates from "./roomStates";

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
  printState(room);
}

export function printState(room: Room): void {
  const roomstate = room.memory.state;
  const State = roomstate as RoomStates;
  let stateStr: string;
  switch (State) {
    case RoomStates.WAR:
      stateStr = "WAR";
      break;
    case RoomStates.NEUTRAL:
      stateStr = "NEUTRAL";
      break;
    case RoomStates.MINE:
      stateStr = "MINE";
      break;
    case RoomStates.CLAIM:
      stateStr = "CLAIM";
      break;
    case RoomStates.BOOTSTRAP:
      stateStr = "BOOTSTRAP";
      break;
    case RoomStates.TRANSITION:
      stateStr = "TRANSITION";
      break;
    case RoomStates.STABLE:
      stateStr = "STABLE";
      break;
    default:
      stateStr = "UNDEFINED";
      break;
  }
  log.info("Room " + room.name + " state is " + stateStr);
}
