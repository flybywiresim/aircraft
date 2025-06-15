import { Subject } from '@microsoft/msfs-sdk';

export const calculateHorizonOffsetFromPitch = (pitch: number) => {
  const offset = (pitch * 1024) / 28;
  return offset;
};

export const calculateVerticalOffsetFromRoll = (roll: number) => {
  let offset = 0;

  if (Math.abs(roll) > 60) {
    offset = Math.max(0, 41 - 35.87 / Math.sin((Math.abs(roll) / 180) * Math.PI));
  }
  return offset;
};

export class LagFilter {
  private PreviousInput: number;

  private PreviousOutput: number;

  private TimeConstant: number;

  constructor(timeConstant: number) {
    this.PreviousInput = 0;
    this.PreviousOutput = 0;

    this.TimeConstant = timeConstant;
  }

  reset() {
    this.PreviousInput = 0;
    this.PreviousOutput = 0;
  }

  /**
   *
   * @param input Input to filter
   * @param deltaTime in seconds
   * @returns {number} Filtered output
   */
  step(input: number, deltaTime: number): number {
    const filteredInput = !Number.isNaN(input) ? input : 0;

    const scaledDeltaTime = deltaTime * this.TimeConstant;
    const sum0 = scaledDeltaTime + 2;

    const output =
      ((filteredInput + this.PreviousInput) * scaledDeltaTime) / sum0 +
      ((2 - scaledDeltaTime) / sum0) * this.PreviousOutput;

    this.PreviousInput = filteredInput;

    if (Number.isFinite(output)) {
      this.PreviousOutput = output;
      return output;
    }
    return 0;
  }
}

export class RateLimiter {
  private PreviousOutput: number;

  private RisingRate: number;

  private FallingRate: number;

  constructor(risingRate: number, fallingRate: number) {
    this.PreviousOutput = 0;

    this.RisingRate = risingRate;
    this.FallingRate = fallingRate;
  }

  step(input: number, deltaTime: number) {
    const filteredInput = !Number.isNaN(input) ? input : 0;

    const subInput = filteredInput - this.PreviousOutput;

    const scaledUpper = deltaTime * this.RisingRate;
    const scaledLower = deltaTime * this.FallingRate;

    const output = this.PreviousOutput + Math.max(Math.min(scaledUpper, subInput), scaledLower);
    this.PreviousOutput = output;
    return output;
  }
}

/**
 * Gets the smallest angle between two angles
 * @param angle1 First angle in degrees
 * @param angle2 Second angle in degrees
 * @returns {number} Smallest angle between angle1 and angle2 in degrees
 */
export const getSmallestAngle = (angle1: number, angle2: number): number => {
  let smallestAngle = angle1 - angle2;
  if (smallestAngle > 180) {
    smallestAngle -= 360;
  } else if (smallestAngle < -180) {
    smallestAngle += 360;
  }
  return smallestAngle;
};

export const isCaptainSide = (displayIndex: number | undefined) => displayIndex === 1;

export const getSupplier = (displayIndex: number | undefined, knobValue: number) => {
  const adirs3ToCaptain = 0;
  const adirs3ToFO = 2;

  if (isCaptainSide(displayIndex)) {
    return knobValue === adirs3ToCaptain ? 3 : 1;
  }
  return knobValue === adirs3ToFO ? 3 : 2;
};

// L:A32NX_FWC_FLIGHT_PHASE                         L:A32NX_FMGC_FLIGHT_PHASE
// | 0      |                  |                 |       0    |   Preflight
// | 1      | ELEC PWR         | taxi            |       0    |
// | 2      | ENG 1 STARTED    | taxi            |       0    |
// | 3      | 1ST ENG TO PWR   | takeoff         |       1    |   Takeoff
// | 4      | 80 kt            | takeoff         |       1    |
// | 5      | LIFTOFF          | clb             |       1    |
// | 6      | 1500ft (in clb)  |                 |       2    |   TO pwr to clmb  .Climb
// | 7      | 800 ft (in desc) |                 |       3    |   Cruise
// | 8      | TOUCHDOWN        | rollout         |       4    |   Descent
// | 9      | 80 kt            | taxi            |       5    |   Approach  (at IAF reached)
// | 10     | 2nd ENG SHUTDOWN |                 |       6    |   Go Around       taxi
// | &gt; 1 | 5 MIN AFTER      |                 |       7    |   Done  (auto brk off or 30kts)

//           onToPower
//           | onTO  | onGnd |  xwnd | dec0 | dec1 | dec2 |
//           |       |       | 0 | 1 |      |      |      |
//           |-------|-------|---|---|------|------|------|
// onToPower 1 onGnd 1 xwnd on dec != 2
//     xSpd  |   1   |   1   | 0 | 1 |   1  |   0  |   0  |    106
//     xSpd  |   1   |   1   | 0 | 1 |   0  |   1  |   0  |    106
// onToPower 1 onGnd 1 xwnd on dec == 2
//     xSpd  |   1   |   1   | 0 | 1 |   0  |   0  |   1  |    105
//---------------------------------------------------------------
//  onToPower 1 onGnd 1 xwnd off dec != 2
//     spd   |   1   |   1   | 1 | 0 |   1  |   0  |   0  |    116
//     spd   |   1   |   1   | 1 | 0 |   0  |   1  |   0  |    114
//  onToPower 1 onGnd 1 xwnd off dec == 2
//     spd   |   1   |   1   | 1 | 0 |   0  |   0  |   1  |    113
//---------------------------------------------------------------
// onToPower 1 onGnd 0 xwnd on dec != 2
//    xAlt   |   1   |   0   | 0 | 1 |   1  |   0  |   0  |    76
//    xAlt   |   1   |   0   | 0 | 1 |   0  |   1  |   0  |    74
// onToPower 1 onGnd 0 xwnd on dec == 2
//    xAlt   |   1   |   0   | 0 | 1 |   0  |   0  |   1  |    73
//---------------------------------------------------------------
// onToPower 1 onGnd 0 xwnd off dec != 2
//    alt    |   1   |   0   | 1 | 0 |   1  |   0  |   0  |    84
//    alt    |   1   |   0   | 1 | 0 |   0  |   1  |   0  |    82
// onToPower 1 onGnd 0 xwnd off dec == 2
//    alt    |   1   |   0   | 1 | 0 |   0  |   0  |   1  |    81
//---------------------------------------------------------------
//---------------------------------------------------------------
// onToPower 0 onGnd 1 xwnd on dec != 2
//     xSpd  |   0   |   1   | 0 | 1 |   1  |   0  |   0  |    44
//     xSpd  |   0   |   1   | 0 | 1 |   0  |   1  |   0  |    42
// onToPower 0 onGnd 1 xwnd on dec == 2
//     xSpd  |   0   |   1   | 0 | 1 |   0  |   0  |   1  |    41
//---------------------------------------------------------------
// onToPower 0  onGnd 1 xwnd off dec != 2
//     spd   |   0   |   1   | 1 | 0 |   1  |   0  |   0  |    52
//     spd   |   0   |   1   | 1 | 0 |   0  |   1  |   0  |    50
// onToPower 0  onGnd 1 xwnd off dec == 2
//     spd   |   0   |   1   | 1 | 0 |   0  |   0  |   1  |    49
//---------------------------------------------------------------
// onToPower 0 onGnd 0 xwnd on dec != 2
//    xAlt   |   0   |   0   | 0 | 1 |   1  |   0  |   0  |    12
//    xAlt   |   0   |   0   | 0 | 1 |   0  |   1  |   0  |    10
// onToPower 0 onGnd 0 xwnd on dec == 2
//    xAlt   |   0   |   0   | 0 | 1 |   0  |   0  |   1  |    9
//---------------------------------------------------------------
// onToPower 0 onGnd 0 xwnd off dec != 2
//    alt    |   0   |   0   | 1 | 0 |   1  |   0  |   0  |    20
//    alt    |   0   |   0   | 1 | 0 |   0  |   1  |   0  |    18
// onToPower 0 onGnd 0 xwnd off dec == 2
//    alt    |   0   |   0   | 1 | 0 |   0  |   0  |   1  |    17

export enum WindMode {
  Normal,
  CrossWind,
}

export interface HudElemsValuesStr {
  spdTapeOrForcedOnLand: string;
  xWindSpdTape: string;
  altTape: string;
  xWindAltTape: string;
  altTapeMaskFill: string;
  windIndicator: string;
  FMA: string;
  VSI: string;
  QFE: string;
  pitchScale: string;
}

export interface HudElemsValues {
  spdTapeOrForcedOnLand: Subject<String>;
  xWindSpdTape: Subject<String>;
  altTape: Subject<String>;
  xWindAltTape: Subject<String>;
  altTapeMaskFill: Subject<String>;
  windIndicator: Subject<String>;
  FMA: Subject<String>;
  VSI: Subject<String>;
  QFE: Subject<String>;
  pitchScale: Subject<String>;
}

export function getBitMask(
  onToPower: boolean,
  onGround: boolean,
  xwndMode: boolean,
  declutterMode: number,
): HudElemsValuesStr {
  const nArr = [];

  const elemVis: HudElemsValuesStr = {
    xWindAltTape: '',
    altTape: '',
    xWindSpdTape: '',
    spdTapeOrForcedOnLand: '',
    altTapeMaskFill: '',
    windIndicator: '',
    FMA: '',
    VSI: '',
    QFE: '',
    pitchScale: '',
  };

  //pitchScale:
  //  0 = off
  //  1 = on
  //  2 = decmode2 on approach(only -5deg line)

  let bitMask = -1;
  onToPower ? (nArr[0] = 1) : (nArr[0] = 0);
  onGround ? (nArr[1] = 1) : (nArr[1] = 0);
  xwndMode ? (nArr[2] = 0) : (nArr[2] = 1);
  xwndMode ? (nArr[3] = 1) : (nArr[3] = 0);
  declutterMode == 0 ? (nArr[4] = 1) : (nArr[4] = 0);
  declutterMode == 1 ? (nArr[5] = 1) : (nArr[5] = 0);
  declutterMode == 2 ? (nArr[6] = 1) : (nArr[6] = 0);
  bitMask = nArr[0] * 64 + nArr[1] * 32 + nArr[2] * 16 + nArr[3] * 8 + nArr[4] * 4 + nArr[5] * 2 + nArr[6] * 1;

  //onToPower 1 onGnd 1 xwnd on  dec != 2
  if (bitMask == 106 || bitMask == 108) {
    //crosswindMode: WindMode.CrossWind,
    elemVis.xWindAltTape = 'none';
    elemVis.altTape = 'block';
    elemVis.xWindSpdTape = 'none';
    elemVis.spdTapeOrForcedOnLand = 'block';
    elemVis.altTapeMaskFill = 'block';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'block';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }
  //onToPower 1 onGnd 1 xwnd on  dec == 2
  if (bitMask == 105) {
    //crosswindMode: WindMode.CrossWind;
    elemVis.xWindAltTape = 'none';
    elemVis.altTape = 'block';
    elemVis.xWindSpdTape = 'none';
    elemVis.spdTapeOrForcedOnLand = 'block';
    elemVis.altTapeMaskFill = 'block';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'block';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }

  //----------
  //onToPower 1 onGnd 1 xwnd off  dec != 2
  if (bitMask == 114 || bitMask == 116) {
    //crosswindMode: WindMode.Normal;
    elemVis.xWindAltTape = 'none';
    elemVis.altTape = 'block';
    elemVis.xWindSpdTape = 'none';
    elemVis.spdTapeOrForcedOnLand = 'block';
    elemVis.altTapeMaskFill = 'block';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'block';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }
  //onToPower 1 onGnd 1 xwnd off  dec == 2
  if (bitMask == 113) {
    //crosswindMode: WindMode.Normal;
    elemVis.xWindAltTape = 'none';
    elemVis.altTape = 'block';
    elemVis.xWindSpdTape = 'none';
    elemVis.spdTapeOrForcedOnLand = 'block';
    elemVis.altTapeMaskFill = 'block';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'block';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }

  //----------
  //onToPower 1 onGnd 0 xwnd on  dec != 2
  if (bitMask == 74 || bitMask == 76) {
    //crosswindMode: WindMode.CrossWind;
    elemVis.xWindAltTape = 'block';
    elemVis.altTape = 'none';
    elemVis.xWindSpdTape = 'block';
    elemVis.spdTapeOrForcedOnLand = 'none';
    elemVis.altTapeMaskFill = 'none';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'block';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }
  //onToPower 1 onGnd 0 xwnd on  dec == 2
  if (bitMask == 73) {
    //crosswindMode: WindMode.CrossWind;
    elemVis.xWindAltTape = 'block';
    elemVis.altTape = 'none';
    elemVis.xWindSpdTape = 'block';
    elemVis.spdTapeOrForcedOnLand = 'none';
    elemVis.altTapeMaskFill = 'none';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'block';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }

  //----------
  //onToPower 1 onGnd 0 xwnd off dec !=2
  if (bitMask == 82 || bitMask == 84) {
    //crosswindMode: WindMode.Normal;
    elemVis.xWindAltTape = 'none';
    elemVis.altTape = 'block';
    elemVis.xWindSpdTape = 'none';
    elemVis.spdTapeOrForcedOnLand = 'block';
    elemVis.altTapeMaskFill = 'block';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'block';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }
  //onToPower 1 onGnd 0 xwnd off dec ==2
  if (bitMask == 81) {
    //crosswindMode: WindMode.Normal;
    elemVis.xWindAltTape = 'none';
    elemVis.altTape = 'block';
    elemVis.xWindSpdTape = 'none';
    elemVis.spdTapeOrForcedOnLand = 'block';
    elemVis.altTapeMaskFill = 'block';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'block';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }
  //-----------------------------------------------------

  //onToPower 0 onGnd 1 xwnd on  dec != 2
  if (bitMask == 42 || bitMask == 44) {
    //crosswindMode: WindMode.CrossWind;
    elemVis.xWindAltTape = 'block';
    elemVis.altTape = 'none';
    elemVis.xWindSpdTape = 'block';
    elemVis.spdTapeOrForcedOnLand = 'none';
    elemVis.altTapeMaskFill = 'none';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'none';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }
  //onToPower 0 onGnd 1 xwnd on  dec == 2
  if (bitMask == 41) {
    //crosswindMode: WindMode.CrossWind;
    elemVis.xWindAltTape = 'none';
    elemVis.altTape = 'none';
    elemVis.xWindSpdTape = 'none';
    elemVis.spdTapeOrForcedOnLand = 'none';
    elemVis.altTapeMaskFill = 'none';
    elemVis.windIndicator = 'none';
    elemVis.FMA = 'none';
    elemVis.VSI = 'none';
    elemVis.QFE = 'none';
    elemVis.pitchScale = 'none';
  }
  //----------
  //onToPower 0 onGnd 1 xwnd off  dec != 2
  if (bitMask == 50 || bitMask == 52) {
    //crosswindMode: WindMode.Normal;
    elemVis.xWindAltTape = 'none';
    elemVis.altTape = 'block';
    elemVis.xWindSpdTape = 'none';
    elemVis.spdTapeOrForcedOnLand = 'block';
    elemVis.altTapeMaskFill = 'none';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'none';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }
  //onToPower 0 onGnd 1 xwnd off  dec == 2
  if (bitMask == 49) {
    //crosswindMode: WindMode.Normal;
    elemVis.xWindAltTape = 'none';
    elemVis.altTape = 'none';
    elemVis.xWindSpdTape = 'none';
    elemVis.spdTapeOrForcedOnLand = 'none';
    elemVis.altTapeMaskFill = 'none';
    elemVis.windIndicator = 'none';
    elemVis.FMA = 'none';
    elemVis.VSI = 'none';
    elemVis.QFE = 'none';
    elemVis.pitchScale = 'none';
  }

  //----------
  //onToPower 0 onGnd 0 xwnd on  dec != 2
  if (bitMask == 10 || bitMask == 12) {
    //crosswindMode: WindMode.CrossWind;
    elemVis.xWindAltTape = 'block';
    elemVis.altTape = 'none';
    elemVis.xWindSpdTape = 'block';
    elemVis.spdTapeOrForcedOnLand = 'none';
    elemVis.altTapeMaskFill = 'none';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'block';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }
  //onToPower 0 onGnd 0 xwnd on  dec == 2
  if (bitMask == 9) {
    //crosswindMode: WindMode.CrossWind;
    elemVis.xWindAltTape = 'block';
    elemVis.altTape = 'none';
    elemVis.xWindSpdTape = 'block';
    elemVis.spdTapeOrForcedOnLand = 'none';
    elemVis.altTapeMaskFill = 'none';
    elemVis.windIndicator = 'none';
    elemVis.FMA = 'none';
    elemVis.VSI = 'none';
    elemVis.QFE = 'none';
    elemVis.pitchScale = 'block';
  }
  //----------
  //onToPower 0 onGnd 0 xwnd off dec !=2
  if (bitMask == 18 || bitMask == 20) {
    //crosswindMode: WindMode.Normal;
    elemVis.xWindAltTape = 'none';
    elemVis.altTape = 'block';
    elemVis.xWindSpdTape = 'none';
    elemVis.spdTapeOrForcedOnLand = 'block';
    elemVis.altTapeMaskFill = 'block';
    elemVis.windIndicator = 'block';
    elemVis.FMA = 'block';
    elemVis.VSI = 'block';
    elemVis.QFE = 'block';
    elemVis.pitchScale = 'block';
  }
  //onToPower 0 onGnd 0 xwnd off dec ==2
  if (bitMask == 17) {
    //crosswindMode: WindMode.Normal;
    elemVis.xWindAltTape = 'block';
    elemVis.altTape = 'none';
    elemVis.xWindSpdTape = 'block';
    elemVis.spdTapeOrForcedOnLand = 'none';
    elemVis.altTapeMaskFill = 'none';
    elemVis.windIndicator = 'none';
    elemVis.FMA = 'none';
    elemVis.VSI = 'none';
    elemVis.QFE = 'none';
    elemVis.pitchScale = 'block';
  }

  // console.log(
  //  "\n bitMask: " + bitMask +
  //   "\n onToPower: " + onToPower +
  //   "\n onGround: " + onGround +
  //   "\n declutterMode: " + declutterMode
  // //     // "\n xwndMode: " + xwndMode
  // // //         //"\n crosswindMode: " + elemsVis.crosswindMode +
  // // //     "\n xWindAltTape: " + elemVis.xWindAltTape +
  // // //     "\n altTape: " + elemVis.altTape+
  // // //     "\n xWindSpdTape: " + elemVis.xWindSpdTape+
  // // //     "\n spdTapeOrForcedOnLand: " + elemVis.spdTapeOrForcedOnLand +
  // // //     "\n altTapeMaskFill: " + elemVis.altTapeMaskFill +
  // // //     "\n windIndicator: " + elemVis.windIndicator
  // )

  return elemVis;
}
