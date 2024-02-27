export enum LateralMode {
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

export enum ArmedLateralMode {
  NAV = 0,
  LOC = 1,
}

export enum ArmedVerticalMode {
  ALT = 0,
  ALT_CST = 1,
  CLB = 2,
  DES = 3,
  GS = 4,
  FINAL = 5,
  TCAS = 6,
}

export interface GenericFlightGuidanceEvents {
  'fg.fma.lateralMode': LateralMode;
  'fg.fma.lateralArmedBitmask': number;
}

export function isArmed(bitmask: number, armedBit: ArmedVerticalMode | ArmedLateralMode): boolean {
  return ((bitmask >> armedBit) & 1) === 1;
}
