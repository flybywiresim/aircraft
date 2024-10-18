/**
 * Lowest selectable Speed Table
 * calls function(gross weight (1000 lb)) which returns CAS, automatically compensates for cg.
 * Indexes: 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
 * Sub-Indexes: 0 to 9 represent gross weight (1000 lb) in 100k lb steps from 600 to 1200.
 */
// TODO: Weight interpolation is different for the two CG extremes, one formula might be too inaccurate.

import { Feet, Knots } from 'msfs-geo';
import { MathUtils, Units } from '@flybywiresim/fbw-sdk';
import { Mmo, VfeF1, VfeF1F, VfeF2, VfeF3, VfeFF, Vmcl, Vmo } from '@shared/PerformanceConstants';
import { Common } from '@fmgc/guidance/vnav/common';
import { FmgcFlightPhase } from '@shared/flightphase';

// Maybe we need bilinear interpolation
const vls = [
  [
    (m: number) => vlsConf0(m),
    (m: number) => vlsConf0(m),
    (m: number) => vlsConf0(m),
    (m: number) => vlsConf0(m),
    (m: number) => vlsConf0(m),
    (m: number) => vlsConf0(m),
    (m: number) => vlsConf0(m),
    (m: number) => vlsConf0(m),
  ], // Clean Config
  [
    () => interpolateForCgAndWeight(null, (cgS) => cgS, 127, 123),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.1 * (m - 600), 127, 123),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 700), 137, 133),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 800), 146, 143),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 900), 155, 151),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 1000), 164, 159),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.07 * (m - 1100), 172, 167),
    () => interpolateForCgAndWeight(null, (cgS) => cgS, 179, 175),
  ], // Config 1 + F
  [
    () => interpolateForCgAndWeight(null, (cgS) => cgS, 122, 120),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.1 * (m - 600), 122, 120),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 700), 132, 128),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 800), 141, 137),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 900), 149, 146),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.07 * (m - 1000), 158, 153),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 1100), 165, 161),
    () => interpolateForCgAndWeight(null, (cgS) => cgS, 173, 168),
  ], // Config 2
  [
    () => interpolateForCgAndWeight(null, (cgS) => cgS, 120, 120),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 600), 120, 120),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 700), 128, 124),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 800), 137, 133),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 900), 145, 141),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.07 * (m - 1000), 153, 149),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 1100), 160, 156),
    () => interpolateForCgAndWeight(null, (cgS) => cgS, 168, 163),
  ], // Config 3
  [
    () => interpolateForCgAndWeight(null, (cgS) => cgS, 120, 120),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.05 * (m - 600), 120, 120),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 700), 125, 121),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 800), 133, 130),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 900), 141, 138),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 1000), 149, 145),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.07 * (m - 1100), 157, 152),
    () => interpolateForCgAndWeight(null, (cgS) => cgS, 164, 159),
  ], // Config Full
  [
    () => interpolateForCgAndWeight(null, (cgS) => cgS, 133, 130),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.11 * (m - 600), 133, 130),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.1 * (m - 700), 144, 141),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 800), 154, 150),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.1 * (m - 900), 163, 159),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 1000), 173, 168),
    (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 1100), 181, 177),
    () => interpolateForCgAndWeight(null, (cgS) => cgS, 190, 185),
  ], // Config 1
];

/**
 * F2-Speed Table
 * calls function(gross weight (1000 lb)) which returns CAS, automatically compensates for cg.
 * Indexes: 0 to 9 represent gross weight (1000 lb) in 100k lb steps from 600 to 1200.
 */
const f2 = [
  () => interpolateForCgAndWeight(null, (cgS) => cgS, 143, 140),
  (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 600), 143, 140),
  (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 700), 154, 151),
  (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.1 * (m - 800), 165, 161),
  (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 900), 175, 171),
  (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 1000), 184, 181),
  (m: number) => interpolateForCgAndWeight(m, (cgS) => cgS, 191, 189),
  () => interpolateForCgAndWeight(null, (cgS) => cgS, 191, 191),
];

/**
 * F3-Speed Table
 * calls function(gross weight (1000 lb)) which returns CAS, automatically compensates for cg.
 * Indexes: 0 to 9 represent gross weight (1000 lb) in 100k lb steps from 600 to 1200.
 */
const f3 = [
  () => interpolateForCgAndWeight(null, (cgS) => cgS, 130, 130),
  (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.07 * (m - 600), 130, 130),
  (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 700), 137, 134),
  (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.09 * (m - 800), 146, 143),
  (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 900), 155, 151),
  (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.08 * (m - 1000), 163, 160),
  (m: number) => interpolateForCgAndWeight(m, (cgS, m) => cgS + 0.06 * (m - 1100), 171, 167),
  () => interpolateForCgAndWeight(null, (cgS) => cgS, 177, 175),
];

/**
 * S-Speed Table
 * calls function(gross weight (1000 lb)) which returns CAS.
 * Indexes: 0 to 9 represent gross weight (1000 lb) in 100k lb steps from 600 to 1200.
 */
const s = [
  () => 153,
  (m: number) => 153 + 0.12 * (m - 600),
  (m: number) => 165 + 0.11 * (m - 700),
  (m: number) => 176 + 0.11 * (m - 800),
  (m: number) => 187 + 0.1 * (m - 900),
  (m: number) => 197 + 0.1 * (m - 1000),
  (m: number) => 207 + 0.08 * (m - 1100),
  () => 215,
];

/**
 * Calculate green dot speed depending on altitude and weight
 * @param m mass: gross weight in klb
 * @param alt altitude: in feet
 * @returns green dot speed in knots
 */
function greenDotSpeed(m: number, alt: number = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet')): number {
  const greenDotTable = [
    [0, 0, 10_000, 20_000, 30_000, 40_000],
    [600, 167, 167, 168, 196, 210],
    [700, 180, 180, 185, 213, 226],
    [800, 194, 194, 202, 228, 240],
    [900, 207, 207, 222, 244, 252],
    [1000, 217, 217, 238, 257, 252],
    [1100, 228, 228, 255, 272, 272],
    [1200, 238, 238, 266, 262, 262],
  ];
  return tableInterpolation(greenDotTable, m, alt);
}

/**
 * Calculate VLS for CONF 0, depending on weight and altitude
 * @param m mass: gross weight in 1000 lb
 * @param alt altitude: in feet
 * @returns green dot speed
 */
function vlsConf0(m: number, alt: Feet = SimVar.GetSimVarValue('PLANE ALTITUDE', 'feet')): Knots {
  const vlsTable = [
    [0, 0, 10_000, 15_000, 20_000, 25_000, 30_000, 32_000, 34_000, 36_000, 38_000, 40_000, 43_000],
    [600, 155, 155, 155, 156, 160, 165, 166, 168, 169, 171, 174, 178],
    [700, 168, 168, 168, 171, 178, 180, 182, 184, 186, 189, 192, 198],
    [800, 179, 179, 181, 187, 191, 195, 197, 200, 203, 207, 211, 211],
    [900, 190, 191, 195, 201, 205, 210, 213, 216, 220, 224, 224, 227],
    [1000, 200, 203, 210, 213, 218, 225, 228, 233, 236, 236, 236, 236],
    [1100, 210, 216, 222, 226, 231, 239, 244, 247, 247, 247, 250, 250],
    [1200, 219, 229, 233, 238, 244, 254, 258, 258, 257, 262, 262, 262],
  ];
  return tableInterpolation(vlsTable, m, alt);
}

// FIXME these are from the A320
const vmca = [
  [-2000, 115],
  [0, 114],
  [2000, 114],
  [4000, 113],
  [6000, 112],
  [8000, 109],
  [10000, 106],
  [12000, 103],
  [14100, 99],
  [15100, 97],
];

// FIXME these are from the A320
const vmcg = [
  // 1+F, 2, 3 all the same
  [-2000, 117],
  [0, 116],
  [2000, 116],
  [4000, 115],
  [6000, 114],
  [8000, 112],
  [10000, 109],
  [12000, 106],
  [14100, 102],
  [15100, 101],
];

/**
 * Vfe for Flaps/Slats
 */
const vfeFS = [
  VfeF1F, // Config 1 + F
  VfeF2, // Config 2
  VfeF3, // Config 3
  VfeFF, // Config Full
  VfeF1, // Config 1
];

/**
 * Correct input function for cg and weight
 * @param m gross weight (1000 lb)
 * @param weightFn function to be called with weight variable
 * @param cg29Value speed for 29%, i.e. lower CG limit
 * @param cg43Value speed for 43%, i.e. upper CG limit
 * @param cg center of gravity
 * @returns cg and weight corrected velocity (CAS)
 */
function interpolateForCgAndWeight(
  m: number,
  weightFn: (cgSpeed: number, m?: number) => number,
  cg29Value: number,
  cg43Value: number,
  cg: number = SimVar.GetSimVarValue('CG PERCENT', 'percent'),
) {
  if (cg < 29) {
    return weightFn(cg29Value, m);
  }
  if (cg > 43) {
    return weightFn(cg43Value, m);
  }
  const cgSpeed = cg29Value + ((cg43Value - cg29Value) / 14) * (cg - 29);
  return weightFn(cgSpeed, m);
}

/**
 * Ensure gross weight (mass) is withing valid range
 * @param m mass: gross weight in 1000 lb
 * @returns index for speed tables
 */
function correctMass(m: number): number {
  return Math.ceil(((m > 1200 ? 1200 : m) - 600) / 100);
}

/**
 * Corrects velocity for mach effect by adding 1kt for every 1000ft above FL200
 * @param v velocity in kt (CAS)
 * @param alt altitude in feet (baro)
 * @returns Mach corrected velocity in kt (CAS)
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function compensateForMachEffect(v: Knots, alt: Feet): Knots {
  return Math.ceil(alt > 20000 ? v + (alt - 20000) / 1000 : v);
}

/**
 * Calculates wind component for ground speed mini
 * @param vw velocity wind (headwind)
 * @returns velocity wind [5, 15]
 */
function addWindComponent(vw: Knots): Knots {
  return Math.max(Math.min(15, vw), 5);
}

/**
 * Get difference between angles
 * @param a angle a
 * @param b angle b
 * @returns angle diff
 * @private
 */
function getdiffAngle(a: number, b: number): number {
  return 180 - Math.abs(Math.abs(a - b) - 180);
}

/**
 * Get next flaps index for vfeFS table
 * @returns vfeFS table index
 * @private
 */
function getVfeNIdx(fi: number): number {
  switch (fi) {
    case 0:
      return 4;
    case 5:
      return 1;
    default:
      return fi;
  }
}

/**
 * Convert degrees Celsius into Kelvin
 * @param T degrees Celsius
 * @returns degrees Kelvin
 */
function convertCtoK(T: number): number {
  return T + 273.15;
}

/**
 * Get correct Vmax for Vmo and Mmo in knots
 * @returns Min(Vmo, Mmo)
 * @private
 */
function getVmo() {
  return Math.min(
    Vmo,
    MathUtils.convertMachToKCas(
      Mmo,
      convertCtoK(Simplane.getAmbientTemperature()),
      SimVar.GetSimVarValue('AMBIENT PRESSURE', 'millibar'),
    ),
  );
}

export class A380OperatingSpeeds {
  public vs1g: number;

  public vls: number;

  public vapp: number;

  public vref: number;

  public f2: number;

  public f3: number;

  public s: number;

  public gd: number;

  public vmax: number;

  public vfeN: number;

  /**
   * Computes Vs, Vls, Vapp, F, S and GD
   * @param m mass: gross weight in t
   * @param calibratedAirSpeed CAS in kt
   * @param fPos flaps position
   * @param fmgcFlightPhase sic
   * @param v2Speed V2 speed entered in FMS
   * @param aoa Angle of attack in degrees. Should be low pass filtered
   * @param wind wind speed
   */
  constructor(
    m: number,
    calibratedAirSpeed: number,
    fPos: number,
    fmgcFlightPhase: FmgcFlightPhase,
    v2Speed: number,
    altitude: Feet,
    wind: Knots = 0,
  ) {
    // Convert mass from tons to klb (1000*lb)
    const klb = Math.min(1200, Math.max(Units.kilogramToPound(m * 1_000) / 1_000, 600));

    const cm = correctMass(klb);
    this.vls = vls[fPos][cm](klb);
    this.vapp = this.vls + addWindComponent(wind);
    this.vref = vls[4][cm](klb);

    this.gd = greenDotSpeed(klb, altitude);
    this.vmax = fPos === 0 ? getVmo() : vfeFS[fPos - 1];
    this.vfeN = fPos === 4 ? 0 : vfeFS[getVfeNIdx(fPos)];

    this.vs1g = vls[fPos][cm](klb) / 1.23;
    this.vls = Math.max(1.23 * this.vs1g, Vmcl);
    if (fmgcFlightPhase <= FmgcFlightPhase.Takeoff) {
      this.vls = Math.max(1.15 * this.vs1g, 1.05 * Math.min(v2Speed, Vmcl));
    } else if (fPos === 1 && calibratedAirSpeed > 212) {
      this.vls = Math.max(1.18 * this.vs1g, Vmcl);
    }

    // Speed brake effect
    const spoilers = SimVar.GetSimVarValue('L:A32NX_LEFT_SPOILER_1_COMMANDED_POSITION', 'number');
    const maxSpoilerExtension = [20, 20, 12, 9, 8, 6];
    const spoilerVlsIncrease = [25, 25, 7, 10, 10, 8];
    if (spoilers > 0) {
      let conf = fPos + 1;
      switch (fPos) {
        case 1:
          conf = calibratedAirSpeed > 212 ? 1 : 2;
          break;
        case 0:
          conf = 0;
          break;
        default:
          break;
      }
      this.vls = this.vls + spoilerVlsIncrease[conf] * (spoilers / maxSpoilerExtension[conf]);
    }

    const vs1gConf0 = vls[0][cm](klb) / 1.23;
    const vs1gConf1F = vls[1][cm](klb) / 1.23;
    this.f2 = fmgcFlightPhase <= FmgcFlightPhase.Takeoff ? Math.max(1.18 * vs1gConf1F, Vmcl + 5) : f2[cm](klb);
    this.f3 = fmgcFlightPhase <= FmgcFlightPhase.Takeoff ? Math.max(1.18 * vs1gConf1F, Vmcl + 5) : f3[cm](klb);
    this.s = fmgcFlightPhase <= FmgcFlightPhase.Takeoff ? 1.21 * vs1gConf0 : s[cm](klb);
  }
}

export class A380SpeedsUtils {
  /**
   * Calculates wind component for ground speed mini
   * @param vw velocity wind (1/3 steady headwind)
   * @returns velocity wind [5, 15]
   */
  static addWindComponent(vw: Knots = (SimVar.GetSimVarValue('AIRCRAFT WIND Z', 'knots') * -1) / 3): number {
    return addWindComponent(vw);
  }

  /**
   * Calculates headwind component
   * @param v velocity wind
   * @param a angle: a
   * @param b angle: b
   * @returns velocity headwind
   */
  static getHeadwind(v: Knots, a: number, b: number): Knots {
    return v * Math.cos(getdiffAngle(a, b) * (Math.PI / 180));
  }

  /**
   * 1/3 * (current headwind - tower headwind)
   * @param vTwr velocity tower headwind
   * @param vCur velocity current headwind
   * @returns head wind diff
   */
  static getHeadWindDiff(vTwr: Knots, vCur: Knots = SimVar.GetSimVarValue('AIRCRAFT WIND Z', 'knots') * -1): Knots {
    return Math.round((1 / 3) * (vCur - vTwr));
  }

  /**
   * Returns Vtarget limited by Vapp and VFE next
   * @param vapp Vapp
   * @param windDiff ground speed mini
   * @returns
   */
  static getVtargetGSMini(vapp: Knots, windDiff: Knots): Knots {
    return Math.max(
      vapp,
      Math.min(
        Math.round(vapp + windDiff),
        Math.round(
          SimVar.GetSimVarValue('L:A32NX_FLAPS_HANDLE_INDEX', 'Number') === 4
            ? SimVar.GetSimVarValue('L:A32NX_SPEEDS_VMAX', 'Number') - 5
            : SimVar.GetSimVarValue('L:A32NX_SPEEDS_VFEN', 'Number'),
        ),
      ),
    );
  }

  private static interpolateTable(table: number[][], alt: Feet): number {
    if (alt <= table[0][0]) {
      return vmca[0][1];
    }
    if (alt >= table[table.length - 1][0]) {
      return table[table.length - 1][1];
    }
    for (let i = 0; i < table.length - 1; i++) {
      if (alt >= table[i][0] && alt <= table[i + 1][0]) {
        const d = (alt - table[i][0]) / (table[i + 1][0] - table[i][0]);
        return Avionics.Utils.lerpAngle(table[i][1], table[i + 1][1], d);
      }
    }
    return vmca[0][1];
  }

  /**
   * Get VMCA (minimum airborne control speed) for a given altitude
   * @param altitude Altitude in feet
   * @returns VMCA in knots
   */
  static getVmca(altitude: Feet): Knots {
    return this.interpolateTable(vmca, altitude);
  }

  /**
   * Get VMCG (minimum ground control speed) for a given altitude
   * @param altitude Altitude in feet
   * @returns VMCG in knots
   */
  static getVmcg(altitude: Feet): Knots {
    return this.interpolateTable(vmcg, altitude);
  }

  /**
   * Get Vs1g for the given config
   *
   * @param {number} mass mass of the aircraft in tons
   * @param {number} conf 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
   * @param {boolean} gearDown true if the gear is down
   */
  static getVs1g(mass: number, conf: number, takeoff: boolean): Knots {
    const klb = Units.kilogramToPound(mass) / 1000.0;
    const weightTableIndex = Math.max(0, Math.min(7, correctMass(klb)));
    // FIXME rough, dirty hack
    if (takeoff === true) {
      return vls[conf][weightTableIndex](klb) / 1.15;
    }
    if (conf === 5) {
      return Math.max(vls[conf][weightTableIndex](klb) / 1.18, Vmcl);
    }
    return Math.max(vls[conf][weightTableIndex](klb) / 1.23, Vmcl);
  }
}

/**
 * Placeholder
 * @param table
 * @param i
 * @param j
 * @returns
 */
function tableInterpolation(table: number[][], i: number, j: number): number {
  const numRows = table.length;
  const numCols = table[0].length;
  // Iterate through rows to find the upper bound to i
  let r: number;
  for (r = 1; r < numRows; r++) {
    if (table[r][0] > i) {
      break;
    }
  }
  // Get lower bound to i
  const r1 = Math.max(1, r - 1);
  const r2 = Math.min(numRows - 1, r);
  // Iterate through rows to find the upper bound to j
  let c: number;
  for (c = 1; c < numCols; c++) {
    if (table[0][c] > j) {
      break;
    }
  }
  // Get the lower bound to j
  const c1 = Math.max(1, c - 1);
  const c2 = Math.min(numCols - 1, c);

  const interpolatedRowAtC1 =
    r1 === r2 ? table[r1][c1] : Common.interpolate(i, table[r1][0], table[r2][0], table[r1][c1], table[r2][c1]);
  const interpolatedRowAtC2 =
    r1 === r2 ? table[r1][c2] : Common.interpolate(i, table[r1][0], table[r2][0], table[r1][c2], table[r2][c2]);

  if (c1 === c2) {
    return interpolatedRowAtC1;
  }

  return Common.interpolate(j, table[0][c1], table[0][c2], interpolatedRowAtC1, interpolatedRowAtC2);
}
