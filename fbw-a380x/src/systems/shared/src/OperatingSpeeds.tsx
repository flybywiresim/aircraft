/**
 * Lowest selectable Speed Table
 * calls function(gross weight (1000 lb)) which returns CAS, automatically compensates for cg.
 * Indexes: 0 - Clean config, 1 - Config 1 + F, 2 - Config 2, 3 - Config 3, 4 - Config Full, 5 - Config 1.
 * Sub-Indexes: 0 to 9 represent gross weight (1000 lb) in 100k lb steps from 600 to 1200.
 */
// TODO: Weight interpolation is different for the two CG extremes, one formula might be too inaccurate.

import { Feet, Knots } from 'msfs-geo';
import { MathUtils } from '@flybywiresim/fbw-sdk';
import { Mmo, VfeF1, VfeF1F, VfeF2, VfeF3, VfeFF, Vmcl, Vmo } from '@shared/PerformanceConstants';
import { FmgcFlightPhase } from '@shared/flightphase';
import { LerpLookupTable } from '@microsoft/msfs-sdk';

export enum ApproachConf {
  CONF_1 = 1,
  CONF_1F,
  CONF_2,
  CONF_3,
  CONF_FULL,
}

export class SpeedsLookupTables {
  /** VLS approach in knots, key is (cg in %MAC, weight in kg) */
  private static readonly VLS_APPR_CONF: Record<ApproachConf, LerpLookupTable> = {
    [ApproachConf.CONF_1]: new LerpLookupTable([
      [128, 29, 250_000],
      [140, 29, 300_000],
      [151, 29, 350_000],
      [162, 29, 400_000],
      [172, 29, 450_000],
      [182, 29, 500_000],
      [191, 29, 550_000],
      [200, 29, 600_000],
      [126, 43, 250_000],
      [137, 43, 300_000],
      [148, 43, 350_000],
      [158, 43, 400_000],
      [168, 43, 450_000],
      [177, 43, 500_000],
      [186, 43, 550_000],
      [195, 43, 600_000],
    ]),
    [ApproachConf.CONF_1F]: new LerpLookupTable([
      [123, 29, 250_000],
      [133, 29, 300_000],
      [144, 29, 350_000],
      [154, 29, 400_000],
      [163, 29, 450_000],
      [172, 29, 500_000],
      [180, 29, 550_000],
      [188, 29, 600_000],
      [123, 43, 250_000],
      [130, 43, 300_000],
      [140, 43, 350_000],
      [150, 43, 400_000],
      [159, 43, 450_000],
      [167, 43, 500_000],
      [176, 43, 550_000],
      [183, 43, 600_000],
    ]),
    [ApproachConf.CONF_2]: new LerpLookupTable([
      [123, 29, 250_000],
      [128, 29, 300_000],
      [138, 29, 350_000],
      [148, 29, 400_000],
      [157, 29, 450_000],
      [165, 29, 500_000],
      [173, 29, 550_000],
      [181, 29, 600_000],
      [123, 43, 250_000],
      [125, 43, 300_000],
      [135, 43, 350_000],
      [144, 43, 400_000],
      [153, 43, 450_000],
      [161, 43, 500_000],
      [169, 43, 550_000],
      [176, 43, 600_000],
    ]),
    [ApproachConf.CONF_3]: new LerpLookupTable([
      [123, 29, 250_000],
      [124, 29, 300_000],
      [134, 29, 350_000],
      [144, 29, 400_000],
      [152, 29, 450_000],
      [161, 29, 500_000],
      [169, 29, 550_000],
      [176, 29, 600_000],
      [123, 43, 250_000],
      [123, 43, 300_000],
      [131, 43, 350_000],
      [140, 43, 400_000],
      [148, 43, 450_000],
      [156, 43, 500_000],
      [164, 43, 550_000],
      [171, 43, 600_000],
    ]),
    [ApproachConf.CONF_FULL]: new LerpLookupTable([
      [123, 29, 250_000],
      [123, 29, 300_000],
      [131, 29, 350_000],
      [140, 29, 400_000],
      [148, 29, 450_000],
      [157, 29, 500_000],
      [165, 29, 550_000],
      [173, 29, 600_000],
      [123, 43, 250_000],
      [123, 43, 300_000],
      [127, 43, 350_000],
      [136, 43, 400_000],
      [144, 43, 450_000],
      [152, 43, 500_000],
      [160, 43, 550_000],
      [168, 43, 600_000],
    ]),
  };

  static getApproachVls(conf: number, cg: number, weight: number): number {
    if (conf === 1) {
      return SpeedsLookupTables.VLS_CONF_0.get(0, weight);
    } else {
      return SpeedsLookupTables.VLS_APPR_CONF[conf].get(cg, weight);
    }
  }

  // cg in %MAC, weight in kg
  static readonly S_SPEED: LerpLookupTable = new LerpLookupTable([
    [146, 250_000],
    [160, 300_000],
    [173, 350_000],
    [185, 400_000],
    [196, 450_000],
    [207, 500_000],
    [215, 550_000],
    [215, 600_000],
  ]);

  // cg in %MAC, weight in kg
  static readonly F2_SPEED: LerpLookupTable = new LerpLookupTable([
    [144, 29, 250_000],
    [150, 29, 300_000],
    [162, 29, 350_000],
    [173, 29, 400_000],
    [184, 29, 450_000],
    [191, 29, 500_000],
    [191, 29, 550_000],
    [191, 29, 600_000],
    [144, 43, 250_000],
    [146, 43, 300_000],
    [158, 43, 350_000],
    [169, 43, 400_000],
    [179, 43, 450_000],
    [189, 43, 500_000],
    [191, 43, 550_000],
    [191, 43, 600_000],
  ]);

  // cg in %MAC, weight in kg
  static readonly F3_SPEED: LerpLookupTable = new LerpLookupTable([
    [133, 29, 250_000],
    [133, 29, 300_000],
    [143, 29, 350_000],
    [153, 29, 400_000],
    [163, 29, 450_000],
    [171, 29, 500_000],
    [177, 29, 550_000],
    [177, 29, 600_000],
    [133, 43, 250_000],
    [133, 43, 300_000],
    [139, 43, 350_000],
    [149, 43, 400_000],
    [158, 43, 450_000],
    [167, 43, 500_000],
    [175, 43, 550_000],
    [177, 43, 600_000],
  ]);

  // altitude in ft, weight in kg
  static readonly GREEN_DOT: LerpLookupTable = new LerpLookupTable([
    [160, 10_000, 250_000],
    [175, 10_000, 300_000],
    [190, 10_000, 350_000],
    [205, 10_000, 400_000],
    [216, 10_000, 450_000],
    [228, 10_000, 500_000],
    [239, 10_000, 550_000],
    [252, 10_000, 600_000],
    [161, 20_000, 250_000],
    [178, 20_000, 300_000],
    [196, 20_000, 350_000],
    [219, 20_000, 400_000],
    [237, 20_000, 450_000],
    [256, 20_000, 500_000],
    [267, 20_000, 550_000],
    [277, 20_000, 600_000],
    [186, 30_000, 250_000],
    [208, 30_000, 300_000],
    [224, 30_000, 350_000],
    [241, 30_000, 400_000],
    [256, 30_000, 450_000],
    [272, 30_000, 500_000],
    [284, 30_000, 550_000],
    [292, 30_000, 600_000],
    [203, 40_000, 250_000],
    [220, 40_000, 300_000],
    [236, 40_000, 350_000],
    [252, 40_000, 400_000],
    [252, 40_000, 450_000],
    [260, 40_000, 500_000],
    [260, 40_000, 550_000],
    [260, 40_000, 600_000],
  ]);

  // altitude in ft, weight in kg
  static readonly VLS_CONF_0: LerpLookupTable = new LerpLookupTable([
    [149, 0, 250_000],
    [163, 0, 300_000],
    [176, 0, 350_000],
    [188, 0, 400_000],
    [199, 0, 450_000],
    [210, 0, 500_000],
    [220, 0, 550_000],
    [231, 0, 600_000],
    [149, 10_000, 250_000],
    [163, 10_000, 300_000],
    [176, 10_000, 350_000],
    [189, 10_000, 400_000],
    [202, 10_000, 450_000],
    [216, 10_000, 500_000],
    [231, 10_000, 550_000],
    [243, 10_000, 600_000],
    [149, 15_000, 250_000],
    [163, 15_000, 300_000],
    [178, 15_000, 350_000],
    [192, 15_000, 400_000],
    [209, 15_000, 450_000],
    [222, 15_000, 500_000],
    [234, 15_000, 550_000],
    [246, 15_000, 600_000],
    [149, 20_000, 250_000],
    [165, 20_000, 300_000],
    [183, 20_000, 350_000],
    [199, 20_000, 400_000],
    [212, 20_000, 450_000],
    [226, 20_000, 500_000],
    [239, 20_000, 550_000],
    [252, 20_000, 600_000],
    [151, 25_000, 250_000],
    [171, 25_000, 300_000],
    [187, 25_000, 350_000],
    [202, 25_000, 400_000],
    [217, 25_000, 450_000],
    [231, 25_000, 500_000],
    [246, 25_000, 550_000],
    [260, 25_000, 600_000],
    [158, 30_000, 250_000],
    [174, 30_000, 300_000],
    [191, 30_000, 350_000],
    [207, 30_000, 400_000],
    [224, 30_000, 450_000],
    [239, 30_000, 500_000],
    [256, 30_000, 550_000],
    [270, 30_000, 600_000],
    [158, 32_000, 250_000],
    [176, 32_000, 300_000],
    [193, 32_000, 350_000],
    [210, 32_000, 400_000],
    [227, 32_000, 450_000],
    [244, 32_000, 500_000],
    [259, 32_000, 550_000],
    [270, 32_000, 600_000],
    [159, 34_000, 250_000],
    [178, 34_000, 300_000],
    [196, 34_000, 350_000],
    [213, 34_000, 400_000],
    [231, 34_000, 450_000],
    [247, 34_000, 500_000],
    [259, 34_000, 550_000],
    [270, 34_000, 600_000],
    [161, 36_000, 250_000],
    [180, 36_000, 300_000],
    [198, 36_000, 350_000],
    [217, 36_000, 400_000],
    [235, 36_000, 450_000],
    [247, 36_000, 500_000],
    [259, 36_000, 550_000],
    [275, 36_000, 600_000],
    [162, 38_000, 250_000],
    [182, 38_000, 300_000],
    [202, 38_000, 350_000],
    [222, 38_000, 400_000],
    [235, 38_000, 450_000],
    [247, 38_000, 500_000],
    [259, 38_000, 550_000],
    [275, 38_000, 600_000],
    [164, 40_000, 250_000],
    [185, 40_000, 300_000],
    [206, 40_000, 350_000],
    [222, 40_000, 400_000],
    [235, 40_000, 450_000],
    [250, 40_000, 500_000],
    [265, 40_000, 550_000],
    [270, 40_000, 600_000],
    [168, 43_000, 250_000],
    [191, 43_000, 300_000],
    [208, 43_000, 350_000],
    [223, 43_000, 400_000],
    [235, 43_000, 450_000],
    [250, 43_000, 500_000],
    [250, 43_000, 550_000],
    [250, 43_000, 600_000],
  ]);
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
   * @param m mass: gross weight in kg
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
    const cg = SimVar.GetSimVarValue('CG PERCENT', 'percent');

    if (fPos === 0) {
      this.vls = SpeedsLookupTables.VLS_CONF_0.get(altitude, m);
    } else if (fPos === 1 && calibratedAirSpeed > 212) {
      this.vls = SpeedsLookupTables.getApproachVls(ApproachConf.CONF_1, cg, m);
    } else {
      this.vls = SpeedsLookupTables.getApproachVls(fPos + 1, cg, m);
    }
    this.vapp = this.vls + addWindComponent(wind);
    this.vref = this.vls = SpeedsLookupTables.getApproachVls(ApproachConf.CONF_FULL, cg, m);

    this.gd = SpeedsLookupTables.GREEN_DOT.get(altitude, m);
    this.vmax = fPos === 0 ? getVmo() : vfeFS[fPos - 1];
    this.vfeN = fPos === 4 ? 0 : vfeFS[getVfeNIdx(fPos)];

    this.vs1g = this.vls / 1.23;
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

    const vs1gConf0 = SpeedsLookupTables.VLS_CONF_0.get(altitude, m) / 1.23;
    const vs1gConf1F = SpeedsLookupTables.getApproachVls(ApproachConf.CONF_1, cg, m) / 1.23;
    this.f2 =
      fmgcFlightPhase <= FmgcFlightPhase.Takeoff
        ? Math.max(1.18 * vs1gConf1F, Vmcl + 5)
        : SpeedsLookupTables.F2_SPEED.get(altitude, m);
    this.f3 =
      fmgcFlightPhase <= FmgcFlightPhase.Takeoff
        ? Math.max(1.18 * vs1gConf1F, Vmcl + 5)
        : SpeedsLookupTables.F3_SPEED.get(altitude, m);
    this.s =
      fmgcFlightPhase <= FmgcFlightPhase.Takeoff ? 1.21 * vs1gConf0 : SpeedsLookupTables.S_SPEED.get(altitude, m);
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
   * @param {number} mass mass of the aircraft in kg
   * @param {number} conf 0 - CONF 1, 1 - CONF 1, 2 - CONF 1+F, 3 - CONF 2, 4 - CONF 3, 5 - CONF FULL.
   * @param {boolean} takeof if VS1g should be calculated for takeoff
   */
  static getVs1g(mass: number, conf: number, takeoff: boolean): Knots {
    // FIXME rough, dirty hack
    if (takeoff === true) {
      return SpeedsLookupTables.getApproachVls(conf, SimVar.GetSimVarValue('CG PERCENT', 'percent'), mass) / 1.15;
    }
    if (conf === 5) {
      return Math.max(
        SpeedsLookupTables.getApproachVls(conf, SimVar.GetSimVarValue('CG PERCENT', 'percent'), mass) / 1.18,
        Vmcl,
      );
    }
    return Math.max(
      SpeedsLookupTables.getApproachVls(conf, SimVar.GetSimVarValue('CG PERCENT', 'percent'), mass) / 1.23,
      Vmcl,
    );
  }
}
