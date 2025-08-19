// @ts-strict-ignore
import * as math from 'mathjs';

export enum FuelPlanningPhases {
  PLANNING = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
}

// DO NOT TOUCH THESE VALUES
const airDistanceCoeff = math.bignumber(
  math.matrix([
    [-5.64e-2, 1.0, -3.3e-7, 1.38e-10, -8.55e-15, -3.73e-18, 4.77e-22],
    [-1.06e-3, -2.22e-3, -8.92e-10, 1.31e-12, -4.3e-16, 4.02e-20, 0],
    [9.93e-5, 4.89e-6, 1.75e-11, -6.27e-15, 6.91e-19, 0, 0],
    [1.12e-7, -1.11e-8, -1.14e-13, 1.73e-17, 0, 0, 0],
    [-1.3e-8, 3.04e-11, -2.14e-16, 0, 0, 0, 0],
    [-4.07e-12, -5.5e-14, 0, 0, 0, 0, 0],
    [3.74e-13, 0, 0, 0, 0, 0, 0],
  ]),
);

// DO NOT TOUCH THESE VALUES
const fuelConsumedCoeff = math.bignumber(
  math.matrix([
    [4.069435e2, 1.080068e1, 1.868617e-3, 4.469823e-6, -1.075694e-9, 1.699993e-13],
    [-1.429171e1, -8.078463e-2, -7.557951e-5, -6.795487e-9, -1.238178e-12, 0],
    [1.984013e-1, 6.804436e-4, 2.789351e-7, 2.353046e-11, 0, 0],
    [-1.330668e-3, -2.25176e-6, -3.946554e-10, 0, 0, 0],
    [3.930031e-6, 2.634909e-9, 0, 0, 0, 0],
    [-4.209321e-9, 0, 0, 0, 0, 0],
  ]),
);

// DO NOT TOUCH THESE VALUES
const timeCoeff = math.bignumber(
  math.matrix([
    [-2.307264e2, 1.161741, -1.208222e-3, 1.002013e-7, -2.440974e-11, 4.213891e-15],
    [4.151808, -1.124149e-2, 9.688891e-6, -1.392537e-10, -3.745942e-14, 0],
    [-2.846925e-2, 5.22107e-5, -2.83909e-8, 5.961502e-13, 0, 0],
    [8.892639e-5, -1.087864e-7, 2.572222e-11, 0, 0, 0],
    [-1.236801e-7, 8.777364e-11, 0, 0, 0, 0],
    [5.521856e-11, 0, 0, 0, 0, 0],
  ]),
);

// DO NOT TOUCH THESE VALUES
const correctionsCoef = math.bignumber(
  math.matrix([
    [-4.502431, -2.21216e-3, 1.379723e-5, 9.07125e-8, 3.29184e-12, 3.007572e-18],
    [-1.410121e-1, 7.319389e-4, -1.299149e-6, -5.614996e-10, -1.37133e-14, 0],
    [3.467151e-3, -1.438481e-6, 7.152032e-9, 9.475944e-13, 0, 0],
    [-2.559041e-5, -4.887061e-9, -1.067236e-11, 0, 0, 0],
    [7.616725e-8, 1.34523e-11, 0, 0, 0, 0],
    [-7.977101e-11, 0, 0, 0, 0, 0],
  ]),
);

// DO NOT TOUCH THESE VALUES
const altTimeCoef = math.bignumber(
  math.matrix([
    [-2.491288e1, 4.715493e-1, -8.365416e-4, -2.578474e-6, 2.125971e-8, -3.165746e-11],
    [2.537249e-1, -1.867867e-3, 1.154863e-5, -6.299859e-8, 1.098651e-10, 0],
    [1.299638e-4, 5.2211e-6, 3.780907e-8, -1.382036e-10, 0, 0],
    [-1.363711e-5, -3.246849e-8, 1.174097e-10, 0, 0, 0],
    [5.570762e-8, -3.60517e-11, 0, 0, 0, 0],
    [-5.290598e-11, 0, 0, 0, 0, 0],
  ]),
);

// DO NOT TOUCH THESE VALUES
const altFuelConsumedCoef = math.bignumber(
  math.matrix([
    [-1.150449e3, 2.32835e1, -2.914237e-2, -6.834285e-5, 6.611919e-7, -1.041647e-9],
    [1.12289e1, -2.179675e-1, 3.322086e-4, -1.966203e-6, 3.776331e-9, 0],
    [3.39762e-2, 1.309511e-3, 1.089408e-6, -5.094745e-9, 0, 0],
    [-8.409842e-4, -4.082921e-6, 4.695926e-9, 0, 0, 0],
    [3.119312e-6, 1.397091e-9, 0, 0, 0, 0],
    [-3.065377e-9, 0, 0, 0, 0, 0],
  ]),
);

// DO NOT TOUCH THESE VALUES
const altCorrectionsCoeff = math.bignumber(
  math.matrix([
    [5.7353e1, -1.087438e-1, 2.945632e-4, -1.440854e-6, 4.636839e-9, -5.967608e-12],
    [-1.495235, 1.909434e-3, -1.015931e-7, -7.0372e-9, 1.818587e-11, 0],
    [1.484228e-2, -8.755315e-6, 7.469694e-9, -2.930156e-11, 0, 0],
    [-7.065761e-5, 1.559773e-8, 2.51184e-11, 0, 0, 0],
    [1.596208e-7, -2.479681e-11, 0, 0, 0, 0],
    [-1.354973e-10, 0, 0, 0, 0, 0],
  ]),
);

// DO NOT TOUCH THESE VALUES
const holdingFFCoeff = math.bignumber(
  math.matrix([
    [-7.241814e1, 1.547344e2, -9.771374, 2.825355e-1, -4.163005e-3, 3.112997e-5, -9.425687e-8],
    [-8.776689e1, 4.591613, -9.195936e-2, 9.173242e-4, -4.938582e-6, 1.249467e-8, 0],
    [8.290402e-1, -3.535182e-2, 5.086226e-4, -2.918997e-6, 5.495734e-9, 0, 0],
    [-3.263924e-3, 1.145225e-4, -1.177681e-6, 3.652267e-9, 0, 0, 0],
    [5.285811e-6, -1.484045e-7, 8.385686e-10, 0, 0, 0, 0],
    [-2.100748e-9, 5.800337e-11, 0, 0, 0, 0, 0],
    [-1.558294e-12, 0, 0, 0, 0, 0, 0],
  ]),
);

const userAltTimeCoeff = math.bignumber(
  math.matrix([
    [1.934198e1, -3.211068e-3, 7.848773e-6, -9.051067e-9, 3.631462e-12, -4.55553e-16],
    [-3.851766e-1, 6.104416e-4, 7.078771e-8, -2.693042e-11, 1.890995e-15, 0],
    [2.633289e-3, -4.659318e-6, 5.933422e-11, 1.599828e-14, 0, 0],
    [-7.320044e-6, 1.295341e-8, -1.857516e-13, 0, 0, 0],
    [6.762639e-9, -1.259232e-11, 0, 0, 0, 0],
    [9.144145e-13, 0, 0, 0, 0, 0],
  ]),
);

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 7x7 matrix for A predictors
 */
const _buildAMatrix7 = (value) => {
  return math.bignumber(
    math.matrix([
      [1, value ** 1, value ** 2, value ** 3, value ** 4, value ** 5, value ** 6],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ]),
  );
};

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 6x6 matrix for A predictors
 */
const _buildAMatrix6 = (value) => {
  return math.bignumber(
    math.matrix([
      [1, value ** 1, value ** 2, value ** 3, value ** 4, value ** 5],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0],
    ]),
  );
};

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 7x7 matrix for B predictors
 */
const _buildBMatrix7 = (value) => {
  return math.bignumber(
    math.matrix([
      [1, 0, 0, 0, 0, 0, 0],
      [value ** 1, 0, 0, 0, 0, 0, 0],
      [value ** 2, 0, 0, 0, 0, 0, 0],
      [value ** 3, 0, 0, 0, 0, 0, 0],
      [value ** 4, 0, 0, 0, 0, 0, 0],
      [value ** 5, 0, 0, 0, 0, 0, 0],
      [value ** 6, 0, 0, 0, 0, 0, 0],
    ]),
  );
};

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 6x6 matrix for B predictors
 */
const _buildBMatrix6 = (value) => {
  return math.bignumber(
    math.matrix([
      [1, 0, 0, 0, 0, 0],
      [value ** 1, 0, 0, 0, 0, 0],
      [value ** 2, 0, 0, 0, 0, 0],
      [value ** 3, 0, 0, 0, 0, 0],
      [value ** 4, 0, 0, 0, 0, 0],
      [value ** 5, 0, 0, 0, 0, 0],
    ]),
  );
};

// math.js typings seem to not be nice... it says it may return a complex number when it shouldn't
function isComplex(v: math.MathScalarType): v is math.Complex {
  return typeof v === 'object' && 'im' in v;
}

function getRealNumber(v: math.MathScalarType): number {
  // should throw maybe??
  return isComplex(v) ? v.re : math.number(v);
}

//TODO Refactor this when you have time
export class A32NX_FuelPred {
  public static refWeight = 55;

  public static computations = {
    TIME: 'time',
    FUEL: 'fuel',
    CORRECTIONS: 'corrections',
  };

  public static correction = {
    LOW_AIR_CONDITIONING: -0.005,
    ENGINE_ANTI_ICE_ON: 0.02,
    TOTAL_ANTI_ICE_ON: 0.05,
  };

  public static altCorrection = {
    LOW_AIR_CONDITIONING: -0.05,
    ENGINE_ANTI_ICE_ON: 0.02,
    TOTAL_ANTI_ICE_ON: 0.09,
    LOW_AIR_CONDITIONING_HIGH_FL: -0.005,
    ENGINE_ANTI_ICE_ON_HIGH_FL: 0.015,
    TOTAL_ANTI_ICE_ON_HIGH_FL: 0.07,
  };

  /**
   * Computes a flight time when a user inputs they're own weight for alternate fuel
   * @param {number} fuel - fuel in kg e.g 1200KG
   * @param {number} flightLevel - Flight Level in raw form e.g FL120 = 120
   * @return {number} predicted flight time
   */
  static computeUserAltTime(fuel, flightLevel) {
    const fuelMatrix = _buildAMatrix6(fuel);
    const flightLevelMatrix = _buildBMatrix6(flightLevel);
    const mmOfFuelFL = math.multiply(flightLevelMatrix, fuelMatrix);
    return Math.round(getRealNumber(math.sum(math.dotMultiply(userAltTimeCoeff, mmOfFuelFL))));
  }

  /**
   * Computes Air Distance in NM using computed polynomial coefficients
   * @param {number} groundDistance - ground distance in NM e.g 200
   * @param {number} windComponent - wind in KTs, HD should be identified with a negative number
   * e.g HD150 == -150 vice versa for tailwind
   * @returns {number} computedAirDistance in NM
   */
  static computeAirDistance(groundDistance, windComponent) {
    const groundMatrix = _buildAMatrix7(groundDistance);
    const windMatrix = _buildBMatrix7(windComponent);

    const mmOfGroundWind = math.multiply(windMatrix, groundMatrix);
    return Math.round(getRealNumber(math.sum(math.dotMultiply(airDistanceCoeff, mmOfGroundWind))));
  }

  /**
   *
   * @param {number} weight - ZFW weight of the aircraft in padded form e.g 53,000KG = 53
   * @param {number} flightLevel - Flight level in padded form without any alpha chracters e.g FL250 = 250
   * @return {number} predicted fuel flow for one engine per hour e.g result = 600, then 600kg for 30 minutes of holding
   */
  static computeHoldingTrackFF(weight, flightLevel) {
    const weightMatrix = _buildAMatrix7(weight);
    const flightLevelMatrix = _buildBMatrix7(flightLevel);
    const mmOfWeightFL = math.multiply(flightLevelMatrix, weightMatrix);
    return Math.round(getRealNumber(math.sum(math.dotMultiply(holdingFFCoeff, mmOfWeightFL))));
  }

  /**
   * Computes time, fuel and corrections needed for a trip or alternate //TODO work on a new method name
   * @param {number} airDistance - air distance in NM e.g 200
   * @param {number} flightLevel - cruising flight level e.g FL290 == 290
   * @param {computations} computation - ENUM of either TIME, FUEL or CORRECTIONS
   * @param {boolean} alternate - States whether this computations is for an alternate destination or not
   * @returns {number} fuel consumed in KG
   */
  static computeNumbers(airDistance, flightLevel, computation, alternate) {
    const airDistanceMatrix = _buildAMatrix6(airDistance);
    const flightLevelMatrix = _buildBMatrix6(flightLevel);
    const mmOfDistFL = math.multiply(flightLevelMatrix, airDistanceMatrix);
    //TODO Create logic for handling 200NM and FL390 = 0
    switch (computation) {
      case this.computations.FUEL:
        return Math.round(
          getRealNumber(math.sum(math.dotMultiply(alternate ? altFuelConsumedCoef : fuelConsumedCoeff, mmOfDistFL))),
        );
      case this.computations.TIME:
        return Math.round(getRealNumber(math.sum(math.dotMultiply(alternate ? altTimeCoef : timeCoeff, mmOfDistFL))));
      case this.computations.CORRECTIONS:
        return Math.round(
          getRealNumber(math.sum(math.dotMultiply(alternate ? altCorrectionsCoeff : correctionsCoef, mmOfDistFL))),
        );
    }
  }

  constructor() {}
}
