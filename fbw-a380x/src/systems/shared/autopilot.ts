import { ControlLaw } from '@fmgc/guidance/ControlLaws';

enum LateralMode {
  NONE = 0,
  HDG = 10,
  TRACK = 11,
  NAV = 20,
  LOC_CPT = 30,
  LOC_TRACK = 31,
  LAND = 32,
  FLARE = 33,
  ROLL_OUT = 34,
  RWY = 40,
  RWY_TRACK = 41,
  GA_TRACK = 50,
}

enum ArmedLateralMode {
  NAV = 0,
  LOC = 1,
}

enum VerticalMode {
  NONE = 0,
  ALT = 10,
  ALT_CPT = 11,
  OP_CLB = 12,
  OP_DES = 13,
  VS = 14,
  FPA = 15,
  ALT_CST = 20,
  ALT_CST_CPT = 21,
  CLB = 22,
  DES = 23,
  FINAL = 24,
  GS_CPT = 30,
  GS_TRACK = 31,
  LAND = 32,
  FLARE = 33,
  ROLL_OUT = 34,
  SRS = 40,
  SRS_GA = 41,
  TCAS = 50,
}

enum ArmedVerticalMode {
  ALT = 0,
  ALT_CST = 1,
  CLB = 2,
  DES = 3,
  GS = 4,
  FINAL = 5,
  TCAS = 6,
}

function isArmed(bitmask, armedBit: ArmedVerticalMode | ArmedLateralMode): boolean {
  return ((bitmask >> armedBit) & 1) === 1;
}

enum AutoThrustMode {
  NONE = 0,
  MAN_TOGA = 1,
  MAN_GA_SOFT = 2,
  MAN_FLEX = 3,
  MAN_DTO = 4,
  MAN_MCT = 5,
  MAN_THR = 6,
  SPEED = 7,
  MACH = 8,
  THR_MCT = 9,
  THR_CLB = 10,
  THR_LVR = 11,
  THR_IDLE = 12,
  A_FLOOR = 13,
  TOGA_LK = 14,
}

export { ControlLaw, LateralMode, ArmedLateralMode, VerticalMode, ArmedVerticalMode, isArmed, AutoThrustMode };
