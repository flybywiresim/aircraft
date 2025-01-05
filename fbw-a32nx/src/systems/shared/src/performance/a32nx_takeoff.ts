//  Copyright (c) 2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

/* eslint-disable default-case */
/* eslint-disable max-len */

import {
  LerpLookupTable,
  LerpVectorLookupTable,
  MathUtils,
  ReadonlyFloat64Array,
  Vec2Math,
  Vec3Math,
  VecNMath,
} from '@microsoft/msfs-sdk';

import {
  LineupAngle,
  TakeoffPerformanceCalculator,
  TakeoffPerfomanceError,
  TakeoffPerformanceInputs,
  TakeoffPerformanceParameters,
  TakeoffPerformanceResult,
  TakeoffAntiIceSetting,
  RunwayCondition,
  LimitingFactor,
  LimitWeight,
  TakeoffPerformanceSpeeds,
} from '@flybywiresim/fbw-sdk';

/**
 * Takeoff performance calculator for an A320-251N with forward CG
 */
export class A320251NTakeoffPerformanceCalculator implements TakeoffPerformanceCalculator {
  private static readonly vec2Cache = Vec2Math.create();
  private static readonly vec3Cache = Vec3Math.create();
  private static readonly vec4Cache = VecNMath.create(4);

  private static resultCache: Partial<TakeoffPerformanceResult> = {};

  private static optResultCache: Partial<TakeoffPerformanceResult>[] = [{}, {}, {}];

  /** Max flex temp as a delta from ISA in °C. */
  private static readonly tMaxFlexDisa = 59;

  public readonly structuralMtow = 79_000;

  public readonly maxPressureAlt = 9_200;

  public readonly oew = 42_500;

  public readonly maxHeadwind = 45;

  public readonly maxTailwind = 15;

  /** Lineup distance for each lineup angle, in metres. */
  private static readonly lineUpDistances: Record<LineupAngle, number> = {
    0: 0,
    90: 20.5,
    180: 41,
  };

  /** Tref lookup table, (Tref [°C], elevation [feet]), lookup key = (elevation) */
  private static readonly tRefTable = new LerpLookupTable([
    [48, -2000],
    [44, 0],
    [43, 500],
    [42, 1000],
    [40, 2000],
    [36.4, 3000],
    [35, 3479],
    [16.4, 8348],
    [13.5, 9200],
  ]);

  /** Tmax lookup table, Tmax [°C], pressure alt [feet] => lookup key = (pressure alt) */
  private static readonly tMaxTable = new LerpLookupTable([
    [55, -2000],
    [55, 0],
    [38, 9200],
  ]);

  /** CONF 1+F runway limited weights at sea level/ISA/0 slope/no bleed/fwd cg/no wind/dry, MTOW [kg], runway length [metres] => lookup key = (runway length) */
  private static readonly runwayPerfLimitConf1 = new LerpLookupTable([
    [54_000, 1000],
    [59_300, 1219],
    [68_700, 1604],
    [75_700, 1959],
    [79_000, 2134],
    [80_600, 2239],
    [83_700, 2459],
    [85_000, 2559],
    [86_200, 2709],
    [86_850, 2918],
    [89_000, 3000],
    [90_700, 3180],
    [101_700, 3800],
    [108_000, 5000],
  ]);

  /** CONF 2 runway limited weights at sea level/ISA/0 slope/no bleed/fwd cg/no wind/dry, MTOW [kg], runway length [metres] => lookup key = (runway length) */
  private static readonly runwayPerfLimitConf2 = new LerpLookupTable([
    [54_500, 1000],
    [60_500, 1219],
    [71_000, 1604],
    [78_400, 1959],
    [81_300, 2134],
    [82_900, 2239],
    [85_500, 2459],
    [87_300, 2709],
    [88_000, 2879],
    [88_120, 2987],
    [95_600, 3600],
    [97_200, 3800],
    [97_900, 3900],
    [106_000, 5000],
  ]);

  /** CONF 3 runway limited weights at sea level/ISA/0 slope/no bleed/fwd cg/no wind/dry, MTOW [kg], runway length [metres] => lookup key = (runway length) */
  private static readonly runwayPerfLimitConf3 = new LerpLookupTable([
    [53_100, 1000],
    [60_200, 1219],
    [72_600, 1604],
    [79_900, 1959],
    [83_200, 2134],
    [83_500, 2239],
    [85_100, 2459],
    [87_800, 2709],
    [88_800, 2839],
    [91_700, 3180],
    [97_600, 3800],
    [105_000, 5000],
  ]);

  /** Slope factor for each takeoff config. */
  private static readonly runwaySlopeFactor: Record<number, number> = {
    1: 0.00084,
    2: 0.00096,
    3: 0.0011,
  };

  /** Pressure altitude factors for each takeoff config. */
  private static readonly runwayPressureAltFactor: Record<number, [number, number]> = {
    1: [3.43e-8, 0.001192],
    2: [1.15e-8, 0.001216],
    3: [-4.6e-9, 0.001245],
  };

  /** Temperature factors for each takeoff config. */
  private static readonly runwayTemperatureFactor: Record<number, [number, number, number, number, number, number]> = {
    1: [0.00001, 0.095175, 0.000207, 0.040242, 0.00024, 0.066189],
    2: [-0.00001, 0.131948, 0.000155, 0.162938, 0.000225, 0.150363],
    3: [-0.0000438, 0.198845, 0.000188, 0.14547, 0.0002, 0.232529],
  };

  /** Headwind factors for each takeoff config. */
  private static readonly runwayHeadWindFactor: Record<number, [number, number, number, number]> = {
    1: [0.000029, -0.233075, 0.00242, 0.003772],
    2: [0.000051, -0.277863, 0.0018, 0.003366],
    3: [0.000115, -0.3951, 0.002357, 0.002125],
  };

  /** Tailwind factors for each takeoff config. */
  private static readonly runwayTailWindFactor: Record<number, [number, number, number, number]> = {
    1: [0.000065, -0.684701, 0.00498, 0.0808],
    2: [0.000198, -1.017, 0.00711, 0.009],
    3: [0.000271, -1.11506, 0.0078, 0.00875],
  };

  /** Segment segment weight factors for each takeoff config. */
  private static readonly secondSegmentBaseFactor: Record<number, [number, number]> = {
    1: [0.00391, 75.366],
    2: [0.005465, 72.227],
    3: [0.00495, 72.256],
  };

  /** Slope factor for each takeoff config. */
  private static readonly secondSegmentSlopeFactor: Record<number, number> = {
    1: 0.000419,
    2: 0.000641,
    3: 0.000459,
  };

  /** Pressure altitude factors for each takeoff config. */
  private static readonly secondSegmentPressureAltFactor: Record<number, [number, number]> = {
    1: [-6.5e-8, 0.001769],
    2: [1.05e-7, 0.00055],
    3: [7.48e-8, 0.000506],
  };

  /** Temperature factors for each takeoff config. */
  private static readonly secondSegmentTemperatureFactor: Record<
    number,
    [number, number, number, number, number, number]
  > = {
    1: [0.000025, 0.001, 0.000155, 0.211445, 0.000071, 0.556741],
    2: [0.0000121, 0.042153, 0.0001256, 0.325925, 0.000082, 0.546259],
    3: [-0.0000294, 0.13903, 0.0000693, 0.480536, 0.000133, 0.480536],
  };

  /** Headwind factors for each takeoff config. */
  private static readonly secondSegmentHeadWindFactor: Record<number, [number, number, number, number]> = {
    1: [0.000019, -0.13052, 0.000813636, 0.000145238],
    2: [0.0000454, -0.20585, 0.000416667, 0.001778293],
    3: [0.000085, -0.30209, 0.001189394, 0.0038996],
  };

  /** Tailwind factors for each takeoff config. */
  private static readonly secondSegmentTailWindFactor: Record<number, [number, number, number, number]> = {
    1: [0.000104, -0.705693, 0.009, 0.00648],
    2: [0.000154, -0.8052, 0.009, 0.002444],
    3: [0.000054, -0.462, 0.00875, 0.006606505],
  };

  /** Segment segment weight factors for each takeoff config. */
  private static readonly brakeEnergyBaseFactor: Record<number, [number, number]> = {
    1: [0.00503, 72.524],
    2: [0.00672, 68.28],
    3: [0.00128, 83.951],
  };

  /** Slope factor for each takeoff config. */
  private static readonly brakeEnergySlopeFactor: Record<number, number> = {
    1: 0.000045,
    2: 0.000068,
    3: 0.000045,
  };

  /** Pressure altitude factors for each takeoff config. */
  private static readonly brakeEnergyPressureAltFactor: Record<number, [number, number]> = {
    1: [5.5e-8, 0.000968],
    2: [1.17e-7, 0.000595],
    3: [4.65e-8, 0.000658],
  };

  /** Temperature factors for each takeoff config. */
  private static readonly brakeEnergyTemperatureFactor: Record<number, [number, number]> = {
    1: [0.06, 0.54],
    2: [0.058, 0.545],
    3: [0.04642, 0.6],
  };

  /** Headwind factors for each takeoff config. */
  private static readonly brakeEnergyHeadWindFactor: Record<number, [number, number, number, number]> = {
    1: [0.0000311, -0.1769, 0.001125, 0],
    2: [0.0000316, -0.1799, 0.001182, 0],
    3: [0.0000147, -0.0928, 0.001111, 0],
  };

  /** Tailwind factors for each takeoff config. */
  private static readonly brakeEnergyTailWindFactor: Record<number, [number, number, number, number]> = {
    1: [0.000117, -0.8024, 0.0117879, 0.006667],
    2: [0.000157, -0.849, 0.0066818, 0.006667],
    3: [0.00013, -0.6946, 0.0068333, 0.006667],
  };

  /** Segment segment weight factors for each takeoff config. */
  private static readonly vmcgBaseFactor: Record<number, [number, number]> = {
    1: [0.0644, -19.526],
    2: [0.082005, -39.27],
    3: [0.0704, -25.6868],
  };

  /** Slope factor for each takeoff config. */
  private static readonly vmcgSlopeFactor: Record<number, number> = {
    1: 0.00084,
    2: 0.001054,
    3: 0.001068,
  };

  /** Pressure altitude factors for each takeoff config. */
  private static readonly vmcgPressureAltFactor: Record<number, [number, number]> = {
    1: [-8.35e-7, 0.00589],
    2: [-7.58e-7, 0.00703],
    3: [1.95e-7, 0.00266],
  };

  /** Temperature factors for each takeoff config. */
  private static readonly vmcgTemperatureFactor: Record<number, [number, number, number, number, number, number]> = {
    1: [-0.00133, 2.104, 0.000699, -0.128144, -0.000718, 1.8103],
    2: [-0.00097, 1.613, 0.000242, 0.462005, -0.000547, 1.603],
    3: [-0.000923, 1.6087, 0.00061, 0.002239, -0.000335, 1.2716],
  };

  /** Headwind factors for each takeoff config. */
  private static readonly vmcgHeadWindFactor: Record<
    number,
    [number, number, number, number, number, number, number, number]
  > = {
    1: [0.001198, -1.80539, 0.000097, -0.15121, -0.000255, 0.337391, 0.000066, -0.079718],
    2: [0.000697, -1.17473, 0.000031, -0.057504, -0.000184, 0.246185, 0.000012, 0.0216],
    3: [0.0023, -3.468, -0.000037, 0.033946, -0.000156, 0.213953, -0.000757, 1.094],
  };

  /** Tailwind factors for each takeoff config. */
  private static readonly vmcgTailWindFactor: Record<number, [number, number, number, number, number, number]> = {
    1: [0.00218, -5.489, -0.000106, 0.145473, 0.031431, -0.0356],
    2: [0.001892, -5.646, -0.000059, 0.079539, 0.009948, -0.010763],
    3: [0.000613, -3.165, -0.000022, 0.020622, 0.049286, -0.0396],
  };

  /** Takeoff CG envelope. key = TOW [kg] => [lower limit, upper limit] %MAC. */
  private static readonly takeoffCgLimits = new LerpVectorLookupTable([
    [Vec2Math.create(15, 32.5), 40_500],
    [Vec2Math.create(15, 37), 50_000],
    [Vec2Math.create(15, MathUtils.lerp(53_000, 50_000, 67_200, 37, 40)), 53_000],
    [Vec2Math.create(17, MathUtils.lerp(63_000, 50_000, 67_200, 37, 40)), 63_000],
    [Vec2Math.create(17, 40), 67_200],
    [Vec2Math.create(17, 40), 72_000],
    [Vec2Math.create(MathUtils.lerp(73_200, 72_000, 77_000, 17, 24), 40), 73_200],
    [Vec2Math.create(24, 37.2), 77_000],
  ]);

  private static readonly cgFactors: Record<number, [number, number]> = {
    1: [-0.041448, 3.357],
    2: [-0.03277, 2.686],
    3: [-0.0249, 2.086],
  };

  /** Minimum V1 limited by VMCG/VMCA tables... lookup key is pressure altitude [feet], value is kcas. The speeds are the same for all configs. */
  private static readonly minimumV1Vmc = new LerpLookupTable([
    [122, -2000],
    [121, 0],
    [121, 2000],
    [120, 3000],
    [120, 4000],
    [118, 6000],
    [116, 8000],
    [115, 9200],
    [107, 14000],
    [106, 15000],
  ]);

  /** Minimum Vr limited by VMCG/VMCA tables... lookup key is pressure altitude [feet], value is kcas. The speeds are the same for all configs. */
  private static readonly minimumVrVmc = new LerpLookupTable([
    [123, -2000],
    [122, 0],
    [122, 3000],
    [121, 4000],
    [120, 6000],
    [117, 8000],
    [116, 9200],
    [107, 14000],
    [106, 15000],
  ]);

  /** Minimum V2 limited by VMCG/VMCA tables... outer key is takeoff config, lookup key is pressure altitude [feet], value is kcas. */
  private static readonly minimumV2Vmc: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [127, -2000],
      [126, 0],
      [126, 1000],
      [125, 2000],
      [125, 3000],
      [124, 4000],
      [123, 6000],
      [120, 8000],
      [118, 9200],
      [109, 14000],
      [107, 15000],
    ]),
    2: new LerpLookupTable([
      [127, -2000],
      [126, 0],
      [126, 1000],
      [125, 2000],
      [125, 3000],
      [124, 4000],
      [123, 6000],
      [120, 8000],
      [118, 9200],
      [109, 14000],
      [107, 15000],
    ]),
    3: new LerpLookupTable([
      [126, -2000],
      [125, 0],
      [125, 1000],
      [124, 2000],
      [124, 3000],
      [123, 4000],
      [122, 6000],
      [119, 8000],
      [117, 9200],
      [108, 14000],
      [106, 15000],
    ]),
  };

  /** Minimum V2 limited by VMU/VMCA tables... outer key is takeoff config, lookup keys are (pressure altitude [feet], takeoff weight [kg]), value is kcas. */
  private static readonly minimumV2Vmu: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [127, -2000, 45_000],
      [127, -2000, 50_000],
      [127, -2000, 55_000],
      [132, -2000, 60_000],
      [137, -2000, 65_000],
      [142, -2000, 70_000],
      [146, -2000, 75_000],
      [151, -2000, 80_000],
      [126, -1000, 45_000],
      [126, -1000, 50_000],
      [127, -1000, 55_000],
      [132, -1000, 60_000],
      [137, -1000, 65_000],
      [142, -1000, 70_000],
      [147, -1000, 75_000],
      [151, -1000, 80_000],
      [126, 0, 45_000],
      [126, 0, 50_000],
      [127, 0, 55_000],
      [132, 0, 60_000],
      [137, 0, 65_000],
      [142, 0, 70_000],
      [147, 0, 75_000],
      [151, 0, 80_000],
      [126, 1000, 45_000],
      [126, 1000, 50_000],
      [127, 1000, 55_000],
      [132, 1000, 60_000],
      [137, 1000, 65_000],
      [142, 1000, 70_000],
      [147, 1000, 75_000],
      [151, 1000, 80_000],
      [125, 2000, 45_000],
      [125, 2000, 50_000],
      [127, 2000, 55_000],
      [132, 2000, 60_000],
      [137, 2000, 65_000],
      [142, 2000, 70_000],
      [147, 2000, 75_000],
      [151, 2000, 80_000],
      [125, 3000, 45_000],
      [125, 3000, 50_000],
      [127, 3000, 55_000],
      [132, 3000, 60_000],
      [137, 3000, 65_000],
      [142, 3000, 70_000],
      [147, 3000, 75_000],
      [151, 3000, 80_000],
      [124, 4000, 45_000],
      [124, 4000, 50_000],
      [127, 4000, 55_000],
      [132, 4000, 60_000],
      [137, 4000, 65_000],
      [142, 4000, 70_000],
      [147, 4000, 75_000],
      [152, 4000, 80_000],
      [124, 5000, 45_000],
      [124, 5000, 50_000],
      [127, 5000, 55_000],
      [132, 5000, 60_000],
      [137, 5000, 65_000],
      [142, 5000, 70_000],
      [147, 5000, 75_000],
      [152, 5000, 80_000],
      [123, 6000, 45_000],
      [123, 6000, 50_000],
      [127, 6000, 55_000],
      [132, 6000, 60_000],
      [137, 6000, 65_000],
      [142, 6000, 70_000],
      [147, 6000, 75_000],
      [152, 6000, 80_000],
      [122, 7000, 45_000],
      [122, 7000, 50_000],
      [127, 7000, 55_000],
      [132, 7000, 60_000],
      [137, 7000, 65_000],
      [142, 7000, 70_000],
      [147, 7000, 75_000],
      [152, 7000, 80_000],
      [120, 8000, 45_000],
      [121, 8000, 50_000],
      [127, 8000, 55_000],
      [132, 8000, 60_000],
      [137, 8000, 65_000],
      [143, 8000, 70_000],
      [148, 8000, 75_000],
      [152, 8000, 80_000],
      [119, 9000, 45_000],
      [121, 9000, 50_000],
      [127, 9000, 55_000],
      [132, 9000, 60_000],
      [137, 9000, 65_000],
      [143, 9000, 70_000],
      [148, 9000, 75_000],
      [153, 9000, 80_000],
      [117, 10000, 45_000],
      [121, 10000, 50_000],
      [127, 10000, 55_000],
      [132, 10000, 60_000],
      [137, 10000, 65_000],
      [143, 10000, 70_000],
      [148, 10000, 75_000],
      [153, 10000, 80_000],
      [115, 11000, 45_000],
      [121, 11000, 50_000],
      [127, 11000, 55_000],
      [132, 11000, 60_000],
      [138, 11000, 65_000],
      [143, 11000, 70_000],
      [149, 11000, 75_000],
      [154, 11000, 80_000],
      [115, 12000, 45_000],
      [121, 12000, 50_000],
      [127, 12000, 55_000],
      [132, 12000, 60_000],
      [138, 12000, 65_000],
      [143, 12000, 70_000],
      [149, 12000, 75_000],
      [154, 12000, 80_000],
      [115, 13000, 45_000],
      [121, 13000, 50_000],
      [127, 13000, 55_000],
      [132, 13000, 60_000],
      [138, 13000, 65_000],
      [144, 13000, 70_000],
      [149, 13000, 75_000],
      [154, 13000, 80_000],
      [115, 14100, 45_000],
      [121, 14100, 50_000],
      [127, 14100, 55_000],
      [132, 14100, 60_000],
      [138, 14100, 65_000],
      [144, 14100, 70_000],
      [150, 14100, 75_000],
      [155, 14100, 80_000],
      [115, 15100, 45_000],
      [121, 15100, 50_000],
      [127, 15100, 55_000],
      [133, 15100, 60_000],
      [139, 15100, 65_000],
      [144, 15100, 70_000],
      [150, 15100, 75_000],
      [155, 15100, 80_000],
    ]),
    2: new LerpLookupTable([
      [127, -2000, 45_000],
      [127, -2000, 50_000],
      [127, -2000, 55_000],
      [127, -2000, 60_000],
      [132, -2000, 65_000],
      [136, -2000, 70_000],
      [141, -2000, 75_000],
      [145, -2000, 80_000],
      [126, -1000, 45_000],
      [126, -1000, 50_000],
      [126, -1000, 55_000],
      [127, -1000, 60_000],
      [132, -1000, 65_000],
      [136, -1000, 70_000],
      [141, -1000, 75_000],
      [145, -1000, 80_000],
      [126, 0, 45_000],
      [126, 0, 50_000],
      [126, 0, 55_000],
      [127, 0, 60_000],
      [132, 0, 65_000],
      [137, 0, 70_000],
      [141, 0, 75_000],
      [146, 0, 80_000],
      [126, 1000, 45_000],
      [126, 1000, 50_000],
      [126, 1000, 55_000],
      [127, 1000, 60_000],
      [132, 1000, 65_000],
      [137, 1000, 70_000],
      [141, 1000, 75_000],
      [146, 1000, 80_000],
      [125, 2000, 45_000],
      [125, 2000, 50_000],
      [125, 2000, 55_000],
      [127, 2000, 60_000],
      [132, 2000, 65_000],
      [137, 2000, 70_000],
      [141, 2000, 75_000],
      [146, 2000, 80_000],
      [125, 3000, 45_000],
      [125, 3000, 50_000],
      [125, 3000, 55_000],
      [127, 3000, 60_000],
      [132, 3000, 65_000],
      [137, 3000, 70_000],
      [142, 3000, 75_000],
      [146, 3000, 80_000],
      [124, 4000, 45_000],
      [124, 4000, 50_000],
      [124, 4000, 55_000],
      [127, 4000, 60_000],
      [132, 4000, 65_000],
      [137, 4000, 70_000],
      [142, 4000, 75_000],
      [146, 4000, 80_000],
      [124, 5000, 45_000],
      [124, 5000, 50_000],
      [124, 5000, 55_000],
      [127, 5000, 60_000],
      [132, 5000, 65_000],
      [137, 5000, 70_000],
      [142, 5000, 75_000],
      [146, 5000, 80_000],
      [123, 6000, 45_000],
      [123, 6000, 50_000],
      [123, 6000, 55_000],
      [127, 6000, 60_000],
      [132, 6000, 65_000],
      [137, 6000, 70_000],
      [142, 6000, 75_000],
      [146, 6000, 80_000],
      [122, 7000, 45_000],
      [122, 7000, 50_000],
      [122, 7000, 55_000],
      [127, 7000, 60_000],
      [132, 7000, 65_000],
      [137, 7000, 70_000],
      [142, 7000, 75_000],
      [146, 7000, 80_000],
      [120, 8000, 45_000],
      [120, 8000, 50_000],
      [122, 8000, 55_000],
      [127, 8000, 60_000],
      [132, 8000, 65_000],
      [137, 8000, 70_000],
      [142, 8000, 75_000],
      [146, 8000, 80_000],
      [119, 9000, 45_000],
      [119, 9000, 50_000],
      [122, 9000, 55_000],
      [127, 9000, 60_000],
      [132, 9000, 65_000],
      [137, 9000, 70_000],
      [142, 9000, 75_000],
      [147, 9000, 80_000],
      [117, 10000, 45_000],
      [117, 10000, 50_000],
      [122, 10000, 55_000],
      [127, 10000, 60_000],
      [132, 10000, 65_000],
      [137, 10000, 70_000],
      [142, 10000, 75_000],
      [147, 10000, 80_000],
      [115, 11000, 45_000],
      [117, 11000, 50_000],
      [122, 11000, 55_000],
      [127, 11000, 60_000],
      [132, 11000, 65_000],
      [137, 11000, 70_000],
      [142, 11000, 75_000],
      [147, 11000, 80_000],
      [113, 12000, 45_000],
      [117, 12000, 50_000],
      [122, 12000, 55_000],
      [127, 12000, 60_000],
      [132, 12000, 65_000],
      [138, 12000, 70_000],
      [143, 12000, 75_000],
      [147, 12000, 80_000],
      [111, 13000, 45_000],
      [116, 13000, 50_000],
      [122, 13000, 55_000],
      [127, 13000, 60_000],
      [133, 13000, 65_000],
      [138, 13000, 70_000],
      [143, 13000, 75_000],
      [148, 13000, 80_000],
      [111, 14100, 45_000],
      [116, 14100, 50_000],
      [122, 14100, 55_000],
      [127, 14100, 60_000],
      [133, 14100, 65_000],
      [138, 14100, 70_000],
      [143, 14100, 75_000],
      [148, 14100, 80_000],
      [111, 15100, 45_000],
      [116, 15100, 50_000],
      [122, 15100, 55_000],
      [127, 15100, 60_000],
      [133, 15100, 65_000],
      [138, 15100, 70_000],
      [143, 15100, 75_000],
      [148, 15100, 80_000],
    ]),
    3: new LerpLookupTable([
      [126, -2000, 45000],
      [126, -2000, 50000],
      [126, -2000, 55000],
      [126, -2000, 60000],
      [128, -2000, 65000],
      [132, -2000, 70000],
      [137, -2000, 75000],
      [141, -2000, 80000],
      [125, -1000, 45000],
      [125, -1000, 50000],
      [125, -1000, 55000],
      [125, -1000, 60000],
      [128, -1000, 65000],
      [132, -1000, 70000],
      [137, -1000, 75000],
      [141, -1000, 80000],
      [125, 0, 45000],
      [125, 0, 50000],
      [125, 0, 55000],
      [125, 0, 60000],
      [128, 0, 65000],
      [132, 0, 70000],
      [137, 0, 75000],
      [141, 0, 80000],
      [125, 1000, 45000],
      [125, 1000, 50000],
      [125, 1000, 55000],
      [125, 1000, 60000],
      [128, 1000, 65000],
      [132, 1000, 70000],
      [137, 1000, 75000],
      [141, 1000, 80000],
      [124, 2000, 45000],
      [124, 2000, 50000],
      [124, 2000, 55000],
      [124, 2000, 60000],
      [128, 2000, 65000],
      [132, 2000, 70000],
      [137, 2000, 75000],
      [141, 2000, 80000],
      [124, 3000, 45000],
      [124, 3000, 50000],
      [124, 3000, 55000],
      [124, 3000, 60000],
      [128, 3000, 65000],
      [133, 3000, 70000],
      [137, 3000, 75000],
      [141, 3000, 80000],
      [123, 4000, 45000],
      [123, 4000, 50000],
      [123, 4000, 55000],
      [123, 4000, 60000],
      [128, 4000, 65000],
      [133, 4000, 70000],
      [137, 4000, 75000],
      [141, 4000, 80000],
      [123, 5000, 45000],
      [123, 5000, 50000],
      [123, 5000, 55000],
      [123, 5000, 60000],
      [128, 5000, 65000],
      [133, 5000, 70000],
      [137, 5000, 75000],
      [142, 5000, 80000],
      [122, 6000, 45000],
      [122, 6000, 50000],
      [122, 6000, 55000],
      [123, 6000, 60000],
      [128, 6000, 65000],
      [133, 6000, 70000],
      [137, 6000, 75000],
      [142, 6000, 80000],
      [121, 7000, 45000],
      [121, 7000, 50000],
      [121, 7000, 55000],
      [123, 7000, 60000],
      [128, 7000, 65000],
      [133, 7000, 70000],
      [138, 7000, 75000],
      [142, 7000, 80000],
      [119, 8000, 45000],
      [119, 8000, 50000],
      [119, 8000, 55000],
      [123, 8000, 60000],
      [128, 8000, 65000],
      [133, 8000, 70000],
      [138, 8000, 75000],
      [142, 8000, 80000],
      [118, 9000, 45000],
      [118, 9000, 50000],
      [118, 9000, 55000],
      [123, 9000, 60000],
      [128, 9000, 65000],
      [133, 9000, 70000],
      [138, 9000, 75000],
      [142, 9000, 80000],
      [116, 10000, 45000],
      [116, 10000, 50000],
      [118, 10000, 55000],
      [123, 10000, 60000],
      [128, 10000, 65000],
      [133, 10000, 70000],
      [138, 10000, 75000],
      [142, 10000, 80000],
      [114, 11000, 45000],
      [114, 11000, 50000],
      [118, 11000, 55000],
      [123, 11000, 60000],
      [128, 11000, 65000],
      [133, 11000, 70000],
      [138, 11000, 75000],
      [142, 11000, 80000],
      [112, 12000, 45000],
      [113, 12000, 50000],
      [118, 12000, 55000],
      [123, 12000, 60000],
      [128, 12000, 65000],
      [133, 12000, 70000],
      [138, 12000, 75000],
      [143, 12000, 80000],
      [110, 13000, 45000],
      [113, 13000, 50000],
      [118, 13000, 55000],
      [123, 13000, 60000],
      [128, 13000, 65000],
      [133, 13000, 70000],
      [138, 13000, 75000],
      [143, 13000, 80000],
      [108, 14100, 45000],
      [113, 14100, 50000],
      [118, 14100, 55000],
      [123, 14100, 60000],
      [128, 14100, 65000],
      [134, 14100, 70000],
      [139, 14100, 75000],
      [143, 14100, 80000],
      [107, 15100, 45000],
      [113, 15100, 50000],
      [118, 15100, 55000],
      [123, 15100, 60000],
      [129, 15100, 65000],
      [134, 15100, 70000],
      [139, 15100, 75000],
      [143, 15100, 80000],
    ]),
  };

  private static readonly v2RunwayVmcgBaseFactors: Record<number, [number, number]> = {
    1: [0.920413, 77.3469],
    2: [0.87805, 75.1346],
    3: [0.96131, 65.525],
  };

  private static readonly v2RunwayVmcgAltFactors: Record<number, [number, number]> = {
    1: [0.00002333, -0.00144],
    2: [0.00001713, -0.001057],
    3: [0.00001081, -0.0006236],
  };

  private static readonly vRRunwayVmcgBaseFactors: Record<number, [number, number]> = {
    1: [0.83076, 81.086],
    2: [0.728085, 84.111],
    3: [0.742761, 78.721],
  };

  private static readonly vRRunwayVmcgRunwayFactors: Record<number, [number, number, number]> = {
    1: [2280, 0.0001718, -0.01585],
    2: [2280, 0.0003239, -0.027272],
    3: [1900, 0.00057992, -0.045646],
  };

  private static readonly vRRunwayVmcgAltFactors: Record<number, [number, number]> = {
    1: [0.000029048, -0.001958],
    2: [0.000035557, -0.0025644],
    3: [1.02964e-5, -0.000545643],
  };

  private static readonly vRRunwayVmcgSlopeFactors: Record<number, number> = {
    1: 0.000887,
    2: 0.000887,
    3: 0.000887,
  };

  private static readonly vRRunwayVmcgHeadwindFactors: Record<number, [number, number]> = {
    1: [0, 0],
    2: [-0.027617, 2.1252],
    3: [0.003355, -0.263036],
  };

  private static readonly vRRunwayVmcgTailwindFactors: Record<number, [number, number]> = {
    1: [-0.008052, 0.6599],
    2: [-0.010709, 0.90273],
    3: [-0.027796, 2.107178],
  };

  private static readonly v1RunwayVmcgBaseFactors: Record<number, [number, number]> = {
    1: [0.4259042, 106.763],
    2: [0.398826, 106.337],
    3: [0.469648, 95.776],
  };

  private static readonly v1RunwayVmcgRunwayFactors: Record<number, [number, number, number]> = {
    1: [2280, 0.0003156, -0.03189],
    2: [2280, 0.0004396, -0.041238],
    3: [1900, 0.00144, -0.112592],
  };

  private static readonly v1RunwayVmcgAltFactors: Record<number, [number, number]> = {
    1: [0.00003416, -0.0028035],
    2: [0.00004354, -0.0035876],
    3: [0.0000847, -0.006666],
  };

  private static readonly v1RunwayVmcgSlopeFactors: Record<number, number> = {
    1: 0.000887,
    2: 0.000887,
    3: 0.000887,
  };

  private static readonly v1RunwayVmcgHeadwindFactors: Record<number, [number, number]> = {
    1: [0.00526, -0.2105],
    2: [0.00974, -0.53],
    3: [0.002333, -0.079528],
  };

  private static readonly v1RunwayVmcgTailwindFactors: Record<number, [number, number]> = {
    1: [-0.009243, 1.108],
    2: [-0.008207, 1.07],
    3: [-0.043516, 3.423],
  };

  private static readonly v2SecondSegBrakeThresholds: Record<number, [number, number]> = {
    1: [-0.009368, 186.79],
    2: [0.02346, 68.33],
    3: [0.022112, 83.141],
  };

  private static readonly v2SecondSegBrakeBaseTable1: Record<number, [number, number]> = {
    1: [0.72637, 101.077],
    2: [0.74005, 97.073],
    3: [0.3746, 130.078],
  };

  private static readonly v2SecondSegBrakeBaseTable2: Record<number, [number, number]> = {
    1: [0.63964, 102.127],
    2: [0.692636, 92.9863],
    3: [0.859926, 82.4377],
  };

  private static readonly v2SecondSegBrakeRunwayTable1: Record<number, [number, number]> = {
    1: [3180, -0.015997],
    2: [3180, -0.014862],
    3: [3180, -0.019296],
  };

  private static readonly v2SecondSegBrakeRunwayTable2: Record<number, [number, number]> = {
    1: [3180, -0.003612],
    2: [3180, -0.007],
    3: [3180, -0.013],
  };

  private static readonly v2SecondSegBrakeAltFactors: Record<number, [number, number, number, number]> = {
    1: [-0.00000924, -0.00075879, 0.000546, -1.075],
    2: [-0.00000387, -0.0009333, 0.000546, -1.075],
    3: [0.000034, -0.004043, 0.000468, -0.778471],
  };

  private static readonly v2SecondSegBrakeSlopeFactors: Record<number, [number, number]> = {
    1: [0.0000571, -0.008306],
    2: [0.0000286, -0.00415],
    3: [0.000001, -0.000556],
  };

  private static readonly v2SecondSegBrakeHeadwindFactors: Record<number, number> = {
    1: 0.2,
    2: 0.2,
    3: 0.2,
  };

  private static readonly v2SecondSegBrakeTailwindFactors: Record<number, number> = {
    1: 0.65,
    2: 0.5,
    3: 0.7,
  };

  private static readonly vRSecondSegBrakeBaseTable1: Record<number, [number, number]> = {
    1: [0.701509, 102.667],
    2: [0.696402, 100.226],
    3: [0.381534, 129.61],
  };

  private static readonly vRSecondSegBrakeBaseTable2: Record<number, [number, number]> = {
    1: [0.573107, 105.783],
    2: [0.932193, 115.336],
    3: [0.572407, 105.428],
  };

  private static readonly vRSecondSegBrakeRunwayTable1: Record<number, [number, number, number]> = {
    1: [3180, -0.000181, -0.005195],
    2: [3180, -0.000225, -0.000596],
    3: [3180, 0.000054, -0.024442],
  };

  private static readonly vRSecondSegBrakeRunwayTable2: Record<number, [number, number, number]> = {
    1: [3180, 0.004582, -0.395175],
    2: [3180, 0.000351, -0.03216],
    3: [3180, -0.000263, 0.014135],
  };

  private static readonly vRSecondSegBrakeAltTable1: Record<number, [number, number, number, number]> = {
    1: [-0.000034, 0.001018, 0.000154, 0.415385],
    2: [-0.00001, -0.000253, 0.000328, -0.24493],
    3: [0.000017, -0.003017, 0.000398, -0.5117],
  };

  private static readonly vRSecondSegBrakeAltTable2: Record<number, [number, number, number, number]> = {
    1: [0.000574, -0.047508, 0.000154, 0.415385],
    2: [0.000253, -0.019907, 0.000328, -0.24493],
    3: [0.000247, -0.019502, 0.000398, -0.5117],
  };

  private static readonly vRSecondSegBrakeSlopeFactors: Record<number, [number, number]> = {
    1: [0.000293, -0.023877],
    2: [0.000309, -0.025884],
    3: [0.000049, -0.005035],
  };

  private static readonly vRSecondSegBrakeHeadwindFactors: Record<number, [number, number]> = {
    1: [0.00668, -0.30215],
    2: [0.015247, -0.946949],
    3: [0.028496, -1.808403],
  };

  private static readonly vRSecondSegBrakeTailwindFactors: Record<number, [number, number]> = {
    1: [0.014683, -0.347428],
    2: [0.019024, -0.725293],
    3: [-0.002393, 0.994507],
  };

  private static readonly v1SecondSegBrakeBaseTable1: Record<number, [number, number]> = {
    1: [0.580888, 111.076],
    2: [0.663598, 102.54],
    3: [0.112254, 147.272],
  };

  private static readonly v1SecondSegBrakeBaseTable2: Record<number, [number, number]> = {
    1: [0.460256, 104.849],
    2: [0.583566, 84.342],
    3: [0.527615, 95.085],
  };

  private static readonly v1SecondSegBrakeRunwayTable1: Record<number, [number, number, number]> = {
    1: [3180, -0.000218, -0.003633],
    2: [3180, -0.000473, 0.015987],
    3: [3180, 0.000017, -0.022792],
  };

  private static readonly v1SecondSegBrakeRunwayTable2: Record<number, [number, number, number]> = {
    1: [3180, 0.005044, -0.418865],
    2: [3180, 0.00052, -0.024703],
    3: [3180, 0.000688, -0.048497],
  };

  private static readonly v1SecondSegBrakeAltTable1: Record<number, [number, number, number, number]> = {
    1: [-0.000084, 0.00393, 0.000231, 0.123077],
    2: [-0.0000086, -0.000333, 0.000172, 0.347893],
    3: [0.000159, -0.012122, 0.000382, -0.452242],
  };

  private static readonly v1SecondSegBrakeAltTable2: Record<number, [number, number, number, number]> = {
    1: [0.000957, -0.077197, 0.000231, 0.123077],
    2: [0.000354, -0.025738, 0.000172, 0.347893],
    3: [0.000927, -0.072365, 0.000382, -0.452242],
  };

  private static readonly v1SecondSegBrakeSlopeFactors: Record<number, [number, number]> = {
    1: [0.00003, -0.001069],
    2: [0.00003, -0.001069],
    3: [0.0000431, -0.003239],
  };

  private static readonly v1SecondSegBrakeHeadwindFactors: Record<number, [number, number]> = {
    1: [0.019515, -1.23885],
    2: [0.019515, -1.23886],
    3: [0.065846, -4.365037],
  };

  private static readonly v1SecondSegBrakeTailwindFactors: Record<number, [number, number]> = {
    1: [0.032069, -1.44],
    2: [0.030147, -1.4286],
    3: [-0.001744, 1.0938],
  };

  /**
   * Factors to determine the temperature above which we're VMCG limited on the wet runway.
   * Maps headwind component to TVMCG factors.
   */
  private static readonly tvmcgFactors: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [Vec2Math.create(0.06485, -99.47), -15],
      [Vec2Math.create(0.9895, -116.54), 0],
      [Vec2Math.create(0.13858, -171.15), 10],
    ]),
    2: new LerpVectorLookupTable([
      [Vec2Math.create(0.06573, -102.97), -15],
      [Vec2Math.create(0.10579, -132.96), 0],
      [Vec2Math.create(0.06575, -64.4), 10],
    ]),
    3: new LerpVectorLookupTable([
      [Vec2Math.create(0.07002, -106.62), -15],
      [Vec2Math.create(0.08804, -108.42), 0],
      [Vec2Math.create(0.07728, -82.08), 10],
    ]),
  };

  /**
   * Factors to determine the TOW adjustment on a wet runway when not VMCG limited.
   * Maps headwind component to adjustment factors.
   */
  private static readonly wetTowAdjustmentFactorsAtOrBelowTvmcg: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [VecNMath.create(0.05498, -126.98, 0.00903, -28.35), -15],
      [VecNMath.create(0.02391, -48.94, 0.00043, -1.64), 0],
      [VecNMath.create(0.01044, -21.53, 0.00022, -1.12), 10],
    ]),
    2: new LerpVectorLookupTable([
      [VecNMath.create(0.03856, -94.674, 0.00965, -30.09), -15],
      [VecNMath.create(0.02686, -48.63, -0.00011, -0.08), 0],
      [VecNMath.create(0.00057, -2.94, -0.00004, -0.13), 10],
    ]),
    3: new LerpVectorLookupTable([
      [VecNMath.create(0.01924, -57.58, 0, 0), -15],
      [VecNMath.create(0.02184, -44.91, -0.00019, 0.1), 0],
      [VecNMath.create(0.00057, -2.94, 0.00047, -1.6), 10],
    ]),
  };

  /**
   * Factors to determine the TOW adjustment on a wet runway when VMCG limited.
   * Maps headwind component to adjustment factors.
   */
  private static readonly wetTowAdjustmentFactorsAboveTvmcg: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [VecNMath.create(0.0197, -61.23, 0, 0), -15],
      [VecNMath.create(0.01887, -48.47, 0, 0), 0],
      [VecNMath.create(0.045, -86.32, 0, 0), 10],
    ]),
    2: new LerpVectorLookupTable([
      [VecNMath.create(0.01941, -60.02, 0, 0), -15],
      [VecNMath.create(0.02797, -61.99, 0, 0), 0],
      [VecNMath.create(0.03129, -63.61, 0, 0), 10],
    ]),
    3: new LerpVectorLookupTable([
      [VecNMath.create(0.01978, -61.43, 0, 0), -15],
      [VecNMath.create(0.02765, -61.88, 0, 0), 0],
      [VecNMath.create(0.03662, -72.45, 0, 0), 10],
    ]),
  };

  /**
   * Factors to determine the flex adjustment on a wet runway when not VMCG limited.
   * Maps headwind component to adjustment factors.
   */
  private static readonly wetFlexAdjustmentFactorsAtOrBelowTvmcg: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [VecNMath.create(0.07933, -190.57, 0.02074, -65.05), -15],
      [VecNMath.create(0.04331, -90.86, 0.00098, -3.88), 0],
      [VecNMath.create(0.0233, -48.8, 0.00072, -3.14), 10],
    ]),
    2: new LerpVectorLookupTable([
      [VecNMath.create(0.029, -89.9, 0.0099, -38.42), -15],
      [VecNMath.create(0.03845, -80.2, -1, 0), 0],
      [VecNMath.create(0.00167, -7.01, 0.000266, -1.61), 10],
    ]),
    3: new LerpVectorLookupTable([
      [VecNMath.create(0.03993, -94.09, 0, 0), -15],
      [VecNMath.create(0.03845, -80.2, -1, 0), 0],
      [VecNMath.create(0.00835, -18.34, -1, 0), 10],
    ]),
  };

  /**
   * Factors to determine the flex adjustment on a wet runway when VMCG limited.
   * Maps headwind component to adjustment factors.
   */
  private static readonly wetFlexAdjustmentFactorsAboveTvmcg: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [VecNMath.create(-0.03716, 31.85, 0.08618, -234.92), -15],
      [VecNMath.create(-0.05861, 51.01, 0.04322, -113.39), 0],
      [VecNMath.create(0.1012, -195.48, 0, 0), 10],
    ]),
    2: new LerpVectorLookupTable([
      [VecNMath.create(-0.0285, 19.43, 0.06951, -193.38), -15],
      [VecNMath.create(-0.04698, 37.58, 0.06438, -139.9), 0],
      [VecNMath.create(0.06159, -126.56, 0, 0), 10],
    ]),
    3: new LerpVectorLookupTable([
      [VecNMath.create(-0.0024, 4.25, -0.02118, 46.2), -15],
      [VecNMath.create(-0.02645, 9.81, 0.06116, -131.79), 0],
      [VecNMath.create(0.04841, -104.22, 0, 0), 10],
    ]),
  };

  /**
   * Factors to determine the V1 adjustment on a wet runway when not VMCG limited.
   * Maps headwind component to adjustment factors.
   */
  private static readonly wetV1AdjustmentFactorsAtOrBelowTvmcg: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [VecNMath.create(0.01428, -32.58, 0.00048, -2.03), -15],
      [VecNMath.create(-0.00786, 6.81, 0.00234, -14.23), 0],
      [VecNMath.create(-0.00246, -3.68, 0.00145, -11.32), 10],
    ]),
    2: new LerpVectorLookupTable([
      [VecNMath.create(-0.01563, 28.93, -0.00559, 6.36), -15],
      [VecNMath.create(-0.00474, 6.98, 0.0024, -13.2), 0],
      [VecNMath.create(0.00236, -11.92, 0, 0), 10],
    ]),
    3: new LerpVectorLookupTable([
      [VecNMath.create(-0.01018, 18.83, 0, 0), -15],
      [VecNMath.create(-0.00931, 10.01, 0.00017, -8.5), 0],
      [VecNMath.create(-0.00005, -7.98, 0, 0), 10],
    ]),
  };

  /**
   * Factors to determine the V1 adjustment on a wet runway not VMCG limited.
   * Maps headwind component to adjustment factors.
   */
  private static readonly wetV1AdjustmentFactorsAboveTvmcg: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [VecNMath.create(-0.00131, 0.91, -0.02013, 42.56), -15],
      [VecNMath.create(0.10383, -169.42, -0.00529, 6.73), 0],
      [VecNMath.create(-0.01594, 21.8, 0, 0), 10],
    ]),
    2: new LerpVectorLookupTable([
      [VecNMath.create(-0.00789, 15.29, 0, 0), -15],
      [VecNMath.create(-0.00971, 14, 0, 0), 0],
      [VecNMath.create(-0.00684, 8.43, 0, 0), 10],
    ]),
    3: new LerpVectorLookupTable([
      [VecNMath.create(-0.0024, 4.25, -0.02118, 46.2), -15],
      [VecNMath.create(-0.00727, 10.12, 0, 0), 0],
      [VecNMath.create(-0.00671, 8.65, -0.0333, 50.84), 10],
    ]),
  };

  /**
   * Factors to determine the Vr adjustment on a wet runway when not VMCG limited.
   * Maps headwind component to adjustment factors.
   */
  private static readonly wetVRAdjustmentFactorsAtOrBelowTvmcg: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [VecNMath.create(0.01428, -32.58, 0.00048, -2.03), -15],
      [VecNMath.create(0.00353, -7.19, 0.00022, -0.64), 0],
      [VecNMath.create(0.0022, -4.14, 0.00053, -1.54), 10],
    ]),
    2: new LerpVectorLookupTable([
      [VecNMath.create(0.00693, -16.96, -0.00559, 6.36), -15],
      [VecNMath.create(0.00864, -17.08, 0, 0), 0],
      [VecNMath.create(0, 0, 0, 0), 10],
    ]),
    3: new LerpVectorLookupTable([
      [VecNMath.create(0.00151, -6.16, 0, 0), -15],
      [VecNMath.create(-0.00557, -11.68, -0.0004, 0.54), 0],
      [VecNMath.create(-0.0001, -0.11, 0, 0), 10],
    ]),
  };

  /**
   * Factors to determine the V2 adjustment on a wet runway when not VMCG limited.
   * Maps headwind component to adjustment factors.
   */
  private static readonly wetV2AdjustmentFactorsAtOrBelowTvmcg: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [VecNMath.create(0.01936, -43.79, 0.000483, -2.03), -15],
      [VecNMath.create(0.00353, -7.19, 0.00022, -0.64), 0],
      [VecNMath.create(0.0022, -4.14, 0.00053, -1.54), 10],
    ]),
    2: new LerpVectorLookupTable([
      [VecNMath.create(0.01198, -28.31, 0, 0), -15],
      [VecNMath.create(0.00864, -17.08, 0, 0), 0],
      [VecNMath.create(0, 0, 0, 0), 10],
    ]),
    3: new LerpVectorLookupTable([
      [VecNMath.create(0.00246, -8.65, 0, 0), -15],
      [VecNMath.create(0.00114, -3.52, 0, 0), 0],
      [VecNMath.create(-0.0001, -0.11, 0, 0), 10],
    ]),
  };

  /**
   * Weight Correction for runways contaminated with 6.3 mm/1/4" of water.
   * Maps runway length in metres to weight correction in kg.
   * Note: no clearway figures used, as MSFS can't tell us if there's a clearway.
   */
  private static readonly weightCorrectionContaminated6mmWater: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [15_000, 2_500],
      [14_400, 3_000],
      [10_500, 3_500],
      [6_800, 4_000],
    ]),
    2: new LerpLookupTable([
      [17_400, 2_000],
      [17_400, 2_500],
      [15_500, 3_000],
    ]),
    3: new LerpLookupTable([
      [18_700, 1_750],
      [18_700, 2_000],
      [17_400, 2_500],
    ]),
  };

  /** Minimum takeoff weight for each config on runways contaminated with 6.3 mm/1/4" of water. */
  private static minCorrectedTowContaminated6mmWater: Record<number, number> = {
    1: 57_800,
    2: 56_800,
    3: 57_200,
  };

  /**
   * MTOW for runways contaminated with 6.3 mm/1/4" of water.
   * Maps corrected weight in kg to MTOW in kg.
   */
  private static readonly mtowContaminated6mmWater: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [47_600, 57_800],
      [53_000, 59_000],
      [60_700, 60_700],
      [79_000, 79_000],
    ]),
    2: new LerpLookupTable([
      [47_600, 56_800],
      [59_000, 59_000],
      [79_000, 79_000],
    ]),
    3: new LerpLookupTable([
      [47_600, 57_200],
      [56_000, 59_000],
      [59_800, 59_800],
      [79_000, 79_000],
    ]),
  };

  /**
   * V-Speeds for runways contaminated with 6.3 mm/1/4" of water.
   * Maps actual takeoff weight in kg to v1, vr, v2 in knots.
   */
  private static readonly vSpeedsContaminated6mmWater: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [Vec3Math.create(122, 125, 127), 47_600],
      [Vec3Math.create(122, 127, 129), 49_000],
      [Vec3Math.create(122, 133, 135), 54_000],
      [Vec3Math.create(122, 139, 141), 59_000],
      [Vec3Math.create(122, 141, 143), 60_700],
      [Vec3Math.create(126, 145, 147), 64_000],
      [Vec3Math.create(132, 151, 153), 69_000],
      [Vec3Math.create(137, 156, 158), 74_000],
      [Vec3Math.create(142, 161, 163), 79_000],
    ]),
    2: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(122, 141, 142), 59_000],
      [Vec3Math.create(127, 146, 147), 64_000],
      [Vec3Math.create(133, 152, 153), 69_000],
      [Vec3Math.create(139, 158, 159), 74_000],
      [Vec3Math.create(144, 163, 164), 79_000],
    ]),
    3: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 126), 47_600],
      [Vec3Math.create(122, 128, 128), 49_000],
      [Vec3Math.create(122, 134, 134), 54_000],
      [Vec3Math.create(122, 140, 140), 59_000],
      [Vec3Math.create(122, 141, 141), 59_800],
      [Vec3Math.create(127, 146, 146), 64_000],
      [Vec3Math.create(133, 152, 152), 69_000],
      [Vec3Math.create(139, 158, 158), 74_000],
      [Vec3Math.create(144, 163, 163), 79_000],
    ]),
  };

  /**
   * Weight Correction for runways contaminated with 12.7 mm/1/2" of water.
   * Maps runway length in metres to weight correction in kg.
   * Note: no clearway figures used, as MSFS can't tell us if there's a clearway.
   */
  private static readonly weightCorrectionContaminated13mmWater: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [18_700, 2_500],
      [17_500, 3_000],
      [13_600, 3_500],
      [9_700, 4_000],
    ]),
    2: new LerpLookupTable([
      [21_000, 2_000],
      [20_800, 2_500],
      [18_500, 3_000],
    ]),
    3: new LerpLookupTable([
      [21_900, 1_750],
      [21_900, 2_000],
      [20_500, 2_500],
    ]),
  };

  /** Minimum takeoff weight for each config on runways contaminated with 12.7 mm/1/2" of water. */
  private static minCorrectedTowContaminated13mmWater: Record<number, number> = {
    1: 53_300,
    2: 53_300,
    3: 56_500,
  };

  /**
   * MTOW for runways contaminated with 12.7 mm/1/2" of water.
   * Maps corrected weight in kg to MTOW in kg.
   */
  private static readonly mtowContaminated13mmWater: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [47_600, 53_300],
      [51_000, 54_000],
      [54_800, 54_800],
      [79_000, 79_000],
    ]),
    2: new LerpLookupTable([
      [47_600, 53_300],
      [51_000, 54_000],
      [54_700, 54_700],
      [79_000, 79_000],
    ]),
    3: new LerpLookupTable([
      [47_600, 56_500],
      [59_000, 59_000],
      [79_000, 79_000],
    ]),
  };

  /**
   * V-Speeds for runways contaminated with 12.7 mm/1/2" of water.
   * Maps actual takeoff weight in kg to v1, vr, v2 in knots.
   */
  private static readonly vSpeedsContaminated13mmWater: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [Vec3Math.create(122, 125, 127), 47_600],
      [Vec3Math.create(122, 127, 129), 49_000],
      [Vec3Math.create(122, 133, 135), 54_000],
      [Vec3Math.create(122, 134, 136), 54_800],
      [Vec3Math.create(127, 139, 141), 59_000],
      [Vec3Math.create(133, 145, 147), 64_000],
      [Vec3Math.create(132, 151, 153), 69_000],
      [Vec3Math.create(144, 156, 158), 74_000],
      [Vec3Math.create(149, 161, 163), 79_000],
    ]),
    2: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(122, 135, 136), 54_700],
      [Vec3Math.create(128, 141, 142), 59_000],
      [Vec3Math.create(133, 146, 147), 64_000],
      [Vec3Math.create(139, 152, 153), 69_000],
      [Vec3Math.create(145, 158, 159), 74_000],
      [Vec3Math.create(150, 163, 164), 79_000],
    ]),
    3: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 126), 47_600],
      [Vec3Math.create(122, 128, 128), 49_000],
      [Vec3Math.create(122, 134, 134), 54_000],
      [Vec3Math.create(122, 140, 140), 59_000],
      [Vec3Math.create(128, 146, 146), 64_000],
      [Vec3Math.create(134, 152, 152), 69_000],
      [Vec3Math.create(140, 158, 158), 74_000],
      [Vec3Math.create(145, 163, 163), 79_000],
    ]),
  };

  /**
   * Weight Correction for runways contaminated with 6.3 mm/1/4" of slush.
   * Maps runway length in metres to weight correction in kg.
   * Note: no clearway figures used, as MSFS can't tell us if there's a clearway.
   */
  private static readonly weightCorrectionContaminated6mmSlush: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [15_400, 2_500],
      [14_200, 3_000],
      [10_400, 3_500],
      [6_600, 4_000],
    ]),
    2: new LerpLookupTable([
      [17_900, 2_000],
      [17_800, 2_500],
      [15_500, 3_000],
    ]),
    3: new LerpLookupTable([
      [19_200, 1_750],
      [19_000, 2_000],
      [17_200, 2_500],
    ]),
  };

  /** Minimum takeoff weight for each config on runways contaminated with 6.3 mm/1/4" of slush. */
  private static minCorrectedTowContaminated6mmSlush: Record<number, number> = {
    1: 57_200,
    2: 56_200,
    3: 53_300,
  };

  /**
   * MTOW for runways contaminated with 6.3 mm/1/4" of slush.
   * Maps corrected weight in kg to MTOW in kg.
   */
  private static readonly mtowContaminated6mmSlush: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [47_600, 57_200],
      [56_000, 59_000],
      [59_800, 59_800],
      [79_000, 79_000],
    ]),
    2: new LerpLookupTable([
      [47_600, 56_200],
      [56_000, 59_000],
      [79_000, 79_000],
    ]),
    3: new LerpLookupTable([
      [47_600, 53_300],
      [51_000, 54_000],
      [54_800, 54_800],
      [79_000, 79_000],
    ]),
  };

  /**
   * V-Speeds for runways contaminated with 6.3 mm/1/4" of slush.
   * Maps actual takeoff weight in kg to v1, vr, v2 in knots.
   */
  private static readonly vSpeedsContaminated6mmSlush: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [Vec3Math.create(122, 125, 127), 47_600],
      [Vec3Math.create(122, 127, 129), 49_000],
      [Vec3Math.create(122, 133, 135), 54_000],
      [Vec3Math.create(127, 139, 141), 59_000],
      [Vec3Math.create(127, 140, 142), 59_800],
      [Vec3Math.create(127, 145, 147), 64_000],
      [Vec3Math.create(133, 151, 153), 69_000],
      [Vec3Math.create(138, 156, 158), 74_000],
      [Vec3Math.create(143, 161, 163), 79_000],
    ]),
    2: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(122, 140, 141), 58_300],
      [Vec3Math.create(123, 141, 142), 59_000],
      [Vec3Math.create(128, 146, 147), 64_000],
      [Vec3Math.create(134, 152, 153), 69_000],
      [Vec3Math.create(140, 158, 159), 74_000],
      [Vec3Math.create(145, 163, 164), 79_000],
    ]),
    3: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 126), 47_600],
      [Vec3Math.create(122, 128, 128), 49_000],
      [Vec3Math.create(122, 134, 134), 54_000],
      [Vec3Math.create(122, 135, 135), 54_800],
      [Vec3Math.create(127, 140, 140), 59_000],
      [Vec3Math.create(133, 146, 146), 64_000],
      [Vec3Math.create(139, 152, 152), 69_000],
      [Vec3Math.create(145, 158, 158), 74_000],
      [Vec3Math.create(150, 163, 163), 79_000],
    ]),
  };

  /**
   * Weight Correction for runways contaminated with 12.7 mm/1/2" of slush.
   * Maps runway length in metres to weight correction in kg.
   * Note: no clearway figures used, as MSFS can't tell us if there's a clearway.
   */
  private static readonly weightCorrectionContaminated13mmSlush: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [19_400, 2_500],
      [17_800, 3_000],
      [13_700, 3_500],
      [10_000, 4_000],
    ]),
    2: new LerpLookupTable([
      [22_000, 2_000],
      [21_600, 2_500],
      [18_800, 3_000],
    ]),
    3: new LerpLookupTable([
      [18_200, 1_750],
      [22_600, 2_000],
      [20_900, 2_500],
    ]),
  };

  /** Minimum takeoff weight for each config on runways contaminated with 12.7 mm/1/2" of slush. */
  private static minCorrectedTowContaminated13mmSlush: Record<number, number> = {
    1: 52_600,
    2: 52_000,
    3: 52_000,
  };

  /**
   * MTOW for runways contaminated with 12.7 mm/1/2" of slush.
   * Maps corrected weight in kg to MTOW in kg.
   */
  private static readonly mtowContaminated13mmSlush: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [47_600, 52_600],
      [54_000, 54_000],
      [79_000, 79_000],
    ]),
    2: new LerpLookupTable([
      [47_600, 52_000],
      [53_200, 53_200],
      [79_000, 79_000],
    ]),
    3: new LerpLookupTable([
      [47_600, 52_000],
      [53_200, 53_200],
      [79_000, 79_000],
    ]),
  };

  /**
   * V-Speeds for runways contaminated with 12.7 mm/1/2" of slush.
   * Maps actual takeoff weight in kg to v1, vr, v2 in knots.
   */
  private static readonly vSpeedsContaminated13mmSlush: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(128, 140, 141), 59_000],
      [Vec3Math.create(134, 146, 147), 64_000],
      [Vec3Math.create(140, 152, 153), 69_000],
      [Vec3Math.create(145, 157, 158), 74_000],
      [Vec3Math.create(150, 162, 163), 79_000],
    ]),
    2: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 133, 134), 53_200],
      [Vec3Math.create(123, 134, 135), 54_000],
      [Vec3Math.create(130, 141, 142), 59_000],
      [Vec3Math.create(135, 146, 147), 64_000],
      [Vec3Math.create(141, 152, 153), 69_000],
      [Vec3Math.create(147, 158, 159), 74_000],
      [Vec3Math.create(152, 163, 164), 79_000],
    ]),
    3: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 126), 47_600],
      [Vec3Math.create(122, 128, 128), 49_000],
      [Vec3Math.create(122, 133, 133), 53_200],
      [Vec3Math.create(123, 134, 134), 54_000],
      [Vec3Math.create(129, 140, 140), 59_000],
      [Vec3Math.create(135, 146, 146), 64_000],
      [Vec3Math.create(141, 152, 152), 69_000],
      [Vec3Math.create(147, 158, 158), 74_000],
      [Vec3Math.create(152, 163, 163), 79_000],
    ]),
  };

  /**
   * Weight Correction for runways contaminated with compacted snow.
   * Maps runway length in metres to weight correction in kg.
   * Note: no clearway figures used, as MSFS can't tell us if there's a clearway.
   */
  private static readonly weightCorrectionContaminatedCompactedSnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [10_200, 2_500],
      [9_000, 3_000],
      [4_700, 3_500],
      [3_000, 4_000],
    ]),
    2: new LerpLookupTable([
      [13_300, 2_000],
      [12_700, 2_500],
      [10_300, 3_000],
    ]),
    3: new LerpLookupTable([
      [15_100, 1_750],
      [14_800, 2_000],
      [12_700, 2_500],
    ]),
  };

  /** Minimum takeoff weight for each config on runways contaminated with compacted snow. */
  private static minCorrectedTowContaminatedCompactedSnow: Record<number, number> = {
    1: 57_200,
    2: 56_200,
    3: 56_500,
  };

  /**
   * MTOW for runways contaminated with compacted snow.
   * Maps corrected weight in kg to MTOW in kg.
   */
  private static readonly mtowContaminatedCompactedSnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [47_600, 57_200],
      [56_000, 59_000],
      [59_800, 59_800],
      [79_000, 79_000],
    ]),
    2: new LerpLookupTable([
      [47_600, 56_200],
      [58_300, 58_300],
      [79_000, 79_000],
    ]),
    3: new LerpLookupTable([
      [47_600, 56_500],
      [59_000, 59_000],
      [79_000, 79_000],
    ]),
  };

  /**
   * V-Speeds for runways contaminated with compacted snow.
   * Maps actual takeoff weight in kg to v1, vr, v2 in knots.
   */
  private static readonly vSpeedsContaminatedCompactedSnow: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(122, 140, 141), 59_000],
      [Vec3Math.create(122, 141, 142), 59_800],
      [Vec3Math.create(127, 146, 147), 64_000],
      [Vec3Math.create(133, 152, 153), 69_000],
      [Vec3Math.create(138, 157, 158), 74_000],
      [Vec3Math.create(143, 162, 163), 79_000],
    ]),
    2: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(122, 140, 141), 58_300],
      [Vec3Math.create(123, 141, 142), 59_000],
      [Vec3Math.create(128, 146, 147), 64_000],
      [Vec3Math.create(134, 152, 153), 69_000],
      [Vec3Math.create(140, 158, 159), 74_000],
      [Vec3Math.create(145, 163, 164), 79_000],
    ]),
    3: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 126), 47_600],
      [Vec3Math.create(122, 128, 128), 49_000],
      [Vec3Math.create(122, 134, 134), 54_000],
      [Vec3Math.create(122, 140, 140), 59_000],
      [Vec3Math.create(128, 146, 146), 64_000],
      [Vec3Math.create(134, 152, 152), 69_000],
      [Vec3Math.create(140, 158, 158), 74_000],
      [Vec3Math.create(145, 163, 163), 79_000],
    ]),
  };

  /**
   * Weight Correction for runways contaminated with 5 mm/1/5" of wet snow.
   * Maps runway length in metres to weight correction in kg.
   * Note: no clearway figures used, as MSFS can't tell us if there's a clearway.
   */
  private static readonly weightCorrectionContaminated5mmWetSnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [11_400, 2_500],
      [10_500, 3_000],
      [6_000, 3_500],
      [3_000, 4_000],
    ]),
    2: new LerpLookupTable([
      [15_000, 2_000],
      [14_200, 2_500],
      [11_900, 3_000],
    ]),
    3: new LerpLookupTable([
      [17_500, 1_750],
      [17_100, 2_000],
      [14_300, 2_500],
    ]),
  };

  /** Minimum takeoff weight for each config on runways contaminated with 5 mm/1/5" of wet snow. */
  private static minCorrectedTowContaminated5mmWetSnow: Record<number, number> = {
    1: 56_500,
    2: 57_400,
    3: 57_800,
  };

  /**
   * MTOW for runways contaminated with 5 mm/1/5" of wet snow.
   * Maps corrected weight in kg to MTOW in kg.
   */
  private static readonly mtowContaminated5mmWetSnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [47_600, 56_500],
      [59_000, 59_000],
      [79_000, 79_000],
    ]),
    2: new LerpLookupTable([
      [47_600, 57_400],
      [56_000, 59_000],
      [60_000, 60_000],
      [79_000, 79_000],
    ]),
    3: new LerpLookupTable([
      [47_600, 57_800],
      [53_000, 59_000],
      [60_700, 60_700],
      [79_000, 79_000],
    ]),
  };

  /**
   * V-Speeds for runways contaminated with 5 mm/1/5" of wet snow.
   * Maps actual takeoff weight in kg to v1, vr, v2 in knots.
   */
  private static readonly vSpeedsContaminated5mmWetSnow: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(122, 140, 141), 59_000],
      [Vec3Math.create(128, 146, 147), 64_000],
      [Vec3Math.create(134, 152, 153), 69_000],
      [Vec3Math.create(139, 157, 158), 74_000],
      [Vec3Math.create(144, 162, 163), 79_000],
    ]),
    2: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(122, 141, 142), 59_000],
      [Vec3Math.create(122, 142, 143), 60_000],
      [Vec3Math.create(126, 146, 147), 64_000],
      [Vec3Math.create(132, 152, 153), 69_000],
      [Vec3Math.create(138, 158, 159), 74_000],
      [Vec3Math.create(143, 163, 164), 79_000],
    ]),
    3: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 126), 47_600],
      [Vec3Math.create(122, 128, 128), 49_000],
      [Vec3Math.create(122, 134, 134), 54_000],
      [Vec3Math.create(122, 140, 140), 59_000],
      [Vec3Math.create(122, 142, 142), 60_700],
      [Vec3Math.create(126, 146, 146), 64_000],
      [Vec3Math.create(132, 152, 152), 69_000],
      [Vec3Math.create(138, 158, 158), 74_000],
      [Vec3Math.create(143, 163, 163), 79_000],
    ]),
  };

  /**
   * Weight Correction for runways contaminated with 15 mm/3/5" of wet snow.
   * Maps runway length in metres to weight correction in kg.
   * Note: no clearway figures used, as MSFS can't tell us if there's a clearway.
   */
  private static readonly weightCorrectionContaminated15mmWetSnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [16_300, 2_500],
      [14_900, 3_000],
      [10_900, 3_500],
      [7_100, 4_000],
    ]),
    2: new LerpLookupTable([
      [19_000, 2_000],
      [18_700, 2_500],
      [16_100, 3_000],
    ]),
    3: new LerpLookupTable([
      [20_200, 1_750],
      [20_000, 2_000],
      [18_100, 2_500],
    ]),
  };

  /** Minimum takeoff weight for each config on runways contaminated with 15 mm/3/5" of wet snow. */
  private static minCorrectedTowContaminated15mmWetSnow: Record<number, number> = {
    1: 53_900,
    2: 53_300,
    3: 53_300,
  };

  /**
   * MTOW for runways contaminated with 15 mm/3/5" of wet snow.
   * Maps corrected weight in kg to MTOW in kg.
   */
  private static readonly mtowContaminated15mmWetSnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [47_600, 53_900],
      [48_000, 54_000],
      [55_700, 55_700],
      [79_000, 79_000],
    ]),
    2: new LerpLookupTable([
      [47_600, 53_300],
      [51_000, 54_000],
      [54_700, 54_700],
      [79_000, 79_000],
    ]),
    3: new LerpLookupTable([
      [47_600, 53_300],
      [51_000, 54_000],
      [54_800, 54_800],
      [79_000, 79_000],
    ]),
  };

  /**
   * V-Speeds for runways contaminated with 15 mm/3/5" of wet snow.
   * Maps actual takeoff weight in kg to v1, vr, v2 in knots.
   */
  private static readonly vSpeedsContaminated15mmWetSnow: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(122, 136, 137), 55_700],
      [Vec3Math.create(126, 140, 141), 59_000],
      [Vec3Math.create(132, 146, 147), 64_000],
      [Vec3Math.create(138, 152, 153), 69_000],
      [Vec3Math.create(143, 157, 158), 74_000],
      [Vec3Math.create(148, 162, 163), 79_000],
    ]),
    2: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(122, 135, 136), 54_700],
      [Vec3Math.create(128, 141, 142), 59_000],
      [Vec3Math.create(133, 146, 147), 64_000],
      [Vec3Math.create(139, 152, 153), 69_000],
      [Vec3Math.create(145, 158, 159), 74_000],
      [Vec3Math.create(150, 163, 164), 79_000],
    ]),
    3: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 126), 47_600],
      [Vec3Math.create(122, 128, 128), 49_000],
      [Vec3Math.create(122, 134, 134), 54_000],
      [Vec3Math.create(122, 135, 135), 54_800],
      [Vec3Math.create(127, 140, 140), 59_000],
      [Vec3Math.create(133, 146, 146), 64_000],
      [Vec3Math.create(139, 152, 152), 69_000],
      [Vec3Math.create(145, 158, 158), 74_000],
      [Vec3Math.create(150, 163, 163), 79_000],
    ]),
  };

  /**
   * Weight Correction for runways contaminated with 30 mm/6/5" of wet snow.
   * Maps runway length in metres to weight correction in kg.
   * Note: no clearway figures used, as MSFS can't tell us if there's a clearway.
   */
  private static readonly weightCorrectionContaminated30mmWetSnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [23_000, 2_500],
      [21_100, 3_000],
      [19_200, 3_500],
      [19_200, 4_000],
    ]),
    2: new LerpLookupTable([
      [24_700, 2_000],
      [24_400, 2_500],
      [22_400, 3_000],
    ]),
    3: new LerpLookupTable([
      [25_200, 1_750],
      [25_000, 2_000],
      [23_700, 2_500],
    ]),
  };

  /** Minimum takeoff weight for each config on runways contaminated with 30 mm/6/5" of wet snow. */
  private static minCorrectedTowContaminated30mmWetSnow: Record<number, number> = {
    1: 48_100,
    2: 47_600,
    3: 47_600,
  };

  /**
   * MTOW for runways contaminated with 30 mm/6/5" of wet snow.
   * Maps corrected weight in kg to MTOW in kg.
   */
  private static readonly mtowContaminated30mmWetSnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [47_600, 48_100],
      [48_300, 48_300],
      [79_000, 79_000],
    ]),
    2: new LerpLookupTable([
      [47_600, 47_600],
      [79_000, 79_000],
    ]),
    3: new LerpLookupTable([
      [47_600, 47_600],
      [79_000, 79_000],
    ]),
  };

  /**
   * V-Speeds for runways contaminated with 30 mm/6/5" of wet snow.
   * Maps actual takeoff weight in kg to v1, vr, v2 in knots.
   */
  private static readonly vSpeedsContaminated30mmWetSnow: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 127, 128), 48_300],
      [Vec3Math.create(123, 128, 129), 49_000],
      [Vec3Math.create(130, 134, 135), 54_000],
      [Vec3Math.create(137, 141, 142), 59_000],
      [Vec3Math.create(142, 146, 147), 64_000],
      [Vec3Math.create(148, 152, 153), 69_000],
      [Vec3Math.create(154, 158, 159), 74_000],
      [Vec3Math.create(159, 163, 164), 79_000],
    ]),
    2: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(124, 128, 129), 49_000],
      [Vec3Math.create(130, 134, 135), 54_000],
      [Vec3Math.create(137, 141, 142), 59_000],
      [Vec3Math.create(142, 146, 147), 64_000],
      [Vec3Math.create(148, 152, 153), 69_000],
      [Vec3Math.create(154, 158, 159), 74_000],
      [Vec3Math.create(159, 163, 164), 79_000],
    ]),
    3: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 126), 47_600],
      [Vec3Math.create(124, 128, 128), 49_000],
      [Vec3Math.create(130, 134, 134), 54_000],
      [Vec3Math.create(136, 140, 140), 59_000],
      [Vec3Math.create(142, 146, 146), 64_000],
      [Vec3Math.create(148, 152, 152), 69_000],
      [Vec3Math.create(154, 158, 158), 74_000],
      [Vec3Math.create(159, 163, 163), 79_000],
    ]),
  };

  /**
   * Weight Correction for runways contaminated with 10 mm/2/5" of dry snow.
   * Maps runway length in metres to weight correction in kg.
   * Note: no clearway figures used, as MSFS can't tell us if there's a clearway.
   */
  private static readonly weightCorrectionContaminated10mmDrySnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [11_400, 2_500],
      [10_500, 3_000],
      [6_000, 3_500],
      [3_000, 4_000],
    ]),
    2: new LerpLookupTable([
      [15_000, 2_000],
      [14_200, 2_500],
      [11_800, 3_000],
    ]),
    3: new LerpLookupTable([
      [17_500, 1_750],
      [17_100, 2_000],
      [14_300, 2_500],
    ]),
  };

  /** Minimum takeoff weight for each config on runways contaminated with 10 mm/2/5" of dry snow. */
  private static minCorrectedTowContaminated10mmDrySnow: Record<number, number> = {
    1: 56_500,
    2: 57_400,
    3: 57_800,
  };

  /**
   * MTOW for runways contaminated with 10 mm/2/5" of dry snow.
   * Maps corrected weight in kg to MTOW in kg.
   */
  private static readonly mtowContaminated10mmDrySnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [47_600, 56_500],
      [59_000, 59_000],
      [79_000, 79_000],
    ]),
    2: new LerpLookupTable([
      [47_600, 57_400],
      [56_000, 59_000],
      [60_000, 60_000],
      [79_000, 79_000],
    ]),
    3: new LerpLookupTable([
      [47_600, 57_800],
      [53_000, 59_000],
      [60_700, 60_700],
      [79_000, 79_000],
    ]),
  };

  /**
   * V-Speeds for runways contaminated with 10 mm/2/5" of dry snow.
   * Maps actual takeoff weight in kg to v1, vr, v2 in knots.
   */
  private static readonly vSpeedsContaminated10mmDrySnow: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(122, 140, 141), 59_000],
      [Vec3Math.create(128, 146, 147), 64_000],
      [Vec3Math.create(134, 152, 153), 69_000],
      [Vec3Math.create(139, 157, 158), 74_000],
      [Vec3Math.create(144, 162, 163), 79_000],
    ]),
    2: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(122, 134, 135), 54_000],
      [Vec3Math.create(122, 141, 142), 59_000],
      [Vec3Math.create(122, 142, 143), 60_000],
      [Vec3Math.create(126, 146, 147), 64_000],
      [Vec3Math.create(132, 152, 153), 69_000],
      [Vec3Math.create(138, 158, 159), 74_000],
      [Vec3Math.create(143, 163, 164), 79_000],
    ]),
    3: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 126), 47_600],
      [Vec3Math.create(122, 128, 128), 49_000],
      [Vec3Math.create(122, 134, 134), 54_000],
      [Vec3Math.create(122, 140, 140), 59_000],
      [Vec3Math.create(122, 142, 142), 60_700],
      [Vec3Math.create(126, 146, 146), 64_000],
      [Vec3Math.create(132, 152, 152), 69_000],
      [Vec3Math.create(138, 158, 158), 74_000],
      [Vec3Math.create(143, 163, 163), 79_000],
    ]),
  };

  /**
   * Weight Correction for runways contaminated with 100 mm/4" of dry snow.
   * Maps runway length in metres to weight correction in kg.
   * Note: no clearway figures used, as MSFS can't tell us if there's a clearway.
   */
  private static readonly weightCorrectionContaminated100mmDrySnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [19_300, 2_500],
      [19_600, 3_000],
      [17_500, 3_500],
      [15_800, 4_000],
    ]),
    2: new LerpLookupTable([
      [21_100, 2_000],
      [22_000, 2_500],
      [21_400, 3_000],
    ]),
    3: new LerpLookupTable([
      [22_100, 1_750],
      [22_300, 2_000],
      [21_800, 2_500],
    ]),
  };

  /** Minimum takeoff weight for each config on runways contaminated with 100 mm/4" of dry snow. */
  private static minCorrectedTowContaminated100mmDrySnow: Record<number, number> = {
    1: 48_700,
    2: 48_300,
    3: 48_700,
  };

  /**
   * MTOW for runways contaminated with 100 mm/4" of dry snow.
   * Maps corrected weight in kg to MTOW in kg.
   */
  private static readonly mtowContaminated100mmDrySnow: Record<number, LerpLookupTable> = {
    1: new LerpLookupTable([
      [47_600, 48_700],
      [49_000, 49_000],
      [79_000, 79_000],
    ]),
    2: new LerpLookupTable([
      [47_600, 48_100],
      [48_300, 48_300],
      [79_000, 79_000],
    ]),
    3: new LerpLookupTable([
      [47_600, 48_700],
      [49_000, 49_000],
      [79_000, 79_000],
    ]),
  };

  /**
   * V-Speeds for runways contaminated with 100 mm/4" of dry snow.
   * Maps actual takeoff weight in kg to v1, vr, v2 in knots.
   */
  private static readonly vSpeedsContaminated100mmDrySnow: Record<number, LerpVectorLookupTable> = {
    1: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 128, 129), 49_000],
      [Vec3Math.create(128, 134, 135), 54_000],
      [Vec3Math.create(134, 140, 141), 59_000],
      [Vec3Math.create(140, 146, 147), 64_000],
      [Vec3Math.create(146, 152, 153), 69_000],
      [Vec3Math.create(151, 157, 158), 74_000],
      [Vec3Math.create(156, 162, 163), 79_000],
    ]),
    2: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 127), 47_600],
      [Vec3Math.create(122, 127, 128), 48_300],
      [Vec3Math.create(123, 128, 129), 49_000],
      [Vec3Math.create(129, 134, 135), 54_000],
      [Vec3Math.create(136, 141, 142), 59_000],
      [Vec3Math.create(141, 146, 147), 64_000],
      [Vec3Math.create(147, 152, 153), 69_000],
      [Vec3Math.create(153, 158, 159), 74_000],
      [Vec3Math.create(158, 163, 164), 79_000],
    ]),
    3: new LerpVectorLookupTable([
      [Vec3Math.create(122, 126, 126), 47_600],
      [Vec3Math.create(122, 128, 128), 49_000],
      [Vec3Math.create(128, 134, 134), 54_000],
      [Vec3Math.create(134, 140, 140), 59_000],
      [Vec3Math.create(140, 146, 146), 64_000],
      [Vec3Math.create(146, 152, 152), 69_000],
      [Vec3Math.create(152, 158, 158), 74_000],
      [Vec3Math.create(157, 163, 163), 79_000],
    ]),
  };

  public getCrosswindLimit(runwayCondition: RunwayCondition, oat: number): number {
    switch (runwayCondition) {
      case RunwayCondition.Dry:
      case RunwayCondition.Wet:
        return 35;
      case RunwayCondition.ContaminatedCompactedSnow:
        return oat <= -15 ? 29 : 25;
      case RunwayCondition.Contaminated10mmDrySnow:
      case RunwayCondition.Contaminated100mmDrySnow:
      case RunwayCondition.Contaminated5mmWetSnow:
      case RunwayCondition.Contaminated15mmWetSnow:
      case RunwayCondition.Contaminated30mmWetSnow:
        return 25;
      case RunwayCondition.Contaminated6mmWater:
      case RunwayCondition.Contaminated13mmWater:
      case RunwayCondition.Contaminated6mmSlush:
      case RunwayCondition.Contaminated13mmSlush:
        return 20;
    }
  }

  private checkInputs(inputs: TakeoffPerformanceInputs, params: TakeoffPerformanceParameters): TakeoffPerfomanceError {
    if (inputs.conf !== 1 && inputs.conf !== 2 && inputs.conf !== 3) {
      return TakeoffPerfomanceError.InvalidData;
    }
    if (inputs.tow > this.structuralMtow) {
      return TakeoffPerfomanceError.StructuralMtow;
    }
    if (params.pressureAlt > this.maxPressureAlt) {
      return TakeoffPerfomanceError.MaximumPressureAlt;
    }
    if (inputs.oat > params.tMax) {
      return TakeoffPerfomanceError.MaximumTemperature;
    }
    if (inputs.tow < this.oew) {
      return TakeoffPerfomanceError.OperatingEmptyWeight;
    }
    if (inputs.cg !== undefined && !this.isCgWithinLimits(inputs.cg, inputs.tow)) {
      return TakeoffPerfomanceError.CgOutOfLimits;
    }
    if (inputs.wind < -this.maxTailwind) {
      return TakeoffPerfomanceError.MaximumTailwind;
    }
    if (Math.abs(inputs.slope) > 2) {
      return TakeoffPerfomanceError.MaximumRunwaySlope;
    }

    return TakeoffPerfomanceError.None;
  }

  private isContaminated(runwayCondition: RunwayCondition): boolean {
    return runwayCondition !== RunwayCondition.Dry && runwayCondition !== RunwayCondition.Wet;
  }

  /** @inheritdoc */
  public calculateTakeoffPerformance(
    tow: number,
    forwardCg: boolean,
    conf: number,
    tora: number,
    slope: number,
    lineupAngle: LineupAngle,
    wind: number,
    elevation: number,
    qnh: number,
    oat: number,
    antiIce: TakeoffAntiIceSetting,
    packs: boolean,
    forceToga: boolean,
    runwayCondition: RunwayCondition,
    cg?: number,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    out?: Partial<TakeoffPerformanceResult>,
  ): TakeoffPerformanceResult {
    const result: Partial<TakeoffPerformanceResult> = {}; // out === undefined ? {} : out;
    result.inputs = {
      tow,
      forwardCg,
      cg,
      conf,
      tora,
      slope,
      lineupAngle,
      wind,
      elevation,
      qnh,
      oat,
      antiIce,
      packs,
      forceToga,
      runwayCondition,
    };

    const isaTemp = this.calculateIsaTemp(elevation);
    const tRef = this.calculateTref(elevation);
    const pressureAlt = this.calculatePressureAltitude(elevation, qnh);
    const tMax = this.calculateTmax(pressureAlt);
    const tFlexMax = this.calculateTflexMax(isaTemp);
    // headwind credit is limited to 45 knots
    const headwind = Math.min(this.maxHeadwind, wind);

    result.params = {
      adjustedTora: tora - (A320251NTakeoffPerformanceCalculator.lineUpDistances[lineupAngle] ?? 0),
      pressureAlt,
      isaTemp,
      tRef,
      tMax,
      tFlexMax,
      headwind,
    };

    result.error = this.checkInputs(result.inputs, result.params);

    if (result.error === TakeoffPerfomanceError.None) {
      result.limits = {
        [LimitingFactor.Runway]: this.calculateWeightLimits(LimitingFactor.Runway, result),
        [LimitingFactor.SecondSegment]: this.calculateWeightLimits(LimitingFactor.SecondSegment, result),
        [LimitingFactor.BrakeEnergy]: this.calculateWeightLimits(LimitingFactor.BrakeEnergy, result),
        [LimitingFactor.Vmcg]: this.calculateWeightLimits(LimitingFactor.Vmcg, result),
      };

      result.oatLimitingFactor = this.getLimitingFactor('oatLimit', result);
      result.tRefLimitingFactor = this.getLimitingFactor('tRefLimit', result);
      result.tMaxLimitingFactor = this.getLimitingFactor('tMaxLimit', result);
      result.tFlexMaxLimitingFactor = this.getLimitingFactor('tFlexMaxLimit', result);

      const dryMtow = result.limits[result.tRefLimitingFactor].oatLimit!;
      result.tvmcg = this.calculateTvmcg(result.inputs, result.params);

      let mtow: number;
      if (runwayCondition === RunwayCondition.Dry) {
        mtow = dryMtow;
      } else if (runwayCondition === RunwayCondition.Wet) {
        const factors: ReadonlyFloat64Array = (
          result.inputs.oat > result.tvmcg
            ? A320251NTakeoffPerformanceCalculator.wetTowAdjustmentFactorsAboveTvmcg
            : A320251NTakeoffPerformanceCalculator.wetTowAdjustmentFactorsAtOrBelowTvmcg
        )[result.inputs.conf].get(A320251NTakeoffPerformanceCalculator.vec4Cache, result.params.headwind);

        const lengthAltCoef = result.params.adjustedTora - result.params.pressureAlt / 20;
        const wetMtowAdjustment = Math.min(
          0,
          factors[0] * lengthAltCoef + factors[1],
          factors[2] * lengthAltCoef + factors[3],
        );
        mtow = dryMtow - wetMtowAdjustment;
      } else {
        let correctionFactors: Record<number, LerpLookupTable>;
        let mtowFactors: Record<number, LerpLookupTable>;
        let minCorrectedWeight: Record<number, number>;
        switch (runwayCondition) {
          case RunwayCondition.Contaminated6mmWater:
            correctionFactors = A320251NTakeoffPerformanceCalculator.weightCorrectionContaminated6mmWater;
            mtowFactors = A320251NTakeoffPerformanceCalculator.mtowContaminated6mmWater;
            minCorrectedWeight = A320251NTakeoffPerformanceCalculator.minCorrectedTowContaminated6mmWater;
            break;
          case RunwayCondition.Contaminated13mmWater:
            correctionFactors = A320251NTakeoffPerformanceCalculator.weightCorrectionContaminated13mmWater;
            mtowFactors = A320251NTakeoffPerformanceCalculator.mtowContaminated13mmWater;
            minCorrectedWeight = A320251NTakeoffPerformanceCalculator.minCorrectedTowContaminated13mmWater;
            break;
          case RunwayCondition.Contaminated6mmSlush:
            correctionFactors = A320251NTakeoffPerformanceCalculator.weightCorrectionContaminated6mmSlush;
            mtowFactors = A320251NTakeoffPerformanceCalculator.mtowContaminated6mmSlush;
            minCorrectedWeight = A320251NTakeoffPerformanceCalculator.minCorrectedTowContaminated6mmSlush;
            break;
          case RunwayCondition.Contaminated13mmSlush:
            correctionFactors = A320251NTakeoffPerformanceCalculator.weightCorrectionContaminated13mmSlush;
            mtowFactors = A320251NTakeoffPerformanceCalculator.mtowContaminated13mmSlush;
            minCorrectedWeight = A320251NTakeoffPerformanceCalculator.minCorrectedTowContaminated13mmSlush;
            break;
          case RunwayCondition.ContaminatedCompactedSnow:
            correctionFactors = A320251NTakeoffPerformanceCalculator.weightCorrectionContaminatedCompactedSnow;
            mtowFactors = A320251NTakeoffPerformanceCalculator.mtowContaminatedCompactedSnow;
            minCorrectedWeight = A320251NTakeoffPerformanceCalculator.minCorrectedTowContaminatedCompactedSnow;
            break;
          case RunwayCondition.Contaminated5mmWetSnow:
            correctionFactors = A320251NTakeoffPerformanceCalculator.weightCorrectionContaminated5mmWetSnow;
            mtowFactors = A320251NTakeoffPerformanceCalculator.mtowContaminated5mmWetSnow;
            minCorrectedWeight = A320251NTakeoffPerformanceCalculator.minCorrectedTowContaminated5mmWetSnow;
            break;
          case RunwayCondition.Contaminated15mmWetSnow:
            correctionFactors = A320251NTakeoffPerformanceCalculator.weightCorrectionContaminated15mmWetSnow;
            mtowFactors = A320251NTakeoffPerformanceCalculator.mtowContaminated15mmWetSnow;
            minCorrectedWeight = A320251NTakeoffPerformanceCalculator.minCorrectedTowContaminated15mmWetSnow;
            break;
          case RunwayCondition.Contaminated30mmWetSnow:
            correctionFactors = A320251NTakeoffPerformanceCalculator.weightCorrectionContaminated30mmWetSnow;
            mtowFactors = A320251NTakeoffPerformanceCalculator.mtowContaminated30mmWetSnow;
            minCorrectedWeight = A320251NTakeoffPerformanceCalculator.minCorrectedTowContaminated30mmWetSnow;
            break;
          case RunwayCondition.Contaminated10mmDrySnow:
            correctionFactors = A320251NTakeoffPerformanceCalculator.weightCorrectionContaminated10mmDrySnow;
            mtowFactors = A320251NTakeoffPerformanceCalculator.mtowContaminated10mmDrySnow;
            minCorrectedWeight = A320251NTakeoffPerformanceCalculator.minCorrectedTowContaminated10mmDrySnow;
            break;
          case RunwayCondition.Contaminated100mmDrySnow:
            correctionFactors = A320251NTakeoffPerformanceCalculator.weightCorrectionContaminated100mmDrySnow;
            mtowFactors = A320251NTakeoffPerformanceCalculator.mtowContaminated100mmDrySnow;
            minCorrectedWeight = A320251NTakeoffPerformanceCalculator.minCorrectedTowContaminated100mmDrySnow;
            break;
          default:
            throw new Error('Invalid runway condition');
        }

        const correctedWeight = dryMtow - correctionFactors[result.inputs.conf].get(result.params.adjustedTora);
        mtow = mtowFactors[result.inputs.conf].get(correctedWeight);

        const minimumTow = minCorrectedWeight[result.inputs.conf];
        if (correctedWeight < minimumTow) {
          result.error = TakeoffPerfomanceError.TooLight;
        }
      }
      result.mtow = mtow;

      const applyForwardCgWeightCorrection =
        forwardCg &&
        (result.oatLimitingFactor === LimitingFactor.Runway || result.oatLimitingFactor === LimitingFactor.Vmcg);
      const applyForwardCgSpeedCorrection = applyForwardCgWeightCorrection && mtow <= 73_000;

      if (applyForwardCgWeightCorrection) {
        const cgFactors = A320251NTakeoffPerformanceCalculator.cgFactors[conf];
        mtow += Math.max(0, cgFactors[0] * mtow + cgFactors[1]);
      }

      if (mtow >= tow) {
        result.flex = undefined;

        let needVSpeedCalculated = true;
        if (forceToga) {
          // find the speeds for a flex takeoff with 15 knot tailwind
          const tailwindResult = this.calculateTakeoffPerformance(
            tow,
            forwardCg,
            conf,
            tora,
            slope,
            lineupAngle,
            -15,
            elevation,
            qnh,
            oat,
            antiIce,
            packs,
            false,
            runwayCondition,
            cg,
            A320251NTakeoffPerformanceCalculator.resultCache,
          );

          if (tailwindResult.error === TakeoffPerfomanceError.None) {
            needVSpeedCalculated = false;
            result.v1 = tailwindResult.v1;
            result.vR = tailwindResult.vR;
            result.v2 = tailwindResult.v2;
            result.intermediateSpeeds = tailwindResult.intermediateSpeeds
              ? { ...tailwindResult.intermediateSpeeds }
              : undefined;
          } // else we use the higher speeds below...
        } else if (!this.isContaminated(result.inputs.runwayCondition)) {
          [result.flex, result.params.flexLimitingFactor] = this.calculateFlexTemp(result, result.tvmcg);
        }

        if (needVSpeedCalculated) {
          this.calculateVSpeeds(result, applyForwardCgSpeedCorrection, result.tvmcg);
        }
      } else {
        result.error = TakeoffPerfomanceError.TooHeavy;
      }
    }

    if (cg !== undefined) {
      result.stabTrim = this.calculateStabTrim(cg);
    } else {
      result.stabTrim = undefined;
    }

    return result as TakeoffPerformanceResult;
  }

  private calculateFlexTow(
    result: Partial<TakeoffPerformanceResult>,
    limitingFactor: LimitingFactor,
    limitingWeights: LimitWeight,
    temperature: number,
  ): number {
    if (!result.inputs || !result.params) {
      throw new Error('Invalid result object!');
    }

    switch (limitingFactor) {
      case LimitingFactor.Runway:
        return (
          limitingWeights.altLimit -
          this.calculateRunwayTempDelta(
            temperature,
            result.inputs.conf,
            result.params.tRef,
            result.params.tMax,
            result.params.tFlexMax,
            result.params.adjustedTora,
            result.params.pressureAlt,
            result.params.isaTemp,
          ) -
          this.calculateRunwayWindDelta(
            temperature,
            result.inputs.conf,
            result.params.isaTemp,
            result.params.tRef,
            result.params.tMax,
            result.params.tFlexMax,
            result.params.adjustedTora,
            result.params.headwind,
          )
        );
        break;
      case LimitingFactor.SecondSegment:
        return (
          limitingWeights.altLimit -
          this.calculateSecondSegmentTempDelta(
            temperature,
            result.inputs.conf,
            result.params.tRef,
            result.params.tMax,
            result.params.tFlexMax,
            result.params.adjustedTora,
            result.params.pressureAlt,
            result.params.isaTemp,
          ) -
          this.calculateSecondSegmentWindDelta(
            temperature,
            result.inputs.conf,
            result.params.isaTemp,
            result.params.tRef,
            result.params.tMax,
            result.params.tFlexMax,
            result.params.adjustedTora,
            result.params.headwind,
          )
        );
        break;
      case LimitingFactor.BrakeEnergy:
        return (
          limitingWeights.altLimit -
          this.calculateBrakeEnergyTempDelta(
            temperature,
            result.inputs.conf,
            result.params.tRef,
            result.params.tMax,
            result.params.tFlexMax,
            result.params.adjustedTora,
            result.params.pressureAlt,
            result.params.isaTemp,
          ) -
          this.calculateBrakeEnergyWindDelta(
            temperature,
            result.inputs.conf,
            result.params.isaTemp,
            result.params.tRef,
            result.params.tMax,
            result.params.tFlexMax,
            result.params.adjustedTora,
            result.params.headwind,
          )
        );
        break;
      case LimitingFactor.Vmcg:
        return (
          limitingWeights.altLimit -
          this.calculateVmcgTempDelta(
            temperature,
            result.inputs.conf,
            result.params.tRef,
            result.params.tMax,
            result.params.tFlexMax,
            result.params.adjustedTora,
            result.params.pressureAlt,
            result.params.isaTemp,
          ) -
          this.calculateVmcgWindDelta(
            temperature,
            result.inputs.conf,
            result.params.isaTemp,
            result.params.tRef,
            result.params.tMax,
            result.params.tFlexMax,
            result.params.adjustedTora,
            result.params.headwind,
          )
        );
        break;
    }
    return 0;
  }

  private calculateFlexTemp(
    result: Partial<TakeoffPerformanceResult>,
    tvmcg: number,
  ): [number | undefined, LimitingFactor | undefined] {
    if (
      !result.inputs ||
      !result.params ||
      !result.limits ||
      !result.tRefLimitingFactor ||
      !result.tMaxLimitingFactor ||
      !result.tFlexMaxLimitingFactor
    ) {
      throw new Error('Invalid result object!');
    }

    // we can use flex if TOW is below the tRef limit weight
    if (result.inputs.tow < result.limits[result.tRefLimitingFactor].tRefLimit) {
      let flexTemp: number | undefined;
      let flexLimitingFactor: LimitingFactor | undefined;
      let iterFrom: number;
      let iterTo: number;
      let fromLimitingFactor: LimitingFactor;
      let fromLimitingWeights: LimitWeight;
      let toLimitingFactor: LimitingFactor;
      let toLimitingWeights: LimitWeight;

      if (result.inputs.tow > result.limits[result.tMaxLimitingFactor].tMaxLimitNoBleed) {
        // interpolate between tRefLimit and tMaxLimit
        // that temp is highest flex temp
        iterFrom = result.params.tRef;
        iterTo = result.params.tMax;
        fromLimitingFactor = result.tRefLimitingFactor;
        fromLimitingWeights = result.limits[result.tRefLimitingFactor];
        toLimitingFactor = result.tMaxLimitingFactor;
        toLimitingWeights = result.limits[result.tMaxLimitingFactor];
      } else if (result.inputs.tow > result.limits[result.tFlexMaxLimitingFactor].tFlexMaxLimitNoBleed) {
        // interpolate between tMaxLimit and tFlexMaxLimit
        // that temp is highest flex temp
        iterFrom = result.params.tMax;
        iterTo = result.params.tFlexMax;
        fromLimitingFactor = result.tMaxLimitingFactor;
        fromLimitingWeights = result.limits[result.tMaxLimitingFactor];
        toLimitingFactor = result.tFlexMaxLimitingFactor;
        toLimitingWeights = result.limits[result.tFlexMaxLimitingFactor];
      } else {
        // interpolate between tFlexMax and tFlexMax + the maximum bleed increment,
        // so we can account for bleed corrections later, and only then limit the flex temp to tFlexMax
        iterFrom = result.params.tFlexMax;
        iterTo = result.params.tFlexMax + 8;
        fromLimitingFactor = result.tFlexMaxLimitingFactor;
        fromLimitingWeights = result.limits[result.tFlexMaxLimitingFactor];
        toLimitingFactor = result.tFlexMaxLimitingFactor;
        toLimitingWeights = fromLimitingWeights;
      }

      for (let t = iterFrom; t <= iterTo; t++) {
        const fromLimitTow = this.calculateFlexTow(result, fromLimitingFactor, fromLimitingWeights, t);
        const toLimitTow = this.calculateFlexTow(result, toLimitingFactor, toLimitingWeights, t);
        if (result.inputs.tow <= Math.min(fromLimitTow, toLimitTow)) {
          flexTemp = t;
          flexLimitingFactor = fromLimitTow <= toLimitTow ? fromLimitingFactor : toLimitingFactor;
        }
      }

      if (flexTemp !== undefined && flexLimitingFactor !== undefined) {
        if (result.inputs.antiIce === TakeoffAntiIceSetting.Engine) {
          flexTemp -= 2;
        } else if (result.inputs.antiIce === TakeoffAntiIceSetting.EngineWing) {
          flexTemp -= 6;
        }
        if (result.inputs.packs) {
          flexTemp -= 2;
        }

        flexTemp = Math.min(flexTemp, result.params.tFlexMax);

        flexTemp = Math.trunc(flexTemp);

        if (result.inputs.runwayCondition === RunwayCondition.Wet) {
          // tvmcg is already calculated when we calculate MTOW
          const factors: ReadonlyFloat64Array = (
            result.inputs.oat > tvmcg
              ? A320251NTakeoffPerformanceCalculator.wetFlexAdjustmentFactorsAboveTvmcg
              : A320251NTakeoffPerformanceCalculator.wetFlexAdjustmentFactorsAtOrBelowTvmcg
          )[result.inputs.conf].get(A320251NTakeoffPerformanceCalculator.vec4Cache, result.params.headwind);

          const lengthAltCoef = result.params.adjustedTora - result.params.pressureAlt / 20;
          const wetFlexAdjustment = Math.min(
            0,
            factors[0] * lengthAltCoef + factors[1],
            factors[2] * lengthAltCoef + factors[3],
          );
          flexTemp -= wetFlexAdjustment;
        }

        if (flexTemp > result.inputs.oat) {
          return [flexTemp, flexLimitingFactor];
        }
      }
    }

    return [undefined, undefined];
  }

  private calculateVSpeeds(
    result: Partial<TakeoffPerformanceResult>,
    applyForwardCgSpeedCorrection: boolean,
    tvmcg: number,
  ): void {
    if (!result.inputs || !result.params) {
      throw new Error('Invalid result object!');
    }

    if (result.inputs.runwayCondition == RunwayCondition.Dry || result.inputs.runwayCondition === RunwayCondition.Wet) {
      this.calculateDryVSpeeds(result, applyForwardCgSpeedCorrection);
      if (result.inputs.runwayCondition === RunwayCondition.Dry) {
        result.v1 = result.intermediateSpeeds?.dryV1;
        result.vR = result.intermediateSpeeds?.dryVR;
        result.v2 = result.intermediateSpeeds?.dryV2;
      } else {
        // Wet
        if (!result.intermediateSpeeds) {
          throw new Error('No dry speeds!');
        }
        // tvmcg is already calculated when we calculate MTOW
        const v1Factors: ReadonlyFloat64Array = (
          result.inputs.oat > tvmcg
            ? A320251NTakeoffPerformanceCalculator.wetV1AdjustmentFactorsAboveTvmcg
            : A320251NTakeoffPerformanceCalculator.wetV1AdjustmentFactorsAtOrBelowTvmcg
        )[result.inputs.conf].get(A320251NTakeoffPerformanceCalculator.vec4Cache, result.params.headwind);
        const vRFactors: ReadonlyFloat64Array | undefined = (
          result.inputs.oat > tvmcg
            ? undefined
            : A320251NTakeoffPerformanceCalculator.wetVRAdjustmentFactorsAtOrBelowTvmcg
        )?.[result.inputs.conf].get(A320251NTakeoffPerformanceCalculator.vec4Cache, result.params.headwind);
        const v2Factors: ReadonlyFloat64Array | undefined = (
          result.inputs.oat > tvmcg
            ? undefined
            : A320251NTakeoffPerformanceCalculator.wetV2AdjustmentFactorsAtOrBelowTvmcg
        )?.[result.inputs.conf].get(A320251NTakeoffPerformanceCalculator.vec4Cache, result.params.headwind);

        const lengthAltCoef = result.params.adjustedTora - result.params.pressureAlt / 20;
        const wetV1Adjustment = Math.min(
          0,
          v1Factors[0] * lengthAltCoef + v1Factors[1],
          v1Factors[2] * lengthAltCoef + v1Factors[3],
        );
        const wetVRAdjustment = vRFactors
          ? Math.min(0, vRFactors[0] * lengthAltCoef + vRFactors[1], vRFactors[2] * lengthAltCoef + vRFactors[3])
          : 0;
        const wetV2Adjustment = v2Factors
          ? Math.min(0, v2Factors[0] * lengthAltCoef + v2Factors[1], v2Factors[2] * lengthAltCoef + v2Factors[3])
          : 0;

        [result.v1, result.vR, result.v2] = this.reconcileVSpeeds(
          result,
          result.intermediateSpeeds.dryV1 - wetV1Adjustment,
          result.intermediateSpeeds.dryVR - wetVRAdjustment,
          result.intermediateSpeeds.dryV2 - wetV2Adjustment,
        );
      }
      return;
    }

    // otherwise the runway is contaminated

    let contamVSpeeds: Record<number, LerpVectorLookupTable>;
    switch (result.inputs.runwayCondition) {
      case RunwayCondition.Contaminated6mmWater:
        contamVSpeeds = A320251NTakeoffPerformanceCalculator.vSpeedsContaminated6mmWater;
        break;
      case RunwayCondition.Contaminated13mmWater:
        contamVSpeeds = A320251NTakeoffPerformanceCalculator.vSpeedsContaminated13mmWater;
        break;
      case RunwayCondition.Contaminated6mmSlush:
        contamVSpeeds = A320251NTakeoffPerformanceCalculator.vSpeedsContaminated6mmSlush;
        break;
      case RunwayCondition.Contaminated13mmSlush:
        contamVSpeeds = A320251NTakeoffPerformanceCalculator.vSpeedsContaminated13mmSlush;
        break;
      case RunwayCondition.ContaminatedCompactedSnow:
        contamVSpeeds = A320251NTakeoffPerformanceCalculator.vSpeedsContaminatedCompactedSnow;
        break;
      case RunwayCondition.Contaminated5mmWetSnow:
        contamVSpeeds = A320251NTakeoffPerformanceCalculator.vSpeedsContaminated5mmWetSnow;
        break;
      case RunwayCondition.Contaminated15mmWetSnow:
        contamVSpeeds = A320251NTakeoffPerformanceCalculator.vSpeedsContaminated15mmWetSnow;
        break;
      case RunwayCondition.Contaminated10mmDrySnow:
        contamVSpeeds = A320251NTakeoffPerformanceCalculator.vSpeedsContaminated10mmDrySnow;
        break;
      case RunwayCondition.Contaminated100mmDrySnow:
        contamVSpeeds = A320251NTakeoffPerformanceCalculator.vSpeedsContaminated100mmDrySnow;
        break;
      default:
        throw new Error('Invalid runway condition');
    }

    const [v1, vR, v2] = contamVSpeeds[result.inputs.conf].get(
      A320251NTakeoffPerformanceCalculator.vec3Cache,
      result.inputs.tow,
    );

    [result.v1, result.vR, result.v2] = this.reconcileVSpeeds(result, v1, vR, v2);
  }

  private calculateDryVSpeeds(result: Partial<TakeoffPerformanceResult>, applyForwardCgSpeedCorrection: boolean): void {
    if (!result.inputs || !result.params) {
      throw new Error('Invalid result object!');
    }

    let v1: number;
    let vR: number;
    let v2: number;

    const speeds: Partial<TakeoffPerformanceSpeeds> = {};

    const limitingFactor =
      result.params.flexLimitingFactor !== undefined ? result.params.flexLimitingFactor : result.oatLimitingFactor;

    if (limitingFactor === LimitingFactor.Runway || limitingFactor === LimitingFactor.Vmcg) {
      // v2
      const [v2BaseFactor1, v2BaseFactor2]: [number, number] =
        A320251NTakeoffPerformanceCalculator.v2RunwayVmcgBaseFactors[result.inputs.conf];
      speeds.v2Base = (result.inputs.tow / 1000) * v2BaseFactor1 + v2BaseFactor2;

      const [v2AltFactor1, v2AltFactor2] =
        A320251NTakeoffPerformanceCalculator.v2RunwayVmcgAltFactors[result.inputs.conf];
      speeds.v2DeltaAlt = ((result.inputs.tow / 1000) * v2AltFactor1 + v2AltFactor2) * result.params.pressureAlt;

      v2 = speeds.v2Base + speeds.v2DeltaAlt;

      // vr
      const [vRBaseFactor1, vRBaseFactor2]: [number, number] =
        A320251NTakeoffPerformanceCalculator.vRRunwayVmcgBaseFactors[result.inputs.conf];
      speeds.vRBase = (result.inputs.tow / 1000) * vRBaseFactor1 + vRBaseFactor2;

      const [vRBaseLength, vRRunwayFactor1, vRRunwayFactor2] =
        A320251NTakeoffPerformanceCalculator.vRRunwayVmcgRunwayFactors[result.inputs.conf];
      speeds.vRDeltaRunway =
        (vRBaseLength - result.params.adjustedTora) * ((result.inputs.tow / 1000) * vRRunwayFactor1 + vRRunwayFactor2);

      const [vRFactorAlt1, vRFactorAlt2] =
        A320251NTakeoffPerformanceCalculator.vRRunwayVmcgAltFactors[result.inputs.conf];
      speeds.vRDeltaAlt = result.params.pressureAlt * ((result.inputs.tow / 1000) * vRFactorAlt1 + vRFactorAlt2);

      const vRFactorSlope = A320251NTakeoffPerformanceCalculator.vRRunwayVmcgSlopeFactors[result.inputs.conf];
      speeds.vRDeltaSlope = result.inputs.slope * result.params.adjustedTora * vRFactorSlope;

      const [vRWindFactor1, vRWindFactor2] =
        result.params.headwind >= 0
          ? A320251NTakeoffPerformanceCalculator.vRRunwayVmcgHeadwindFactors[result.inputs.conf]
          : A320251NTakeoffPerformanceCalculator.vRRunwayVmcgTailwindFactors[result.inputs.conf];
      speeds.vRDeltaWind = result.params.headwind * ((result.inputs.tow / 1000) * vRWindFactor1 + vRWindFactor2);

      vR =
        speeds.vRBase +
        speeds.vRDeltaRunway +
        speeds.vRDeltaAlt +
        speeds.vRDeltaSlope +
        speeds.vRDeltaWind +
        (applyForwardCgSpeedCorrection ? -1 : 0);

      // v1
      const [v1BaseFactor1, v1BaseFactor2]: [number, number] =
        A320251NTakeoffPerformanceCalculator.v1RunwayVmcgBaseFactors[result.inputs.conf];
      speeds.v1Base = (result.inputs.tow / 1000) * v1BaseFactor1 + v1BaseFactor2;

      const [v1BaseLength, v1RunwayFactor1, v1RunwayFactor2] =
        A320251NTakeoffPerformanceCalculator.v1RunwayVmcgRunwayFactors[result.inputs.conf];
      speeds.v1DeltaRunway =
        (v1BaseLength - result.params.adjustedTora) * ((result.inputs.tow / 1000) * v1RunwayFactor1 + v1RunwayFactor2);

      const [v1FactorAlt1, v1FactorAlt2] =
        A320251NTakeoffPerformanceCalculator.v1RunwayVmcgAltFactors[result.inputs.conf];
      speeds.v1DeltaAlt = result.params.pressureAlt * ((result.inputs.tow / 1000) * v1FactorAlt1 + v1FactorAlt2);

      const v1FactorSlope = A320251NTakeoffPerformanceCalculator.v1RunwayVmcgSlopeFactors[result.inputs.conf];
      speeds.v1DeltaSlope = result.inputs.slope * result.params.adjustedTora * v1FactorSlope;

      const [v1WindFactor1, v1WindFactor2] =
        result.params.headwind >= 0
          ? A320251NTakeoffPerformanceCalculator.v1RunwayVmcgHeadwindFactors[result.inputs.conf]
          : A320251NTakeoffPerformanceCalculator.v1RunwayVmcgTailwindFactors[result.inputs.conf];
      speeds.v1DeltaWind = result.params.headwind * ((result.inputs.tow / 1000) * v1WindFactor1 + v1WindFactor2);

      v1 = speeds.v1Base + speeds.v1DeltaRunway + speeds.v1DeltaAlt + speeds.v1DeltaSlope + speeds.v1DeltaWind;
    } else {
      // 2nd seg or brake energy limited
      // v2
      const v2NoWind = this.calculateSecondSegBrakeV2(speeds, result, false, false);
      const [v2ThresholdFactor1, v2ThresholdFactor2] =
        A320251NTakeoffPerformanceCalculator.v2SecondSegBrakeThresholds[result.inputs.conf];
      speeds.v2Table2Threshold = result.params.adjustedTora * v2ThresholdFactor1 + v2ThresholdFactor2;
      const useTable2 = v2NoWind >= speeds.v2Table2Threshold;
      if (useTable2) {
        speeds.v2Table1NoWind = v2NoWind;
      }
      v2 = this.calculateSecondSegBrakeV2(speeds, result, true, useTable2);

      // vr
      const [vRBaseFactor1, vRBaseFactor2]: [number, number] = useTable2
        ? A320251NTakeoffPerformanceCalculator.vRSecondSegBrakeBaseTable2[result.inputs.conf]
        : A320251NTakeoffPerformanceCalculator.vRSecondSegBrakeBaseTable1[result.inputs.conf];
      speeds.vRBase = (result.inputs.tow / 1000) * vRBaseFactor1 + vRBaseFactor2;

      const [vRBaseLength, vRRunwayFactor1, vRRunwayFactor2] = useTable2
        ? A320251NTakeoffPerformanceCalculator.vRSecondSegBrakeRunwayTable2[result.inputs.conf]
        : A320251NTakeoffPerformanceCalculator.vRSecondSegBrakeRunwayTable1[result.inputs.conf];
      speeds.vRDeltaRunway =
        (vRBaseLength - result.params.adjustedTora) * ((result.inputs.tow / 1000) * vRRunwayFactor1 + vRRunwayFactor2);

      const [vRAltFactor1, vRAltFactor2, vRAltFactor3, vRAltFactor4] = useTable2
        ? A320251NTakeoffPerformanceCalculator.vRSecondSegBrakeAltTable2[result.inputs.conf]
        : A320251NTakeoffPerformanceCalculator.vRSecondSegBrakeAltTable1[result.inputs.conf];
      speeds.vRDeltaAlt =
        result.params.pressureAlt *
        ((result.inputs.tow / 1000) * vRAltFactor1 + vRAltFactor2) *
        (result.params.adjustedTora * vRAltFactor3 + vRAltFactor4);

      const [vRSlopeFactor1, vRSlopeFactor2] =
        A320251NTakeoffPerformanceCalculator.vRSecondSegBrakeSlopeFactors[result.inputs.conf];
      speeds.vRDeltaSlope =
        result.inputs.slope *
        result.params.adjustedTora *
        ((result.inputs.tow / 1000) * vRSlopeFactor1 + vRSlopeFactor2);

      const [vRWindFactor1, vRWindFactor2] =
        result.params.headwind >= 0
          ? A320251NTakeoffPerformanceCalculator.vRSecondSegBrakeHeadwindFactors[result.inputs.conf]
          : A320251NTakeoffPerformanceCalculator.vRSecondSegBrakeTailwindFactors[result.inputs.conf];
      speeds.vRDeltaWind = result.params.headwind * ((result.inputs.tow / 1000) * vRWindFactor1 + vRWindFactor2);

      vR = speeds.vRBase + speeds.vRDeltaRunway + speeds.vRDeltaAlt + speeds.vRDeltaSlope + speeds.vRDeltaWind;

      // v1
      // FIXME temp workaround noted in the document
      v1 = this.calculateSecondSegBrakeV1(speeds, result, useTable2);
      if (useTable2 && v2 - v1 > 8) {
        speeds.v1Table2 = v1;
        v1 = this.calculateSecondSegBrakeV1(speeds, result, false);
      }
    }

    [speeds.dryV1, speeds.dryVR, speeds.dryV2] = this.reconcileVSpeeds(result, v1, vR, v2);

    result.intermediateSpeeds = speeds as TakeoffPerformanceSpeeds;
  }

  private calculateSecondSegBrakeV2(
    speeds: Partial<TakeoffPerformanceSpeeds>,
    result: Partial<TakeoffPerformanceResult>,
    correctWind: boolean,
    useTable2: boolean,
  ): number {
    if (!result.inputs || !result.params) {
      throw new Error('Invalid result object!');
    }

    const [v2BaseFactor1, v2BaseFactor2] =
      A320251NTakeoffPerformanceCalculator.v2SecondSegBrakeBaseTable1[result.inputs.conf];
    speeds.v2Base = (result.inputs.tow / 1000) * v2BaseFactor1 + v2BaseFactor2;

    if (useTable2) {
      const [v2BaseFactor1, v2BaseFactor2] =
        A320251NTakeoffPerformanceCalculator.v2SecondSegBrakeBaseTable2[result.inputs.conf];
      speeds.v2Base = (result.inputs.tow / 1000) * v2BaseFactor1 + v2BaseFactor2;
    }

    const [v2BaseRunwayLength, v2RunwayFactor] = useTable2
      ? A320251NTakeoffPerformanceCalculator.v2SecondSegBrakeRunwayTable2[result.inputs.conf]
      : A320251NTakeoffPerformanceCalculator.v2SecondSegBrakeRunwayTable1[result.inputs.conf];
    speeds.v2DeltaRunway = (v2BaseRunwayLength - result.params.adjustedTora) * v2RunwayFactor;

    const [v2AltFactor1, v2AltFactor2, v2AltFactor3, v2AltFactor4] =
      A320251NTakeoffPerformanceCalculator.v2SecondSegBrakeAltFactors[result.inputs.conf];
    speeds.v2DeltaAlt =
      result.params.pressureAlt *
      ((result.inputs.tow / 1000) * v2AltFactor1 + v2AltFactor2) *
      (result.params.adjustedTora * v2AltFactor3 + v2AltFactor4);

    const [v2SlopeFactor1, v2SlopeFactor2] =
      A320251NTakeoffPerformanceCalculator.v2SecondSegBrakeSlopeFactors[result.inputs.conf];
    speeds.v2DeltaSlope =
      result.inputs.slope * result.params.adjustedTora * ((result.inputs.tow / 1000) * v2SlopeFactor1 + v2SlopeFactor2);

    if (correctWind) {
      const v2WindFactor =
        result.params.headwind >= 0
          ? A320251NTakeoffPerformanceCalculator.v2SecondSegBrakeHeadwindFactors[result.inputs.conf]
          : A320251NTakeoffPerformanceCalculator.v2SecondSegBrakeTailwindFactors[result.inputs.conf];
      speeds.v2DeltaWind = result.params.headwind * v2WindFactor;
    } else {
      speeds.v2DeltaWind = 0;
    }

    return speeds.v2Base + speeds.v2DeltaRunway + speeds.v2DeltaAlt + speeds.v2DeltaSlope + speeds.v2DeltaWind;
  }

  private calculateSecondSegBrakeV1(
    speeds: Partial<TakeoffPerformanceSpeeds>,
    result: Partial<TakeoffPerformanceResult>,
    useTable2: boolean,
  ): number {
    if (!result.inputs || !result.params) {
      throw new Error('Invalid result object!');
    }

    const [v1BaseFactor1, v1BaseFactor2]: [number, number] = useTable2
      ? A320251NTakeoffPerformanceCalculator.v1SecondSegBrakeBaseTable2[result.inputs.conf]
      : A320251NTakeoffPerformanceCalculator.v1SecondSegBrakeBaseTable1[result.inputs.conf];
    speeds.v1Base = (result.inputs.tow / 1000) * v1BaseFactor1 + v1BaseFactor2;

    const [v1BaseLength, v1RunwayFactor1, v1RunwayFactor2] = useTable2
      ? A320251NTakeoffPerformanceCalculator.v1SecondSegBrakeRunwayTable2[result.inputs.conf]
      : A320251NTakeoffPerformanceCalculator.v1SecondSegBrakeRunwayTable1[result.inputs.conf];
    speeds.v1DeltaRunway =
      (v1BaseLength - result.params.adjustedTora) * ((result.inputs.tow / 1000) * v1RunwayFactor1 + v1RunwayFactor2);

    const [v1AltFactor1, v1AltFactor2, v1AltFactor3, v1AltFactor4] = useTable2
      ? A320251NTakeoffPerformanceCalculator.v1SecondSegBrakeAltTable2[result.inputs.conf]
      : A320251NTakeoffPerformanceCalculator.v1SecondSegBrakeAltTable1[result.inputs.conf];
    speeds.v1DeltaAlt =
      result.params.pressureAlt *
      ((result.inputs.tow / 1000) * v1AltFactor1 + v1AltFactor2) *
      (result.params.adjustedTora * v1AltFactor3 + v1AltFactor4);

    const [v1SlopeFactor1, v1SlopeFactor2] =
      A320251NTakeoffPerformanceCalculator.v1SecondSegBrakeSlopeFactors[result.inputs.conf];
    speeds.v1DeltaSlope =
      result.inputs.slope * result.params.adjustedTora * ((result.inputs.tow / 1000) * v1SlopeFactor1 + v1SlopeFactor2);

    const [v1WindFactor1, v1WindFactor2] =
      result.params.headwind >= 0
        ? A320251NTakeoffPerformanceCalculator.v1SecondSegBrakeHeadwindFactors[result.inputs.conf]
        : A320251NTakeoffPerformanceCalculator.v1SecondSegBrakeTailwindFactors[result.inputs.conf];
    speeds.v1DeltaWind = result.params.headwind * ((result.inputs.tow / 1000) * v1WindFactor1 + v1WindFactor2);

    return speeds.v1Base + speeds.v1DeltaRunway + speeds.v1DeltaAlt + speeds.v1DeltaSlope + speeds.v1DeltaWind;
  }

  private reconcileVSpeeds(
    result: Partial<TakeoffPerformanceResult>,
    v1: number,
    vR: number,
    v2: number,
  ): [number, number, number] {
    if (!result.inputs || !result.params) {
      throw new Error('Invalid result object!');
    }

    const minV1Vmc = Math.ceil(A320251NTakeoffPerformanceCalculator.minimumV1Vmc.get(result.params.pressureAlt));
    const minVrVmc = Math.ceil(A320251NTakeoffPerformanceCalculator.minimumVrVmc.get(result.params.pressureAlt));
    const minV2Vmc = Math.ceil(
      A320251NTakeoffPerformanceCalculator.minimumV2Vmc[result.inputs.conf].get(result.params.pressureAlt),
    );
    const minv2Vmu = Math.ceil(
      A320251NTakeoffPerformanceCalculator.minimumV2Vmu[result.inputs.conf].get(
        result.params.pressureAlt,
        result.inputs.tow,
      ),
    );

    // VMCG/VMCA/VMU limits, and rounding
    let v1Corrected = Math.round(Math.max(v1, minV1Vmc));
    let vRCorrected = Math.round(Math.max(vR, minVrVmc));
    const v2Corrected = Math.round(Math.max(v2, minV2Vmc, minv2Vmu));

    // Vr must be less than or equal to v2
    if (vRCorrected > v2Corrected) {
      vRCorrected = v2Corrected;
      if (vRCorrected < minVrVmc) {
        result.error = TakeoffPerfomanceError.VmcgVmcaLimits;
      }
    }

    // Vr limited by tire speed
    if (v2Corrected > 195) {
      const maxVr = Math.trunc(195 - (v2Corrected - 195));
      if (vRCorrected > 195) {
        result.error = TakeoffPerfomanceError.MaximumTireSpeed;
      } else if (vRCorrected > maxVr) {
        vRCorrected = maxVr;
        if (vRCorrected < minVrVmc) {
          result.error = TakeoffPerfomanceError.VmcgVmcaLimits;
        }
      }
    }

    // V1 must be less than or equal to vr
    if (v1Corrected > vRCorrected) {
      v1Corrected = vRCorrected;
      if (v1Corrected < minV1Vmc) {
        result.error = TakeoffPerfomanceError.VmcgVmcaLimits;
      }
    }

    return [v1Corrected, vRCorrected, v2Corrected];
  }

  private calculateWeightLimits(
    limitingFactor: LimitingFactor,
    result: Partial<TakeoffPerformanceResult>,
  ): LimitWeight {
    if (!result.inputs || !result.params) {
      throw new Error('Invalid result object!');
    }

    const weights: Partial<LimitWeight> = {};

    let baseFactors: typeof A320251NTakeoffPerformanceCalculator.secondSegmentBaseFactor | undefined;
    let slopeFactors: typeof A320251NTakeoffPerformanceCalculator.runwaySlopeFactor;
    let altFactors: typeof A320251NTakeoffPerformanceCalculator.runwayPressureAltFactor;
    let tempDeltaFunc: typeof this.calculateRunwayTempDelta;
    let windDeltaFunc: typeof this.calculateRunwayWindDelta;

    switch (limitingFactor) {
      case LimitingFactor.Runway:
        // no base factors
        slopeFactors = A320251NTakeoffPerformanceCalculator.runwaySlopeFactor;
        altFactors = A320251NTakeoffPerformanceCalculator.runwayPressureAltFactor;
        tempDeltaFunc = this.calculateRunwayTempDelta;
        windDeltaFunc = this.calculateRunwayWindDelta;
        break;
      case LimitingFactor.SecondSegment:
        baseFactors = A320251NTakeoffPerformanceCalculator.secondSegmentBaseFactor;
        slopeFactors = A320251NTakeoffPerformanceCalculator.secondSegmentSlopeFactor;
        altFactors = A320251NTakeoffPerformanceCalculator.secondSegmentPressureAltFactor;
        tempDeltaFunc = this.calculateSecondSegmentTempDelta;
        windDeltaFunc = this.calculateSecondSegmentWindDelta;
        break;
      case LimitingFactor.BrakeEnergy:
        baseFactors = A320251NTakeoffPerformanceCalculator.brakeEnergyBaseFactor;
        slopeFactors = A320251NTakeoffPerformanceCalculator.brakeEnergySlopeFactor;
        altFactors = A320251NTakeoffPerformanceCalculator.brakeEnergyPressureAltFactor;
        tempDeltaFunc = this.calculateBrakeEnergyTempDelta;
        windDeltaFunc = this.calculateBrakeEnergyWindDelta;
        break;
      case LimitingFactor.Vmcg:
        baseFactors = A320251NTakeoffPerformanceCalculator.vmcgBaseFactor;
        slopeFactors = A320251NTakeoffPerformanceCalculator.vmcgSlopeFactor;
        altFactors = A320251NTakeoffPerformanceCalculator.vmcgPressureAltFactor;
        tempDeltaFunc = this.calculateVmcgTempDelta;
        windDeltaFunc = this.calculateVmcgWindDelta;
        break;
      default:
        throw new Error('Invalid limiting factor!');
    }

    // base weight limits at sea level, isa etc.
    if (limitingFactor === LimitingFactor.Runway) {
      weights.baseLimit = this.calculateBaseRunwayPerfLimit(result.params.adjustedTora, result.inputs.conf);
    } else {
      if (!baseFactors) {
        throw new Error('Missing base factors!');
      }
      weights.baseLimit = this.calculateBaseLimit(result.params.adjustedTora, result.inputs.conf, baseFactors);
    }

    // correction for runway slope dependent on config
    // note: downhill = increased weight limit
    weights.deltaSlope = 1000 * slopeFactors[result.inputs.conf] * result.params.adjustedTora * result.inputs.slope;
    weights.slopeLimit = weights.baseLimit - weights.deltaSlope;

    // correction for pressure altitude
    const [altFactor1, altFactor2] = altFactors[result.inputs.conf];
    weights.deltaAlt = 1000 * result.params.pressureAlt * (result.params.pressureAlt * altFactor1 + altFactor2);
    weights.altLimit = weights.slopeLimit - weights.deltaAlt;

    // correction for bleeds
    const deltaBleed =
      (result.inputs.antiIce === TakeoffAntiIceSetting.EngineWing ? 1_600 : 0) + (result.inputs.packs ? 1_500 : 0);

    // correction for air temperature and wind
    weights.oatDeltaTemp = tempDeltaFunc(
      result.inputs.oat,
      result.inputs.conf,
      result.params.tRef,
      result.params.tMax,
      result.params.tFlexMax,
      result.params.adjustedTora,
      result.params.pressureAlt,
      result.params.isaTemp,
    );
    weights.oatDeltaWind = windDeltaFunc(
      result.inputs.oat,
      result.inputs.conf,
      result.params.isaTemp,
      result.params.tRef,
      result.params.tMax,
      result.params.tFlexMax,
      result.params.adjustedTora,
      result.params.headwind,
    );
    weights.oatLimitNoBleed = weights.altLimit - weights.oatDeltaTemp - weights.oatDeltaWind;
    weights.oatLimit = weights.oatLimitNoBleed - deltaBleed;

    weights.tRefDeltaTemp = tempDeltaFunc(
      result.params.tRef,
      result.inputs.conf,
      result.params.tRef,
      result.params.tMax,
      result.params.tFlexMax,
      result.params.adjustedTora,
      result.params.pressureAlt,
      result.params.isaTemp,
    );
    weights.tRefDeltaWind = windDeltaFunc(
      result.params.tRef,
      result.inputs.conf,
      result.params.isaTemp,
      result.params.tRef,
      result.params.tMax,
      result.params.tFlexMax,
      result.params.adjustedTora,
      result.params.headwind,
    );
    weights.tRefLimitNoBleed = weights.altLimit - weights.tRefDeltaTemp - weights.tRefDeltaWind;
    weights.tRefLimit = weights.tRefLimitNoBleed - deltaBleed;

    weights.tMaxDeltaTemp = tempDeltaFunc(
      result.params.tMax,
      result.inputs.conf,
      result.params.tRef,
      result.params.tMax,
      result.params.tFlexMax,
      result.params.adjustedTora,
      result.params.pressureAlt,
      result.params.isaTemp,
    );
    weights.tMaxDeltaWind = windDeltaFunc(
      result.params.tMax,
      result.inputs.conf,
      result.params.isaTemp,
      result.params.tRef,
      result.params.tMax,
      result.params.tFlexMax,
      result.params.adjustedTora,
      result.params.headwind,
    );
    weights.tMaxLimitNoBleed = weights.altLimit - weights.tMaxDeltaTemp - weights.tMaxDeltaWind;
    weights.tMaxLimit = weights.tMaxLimitNoBleed - deltaBleed;

    weights.tFlexMaxDeltaTemp = tempDeltaFunc(
      result.params.tFlexMax,
      result.inputs.conf,
      result.params.tRef,
      result.params.tMax,
      result.params.tFlexMax,
      result.params.adjustedTora,
      result.params.pressureAlt,
      result.params.isaTemp,
    );
    weights.tFlexMaxDeltaWind = windDeltaFunc(
      result.params.tFlexMax,
      result.inputs.conf,
      result.params.isaTemp,
      result.params.tRef,
      result.params.tMax,
      result.params.tFlexMax,
      result.params.adjustedTora,
      result.params.headwind,
    );
    weights.tFlexMaxLimitNoBleed = weights.altLimit - weights.tFlexMaxDeltaTemp - weights.tFlexMaxDeltaWind;
    weights.tFlexMaxLimit = weights.tFlexMaxLimitNoBleed - deltaBleed;

    return weights as LimitWeight;
  }

  /**
   * Determine which of the factors is limiting the takeoff weight most for a given temperature.
   * @param temp The temperature to check.
   * @param result The partially calculated result.
   * @returns The most limiting factor.
   */
  private getLimitingFactor(
    temp: 'oatLimit' | 'tRefLimit' | 'tMaxLimit' | 'tFlexMaxLimit',
    result: Partial<TakeoffPerformanceResult>,
  ): LimitingFactor {
    if (!result.limits) {
      throw new Error('Invalid result object!');
    }

    let limitingWeight = Infinity;
    let limitingFactor = LimitingFactor.Runway;

    for (const factor of Object.values(LimitingFactor) as LimitingFactor[]) {
      const weights = result.limits[factor];
      if (weights !== undefined && weights[temp] < limitingWeight) {
        limitingWeight = weights[temp];
        limitingFactor = factor;
      }
    }

    return limitingFactor;
  }

  /** @inheritdoc */
  public calculateTakeoffPerformanceOptConf(
    tow: number,
    forwardCg: boolean,
    tora: number,
    slope: number,
    lineupAngle: LineupAngle,
    wind: number,
    elevation: number,
    qnh: number,
    oat: number,
    antiIce: TakeoffAntiIceSetting,
    packs: boolean,
    forceToga: boolean,
    runwayCondition: RunwayCondition,
    cg?: number,
    out?: Partial<TakeoffPerformanceResult>,
  ): TakeoffPerformanceResult {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const results = [1, 2, 3].map((conf, cacheIndex) =>
      this.calculateTakeoffPerformance(
        tow,
        forwardCg,
        conf,
        tora,
        slope,
        lineupAngle,
        wind,
        elevation,
        qnh,
        oat,
        antiIce,
        packs,
        forceToga,
        runwayCondition,
        cg,
        // A320251NTakeoffPerformanceCalculator.optResultCache[cacheIndex],
      ),
    );

    const filteredResults = results.filter((r) => r.error === TakeoffPerfomanceError.None);

    // if all the results failed, return the highest conf
    if (filteredResults.length === 0) {
      return A320251NTakeoffPerformanceCalculator.deepCopy(results[results.length - 1], out);
    }

    // pick the result with the highest flex temp, and the lowest speeds (if two have the same flex)
    filteredResults.sort((a, b) => (a.flex === b.flex ? (a.v1 ?? 0) - (b.v1 ?? 0) : (b.flex ?? 0) - (a.flex ?? 0)));
    return A320251NTakeoffPerformanceCalculator.deepCopy(filteredResults[0], out ?? {});
  }

  private static deepCopy(
    result: TakeoffPerformanceResult,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    out?: Partial<TakeoffPerformanceResult>,
  ): TakeoffPerformanceResult {
    // FIXME implement properly
    return JSON.parse(JSON.stringify(result));
  }

  private calculateTvmcg(inputs: TakeoffPerformanceInputs, params: TakeoffPerformanceParameters): number {
    const factors: LerpVectorLookupTable = A320251NTakeoffPerformanceCalculator.tvmcgFactors[inputs.conf];
    const [factor1, factor2] = factors.get(
      A320251NTakeoffPerformanceCalculator.vec2Cache,
      Math.max(params.headwind, -15),
    );
    return factor1 * (params.adjustedTora - params.pressureAlt / 10) + factor2;
  }

  /**
   * Get the ISA temperature from elevation.
   * @param elevation Elevation in feet.
   * @returns ISA temperature in °C.
   */
  private calculateIsaTemp(elevation: number): number {
    return 15 - elevation * 0.0019812;
  }

  /**
   * Get the Tref temperature from elevation.
   * @param elevation Elevation in feet.
   * @returns Tref in °C.
   */
  private calculateTref(elevation: number): number {
    return A320251NTakeoffPerformanceCalculator.tRefTable.get(elevation);
  }

  /**
   * Get the Tmax temperature from elevation.
   * @param pressureAlt Pressure altitude in feet.
   * @returns Tmax in °C.
   */
  private calculateTmax(pressureAlt: number): number {
    return A320251NTakeoffPerformanceCalculator.tMaxTable.get(pressureAlt);
  }

  /**
   * Get the maximum flex temperature from ISA temp.
   * @param isa ISA temperature in °C.
   * @returns Tflexmax in °C.
   */
  private calculateTflexMax(isa: number): number {
    return isa + A320251NTakeoffPerformanceCalculator.tMaxFlexDisa;
  }

  private calculatePressureAltitude(elevation: number, qnh: number): number {
    return elevation + 145442.15 * (1 - (qnh / 1013.25) ** 0.190263);
  }

  private calculateBaseRunwayPerfLimit(length: number, conf: number): number {
    switch (conf) {
      case 1:
        return A320251NTakeoffPerformanceCalculator.runwayPerfLimitConf1.get(length);
      case 2:
        return A320251NTakeoffPerformanceCalculator.runwayPerfLimitConf2.get(length);
      case 3:
        return A320251NTakeoffPerformanceCalculator.runwayPerfLimitConf3.get(length);
      default:
        return NaN;
    }
  }

  private calculateBaseLimit(length: number, conf: number, factors: Record<number, [number, number]>): number {
    const [factor1, factor2] = factors[conf];
    return 1000 * (length * factor1 + factor2);
  }

  /** Calculates the temperature correction in kg. */
  private calculateRunwayTempDelta(
    temp: number,
    conf: number,
    tRef: number,
    tMax: number,
    tFlexMax: number,
    runwayLength: number,
    pressureAlt: number,
    isaTemp: number,
  ): number {
    if (temp > tFlexMax) {
      return NaN;
    }

    const tempFactors = A320251NTakeoffPerformanceCalculator.runwayTemperatureFactor[conf];

    const runwayAltFactor = runwayLength - pressureAlt / 12;
    let weightDelta = 1000 * (runwayAltFactor * tempFactors[0] + tempFactors[1]) * (Math.min(temp, tRef) - isaTemp);
    if (temp > tRef) {
      weightDelta += 1000 * (runwayAltFactor * tempFactors[2] + tempFactors[3]) * (Math.min(temp, tMax) - tRef);
    }
    if (temp > tMax) {
      weightDelta += 1000 * (runwayAltFactor * tempFactors[4] + tempFactors[5]) * (temp - tMax);
    }
    return weightDelta;
  }

  /** Calculates the temperature correction in kg. */
  private calculateSecondSegmentTempDelta(
    temp: number,
    conf: number,
    tRef: number,
    tMax: number,
    tFlexMax: number,
    runwayLength: number,
    pressureAlt: number,
    isaTemp: number,
  ): number {
    if (temp > tFlexMax) {
      return NaN;
    }

    const tempFactors = A320251NTakeoffPerformanceCalculator.secondSegmentTemperatureFactor[conf];

    let weightDelta =
      1000 * ((runwayLength - pressureAlt / 5) * tempFactors[0] + tempFactors[1]) * (Math.min(temp, tRef) - isaTemp);
    if (temp > tRef) {
      weightDelta +=
        1000 * ((runwayLength - pressureAlt / 5) * tempFactors[2] + tempFactors[3]) * (Math.min(temp, tMax) - tRef);
    }
    if (temp > tMax) {
      weightDelta += 1000 * ((runwayLength - pressureAlt / 5) * tempFactors[4] + tempFactors[5]) * (temp - tMax);
    }
    return weightDelta;
  }

  /** Calculates the temperature correction in kg. */
  private calculateBrakeEnergyTempDelta(
    temp: number,
    conf: number,
    tRef: number,
    tMax: number,
    tFlexMax: number,
    runwayLength: number,
    pressureAlt: number,
    isaTemp: number,
  ): number {
    if (temp > tFlexMax) {
      return NaN;
    }

    const tempFactors = A320251NTakeoffPerformanceCalculator.brakeEnergyTemperatureFactor[conf];

    let weightDelta = 1000 * tempFactors[0] * (Math.min(temp, tRef) - isaTemp);
    if (temp > tRef) {
      weightDelta += 1000 * tempFactors[1] * (Math.min(temp, tMax) - tRef);
    }
    // no correction above Tmax
    return weightDelta;
  }

  /** Calculates the temperature correction in kg. */
  private calculateVmcgTempDelta(
    temp: number,
    conf: number,
    tRef: number,
    tMax: number,
    tFlexMax: number,
    runwayLength: number,
    pressureAlt: number,
    isaTemp: number,
  ): number {
    if (temp > tFlexMax) {
      return NaN;
    }

    const tempFactors = A320251NTakeoffPerformanceCalculator.vmcgTemperatureFactor[conf];

    let weightDelta = 1000 * (runwayLength * tempFactors[0] + tempFactors[1]) * (Math.min(temp, tRef) - isaTemp);
    if (temp > tRef) {
      weightDelta += 1000 * (runwayLength * tempFactors[2] + tempFactors[3]) * (Math.min(temp, tMax) - tRef);
    }
    if (temp > tMax) {
      weightDelta += 1000 * (runwayLength * tempFactors[4] + tempFactors[5]) * (temp - tMax);
    }
    return weightDelta;
  }

  /** Calculates the wind correction in kg, -ve is a positive increment on the limit weight (deltas are subtracted). */
  private calculateRunwayWindDelta(
    temp: number,
    conf: number,
    isaTemp: number,
    tRef: number,
    tMax: number,
    tFlexMax: number,
    runwayLength: number,
    wind: number,
  ): number {
    if (temp > tFlexMax) {
      return NaN;
    }

    const windFactors =
      wind >= 0
        ? A320251NTakeoffPerformanceCalculator.runwayHeadWindFactor[conf]
        : A320251NTakeoffPerformanceCalculator.runwayTailWindFactor[conf];

    let weightDelta = 1000 * (runwayLength * windFactors[0] + windFactors[1]) * wind;
    if (temp > tRef) {
      weightDelta += 1000 * windFactors[2] * wind * (Math.min(temp, tMax) - tRef);
    }
    if (temp > tMax) {
      weightDelta += 1000 * windFactors[3] * wind * (temp - tMax);
    }

    // cover an edge case near the ends of the data
    if (Math.sign(weightDelta) === Math.sign(wind)) {
      return 0;
    }
    return weightDelta;
  }

  /** Calculates the wind correction in kg, -ve is a positive increment on the limit weight (deltas are subtracted). */
  private calculateSecondSegmentWindDelta(
    temp: number,
    conf: number,
    isaTemp: number,
    tRef: number,
    tMax: number,
    tFlexMax: number,
    runwayLength: number,
    wind: number,
  ): number {
    if (temp > tFlexMax) {
      return NaN;
    }

    const windFactors =
      wind >= 0
        ? A320251NTakeoffPerformanceCalculator.secondSegmentHeadWindFactor[conf]
        : A320251NTakeoffPerformanceCalculator.secondSegmentTailWindFactor[conf];

    let weightDelta = 1000 * (runwayLength * windFactors[0] + windFactors[1]) * wind;
    if (temp > tRef) {
      weightDelta += 1000 * windFactors[2] * wind * (Math.min(temp, tMax) - tRef);
    }
    if (temp > tMax) {
      weightDelta += 1000 * windFactors[3] * wind * (temp - tMax);
    }

    // cover an edge case near the ends of the data
    if (Math.sign(weightDelta) === Math.sign(wind)) {
      return 0;
    }
    return weightDelta;
  }

  /** Calculates the wind correction in kg, -ve is a positive increment on the limit weight (deltas are subtracted). */
  private calculateBrakeEnergyWindDelta(
    temp: number,
    conf: number,
    isaTemp: number,
    tRef: number,
    tMax: number,
    tFlexMax: number,
    runwayLength: number,
    wind: number,
  ): number {
    if (temp > tFlexMax) {
      return NaN;
    }

    const windFactors =
      wind >= 0
        ? A320251NTakeoffPerformanceCalculator.brakeEnergyHeadWindFactor[conf]
        : A320251NTakeoffPerformanceCalculator.brakeEnergyTailWindFactor[conf];

    let weightDelta = 1000 * (runwayLength * windFactors[0] + windFactors[1]) * wind;
    if (temp > tRef) {
      weightDelta += 1000 * windFactors[2] * wind * (Math.min(temp, tMax) - tRef);
    }
    if (temp > tMax) {
      weightDelta += 1000 * windFactors[3] * wind * (temp - tMax);
    }

    // cover an edge case near the ends of the data
    if (Math.sign(weightDelta) === Math.sign(wind)) {
      return 0;
    }
    return weightDelta;
  }

  /** Calculates the wind correction in kg, -ve is a positive increment on the limit weight (deltas are subtracted). */
  private calculateVmcgWindDelta(
    temp: number,
    conf: number,
    isaTemp: number,
    tRef: number,
    tMax: number,
    tFlexMax: number,
    runwayLength: number,
    wind: number,
  ): number {
    if (temp > tFlexMax) {
      return NaN;
    }

    let weightDelta: number;

    if (wind >= 0) {
      const windFactors = A320251NTakeoffPerformanceCalculator.vmcgHeadWindFactor[conf];

      weightDelta = 1000 * (runwayLength * windFactors[0] + windFactors[1]) * wind;
      if (temp > isaTemp) {
        weightDelta +=
          1000 * (runwayLength * windFactors[2] + windFactors[3]) * wind * (Math.min(temp, tRef) - isaTemp);
      }
      if (temp > tRef) {
        weightDelta += 1000 * (runwayLength * windFactors[4] + windFactors[5]) * wind * (Math.min(temp, tMax) - tRef);
      }
      if (temp >= tMax) {
        weightDelta += 1000 * (runwayLength * windFactors[6] + windFactors[7]) * wind * (temp - tMax);
      }
    } else {
      const windFactors = A320251NTakeoffPerformanceCalculator.vmcgTailWindFactor[conf];

      weightDelta = 1000 * (runwayLength * windFactors[0] + windFactors[1]) * wind;
      if (temp > isaTemp) {
        weightDelta +=
          1000 * (runwayLength * windFactors[2] + windFactors[3]) * wind * (Math.min(temp, tRef) - isaTemp);
      }
      if (temp > tRef) {
        weightDelta += 1000 * windFactors[4] * wind * (Math.min(temp, tMax) - tRef);
      }
      if (temp > tMax) {
        weightDelta += 1000 * windFactors[5] * wind * (temp - tMax);
      }
    }

    // cover an edge case near the ends of the data
    if (Math.sign(weightDelta) === Math.sign(wind)) {
      return 0;
    }
    return weightDelta;
  }

  private calculateStabTrim(cg: number): number {
    return MathUtils.round(MathUtils.lerp(cg, 17, 40, 3.8, -2.5, true, true), 0.1);
  }

  /** @inheritdoc */
  public isCgWithinLimits(cg: number, tow: number): boolean {
    const cgLimits = A320251NTakeoffPerformanceCalculator.takeoffCgLimits.get(
      A320251NTakeoffPerformanceCalculator.vec2Cache,
      tow,
    );
    return cg >= cgLimits[0] && cg <= cgLimits[1];
  }
}
