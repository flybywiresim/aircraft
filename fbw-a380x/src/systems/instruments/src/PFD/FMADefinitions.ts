/* eslint-disable no-constant-condition */
/* eslint-disable no-dupe-else-if */

import { Arinc429WordData } from '@flybywiresim/fbw-sdk';

export enum A1A2Messages {
  NONE = 0,
  MAN_TOGA,
  MAN_GA_SOFT,
  MAN_FLEX,
  MAN_MCT,
  MAN_THR,
  SPEED,
  MACH,
  THR_MCT,
  THR_CLB,
  THR_LVR,
  THR_IDLE,
  A_FLOOR,
  TOGA_LK,
  BTV,
  BRK_LO,
  BRK_2,
  BRK_3,
  BRK_HI,
  BRK_RTO,
}

export function computeA1A2Message(
  atEngaged: boolean,
  atActive: boolean,
  atsFmaDiscreteWord: Arinc429WordData,
  autoBrakeActive: boolean,
  autoBrakeMode: number,
): A1A2Messages {
  if (atsFmaDiscreteWord.bitValueOr(11, false)) {
    return A1A2Messages.MAN_TOGA;
  } else if (false) {
    return A1A2Messages.MAN_GA_SOFT;
  } else if (atsFmaDiscreteWord.bitValueOr(13, false)) {
    return A1A2Messages.MAN_FLEX;
  } else if (atsFmaDiscreteWord.bitValueOr(12, false) && atEngaged && !atActive) {
    return A1A2Messages.MAN_MCT;
  } else if (atsFmaDiscreteWord.bitValueOr(15, false) && atEngaged && !atActive) {
    return A1A2Messages.MAN_THR;
  } else if (atsFmaDiscreteWord.bitValueOr(19, false)) {
    return A1A2Messages.SPEED;
  } else if (atsFmaDiscreteWord.bitValueOr(20, false)) {
    return A1A2Messages.MACH;
  } else if (atsFmaDiscreteWord.bitValueOr(12, false)) {
    return A1A2Messages.THR_MCT;
  } else if (atsFmaDiscreteWord.bitValueOr(14, false)) {
    return A1A2Messages.THR_CLB;
  } else if (atsFmaDiscreteWord.bitValueOr(15, false) && atEngaged && atActive) {
    return A1A2Messages.THR_LVR;
  } else if (atsFmaDiscreteWord.bitValueOr(16, false)) {
    return A1A2Messages.THR_IDLE;
  } else if (atsFmaDiscreteWord.bitValueOr(17, false) && atEngaged && atActive) {
    return A1A2Messages.A_FLOOR;
  } else if (atsFmaDiscreteWord.bitValueOr(18, false)) {
    return A1A2Messages.TOGA_LK;
  } else if (autoBrakeActive && autoBrakeMode == 1) {
    return A1A2Messages.BTV;
  } else if (autoBrakeActive && autoBrakeMode == 2) {
    return A1A2Messages.BRK_LO;
  } else if (autoBrakeActive && autoBrakeMode == 3) {
    return A1A2Messages.BRK_2;
  } else if (autoBrakeActive && autoBrakeMode == 4) {
    return A1A2Messages.BRK_3;
  } else if (autoBrakeActive && autoBrakeMode == 5) {
    return A1A2Messages.BRK_HI;
  } else if (autoBrakeActive && autoBrakeMode == 6) {
    return A1A2Messages.BRK_RTO;
  } else {
    return A1A2Messages.NONE;
  }
}

export enum A3Messages {
  NONE = 0,
  THR_LK,
  LVR_TOGA,
  LVR_CLB,
  LVR_MCT,
  LVR_ASYM,
  BRK_RTO,
}

export function computeA3Message(
  atsFmaDiscreteWord: Arinc429WordData,
  thrLocked: boolean,
  autoBrakeActive: boolean,
  autoBrakeMode: number,
): A3Messages {
  const clbDemand = atsFmaDiscreteWord.bitValueOr(26, false);
  const mctDemand = atsFmaDiscreteWord.bitValueOr(27, false);
  const assymThrust = atsFmaDiscreteWord.bitValueOr(25, false);

  if (thrLocked) {
    return A3Messages.THR_LK;
  } else if (false) {
    return A3Messages.LVR_TOGA;
  } else if (clbDemand) {
    return A3Messages.LVR_CLB;
  } else if (mctDemand) {
    return A3Messages.LVR_MCT;
  } else if (assymThrust) {
    return A3Messages.LVR_ASYM;
  } else if (!autoBrakeActive && autoBrakeMode === 6) {
    return A3Messages.BRK_RTO;
  } else {
    return A3Messages.NONE;
  }
}

export enum BC3Messages {
  NONE = 0,
  USE_MAN_PITCH_TRIM,
  FOR_GA_SET_TOGA,
  DISCONNECT_AP_FOR_LDG,
  TCAS_ARMED,
  TCAS_RA_INHIBITED,
  TRK_FPA_DESELECTED,
  MOVE_THR_LEVERS,
  TD_REACHED,
  EXTEND_SPD_BRK,
  RETRACT_SPD_BRK,
  CHECK_APPR_SEL,
  SET_HOLD_SPD,
  EXIT_MISSED,
  FCU_ALT_BELOW_AC,
  FCU_ALT_ABOVE_AC,
}

export function computeBC3Message(
  isAttExcessive: boolean,
  tcasArmed: boolean,
  setHoldSpeed: boolean,
  fcdcWord1: Arinc429WordData,
  fwcFlightPhase: number,
  trkFpaDeselectedTCAS: boolean,
  tcasRaInhibited: boolean,
  tdReached: boolean,
  disconnectApForLdg: boolean,
  exitMissed: boolean,
): BC3Messages {
  const flightPhaseForWarning =
    fwcFlightPhase >= 2 && fwcFlightPhase <= 11 && !(fwcFlightPhase >= 4 && fwcFlightPhase <= 7);

  // All currently unused message are set to false
  if (fcdcWord1.bitValue(15) && !fcdcWord1.isFailureWarning() && flightPhaseForWarning) {
    return BC3Messages.USE_MAN_PITCH_TRIM;
  } else if (false) {
    return BC3Messages.FOR_GA_SET_TOGA;
  } else if (disconnectApForLdg) {
    return BC3Messages.DISCONNECT_AP_FOR_LDG;
  } else if (tcasArmed && !isAttExcessive) {
    return BC3Messages.TCAS_ARMED;
  } else if (tcasRaInhibited && !isAttExcessive) {
    return BC3Messages.TCAS_RA_INHIBITED;
  } else if (trkFpaDeselectedTCAS && !isAttExcessive) {
    return BC3Messages.TRK_FPA_DESELECTED;
  } else if (false) {
    return BC3Messages.MOVE_THR_LEVERS;
  } else if (tdReached) {
    return BC3Messages.TD_REACHED;
  } else if (false) {
    return BC3Messages.EXTEND_SPD_BRK;
  } else if (false) {
    return BC3Messages.RETRACT_SPD_BRK;
  } else if (false) {
    return BC3Messages.CHECK_APPR_SEL;
  } else if (setHoldSpeed) {
    return BC3Messages.SET_HOLD_SPD;
  } else if (exitMissed) {
    return BC3Messages.EXIT_MISSED;
  } else if (false) {
    return BC3Messages.FCU_ALT_BELOW_AC;
  } else if (false) {
    return BC3Messages.FCU_ALT_ABOVE_AC;
  } else {
    return BC3Messages.NONE;
  }
}
