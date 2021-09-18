/* eslint-disable camelcase */
import * as math from 'mathjs';
// DO NOT TOUCH THESE VALUES
const airDistanceCoeff = math.bignumber(math.matrix([
    [-5.64E-02, 1.00E+00, -3.30E-07, 1.38E-10, -8.55E-15, -3.73E-18, 4.77E-22],
    [-1.06E-03, -2.22E-03, -8.92E-10, 1.31E-12, -4.30E-16, 4.02E-20, 0],
    [9.93E-05, 4.89E-06, 1.75E-11, -6.27E-15, 6.91E-19, 0, 0],
    [1.12E-07, -1.11E-08, -1.14E-13, 1.73E-17, 0, 0, 0],
    [-1.30E-08, 3.04E-11, -2.14E-16, 0, 0, 0, 0],
    [-4.07E-12, -5.50E-14, 0, 0, 0, 0, 0],
    [3.74E-13, 0, 0, 0, 0, 0, 0],
]));

// DO NOT TOUCH THESE VALUES
const fuelConsumedCoeff = math.bignumber(math.matrix([
    [4.069435e+02, 1.080068e+01, 1.868617e-03, 4.469823e-06, -1.075694e-09, 1.699993e-13],
    [-1.429171e+01, -8.078463e-02, -7.557951e-05, -6.795487e-09, -1.238178e-12, 0],
    [1.984013e-01, 6.804436e-04, 2.789351e-07, 2.353046e-11, 0, 0],
    [-1.330668e-03, -2.251760e-06, -3.946554e-10, 0, 0, 0],
    [3.930031e-06, 2.634909e-09, 0, 0, 0, 0],
    [-4.209321e-09, 0, 0, 0, 0, 0],
]));

// DO NOT TOUCH THESE VALUES
const timeCoeff = math.bignumber(math.matrix([
    [-2.307264e+02, 1.161741e+00, -1.208222e-03, 1.002013e-07, -2.440974e-11, 4.213891e-15],
    [4.151808e+00, -1.124149e-02, 9.688891e-06, -1.392537e-10, -3.745942e-14, 0],
    [-2.846925e-02, 5.221070e-05, -2.839090e-08, 5.961502e-13, 0, 0],
    [8.892639e-05, -1.087864e-07, 2.572222e-11, 0, 0, 0],
    [-1.236801e-07, 8.777364e-11, 0, 0, 0, 0],
    [5.521856e-11, 0, 0, 0, 0, 0],
]));

// DO NOT TOUCH THESE VALUES
const correctionsCoef = math.bignumber(math.matrix([
    [-4.502431e+00, -2.212160e-03, 1.379723e-05, 9.071250e-08, 3.291840e-12, 3.007572e-18],
    [-1.410121e-01, 7.319389e-04, -1.299149e-06, -5.614996e-10, -1.371330e-14, 0],
    [3.467151e-03, -1.438481e-06, 7.152032e-09, 9.475944e-13, 0, 0],
    [-2.559041e-05, -4.887061e-09, -1.067236e-11, 0, 0, 0],
    [7.616725e-08, 1.345230e-11, 0, 0, 0, 0],
    [-7.977101e-11, 0, 0, 0, 0, 0],
]));

// DO NOT TOUCH THESE VALUES
const altTimeCoef = math.bignumber(math.matrix([
    [-2.491288e+01, 4.715493e-01, -8.365416e-04, -2.578474e-06, 2.125971e-08, -3.165746e-11],
    [2.537249e-01, -1.867867e-03, 1.154863e-05, -6.299859e-08, 1.098651e-10, 0],
    [1.299638e-04, 5.221100e-06, 3.780907e-08, -1.382036e-10, 0, 0],
    [-1.363711e-05, -3.246849e-08, 1.174097e-10, 0, 0, 0],
    [5.570762e-08, -3.605170e-11, 0, 0, 0, 0],
    [-5.290598e-11, 0, 0, 0, 0, 0],
]));

// DO NOT TOUCH THESE VALUES
const altFuelConsumedCoef = math.bignumber(math.matrix([
    [-1.150449e+03, 2.328350e+01, -2.914237e-02, -6.834285e-05, 6.611919e-07, -1.041647e-09],
    [1.122890e+01, -2.179675e-01, 3.322086e-04, -1.966203e-06, 3.776331e-09, 0],
    [3.397620e-02, 1.309511e-03, 1.089408e-06, -5.094745e-09, 0, 0],
    [-8.409842e-04, -4.082921e-06, 4.695926e-09, 0, 0, 0],
    [3.119312e-06, 1.397091e-09, 0, 0, 0, 0],
    [-3.065377e-09, 0, 0, 0, 0, 0],
]));

// DO NOT TOUCH THESE VALUES
const altCorrectionsCoeff = math.bignumber(math.matrix([
    [5.735300e+01, -1.087438e-01, 2.945632e-04, -1.440854e-06, 4.636839e-09, -5.967608e-12],
    [-1.495235e+00, 1.909434e-03, -1.015931e-07, -7.037200e-09, 1.818587e-11, 0],
    [1.484228e-02, -8.755315e-06, 7.469694e-09, -2.930156e-11, 0, 0],
    [-7.065761e-05, 1.559773e-08, 2.511840e-11, 0, 0, 0],
    [1.596208e-07, -2.479681e-11, 0, 0, 0, 0],
    [-1.354973e-10, 0, 0, 0, 0, 0],
]));

// DO NOT TOUCH THESE VALUES
const holdingFFCoeff = math.bignumber(math.matrix([
    [-7.241814e+01, 1.547344e+02, -9.771374e+00, 2.825355e-01, -4.163005e-03, 3.112997e-05, -9.425687e-08],
    [-8.776689e+01, 4.591613e+00, -9.195936e-02, 9.173242e-04, -4.938582e-06, 1.249467e-08, 0],
    [8.290402e-01, -3.535182e-02, 5.086226e-04, -2.918997e-06, 5.495734e-09, 0, 0],
    [-3.263924e-03, 1.145225e-04, -1.177681e-06, 3.652267e-09, 0, 0, 0],
    [5.285811e-06, -1.484045e-07, 8.385686e-10, 0, 0, 0, 0],
    [-2.100748e-09, 5.800337e-11, 0, 0, 0, 0, 0],
    [-1.558294e-12, 0, 0, 0, 0, 0, 0],
]));

const userAltTimeCoeff = math.bignumber(math.matrix([
    [1.934198e+01, -3.211068e-03, 7.848773e-06, -9.051067e-09, 3.631462e-12, -4.555530e-16],
    [-3.851766e-01, 6.104416e-04, 7.078771e-08, -2.693042e-11, 1.890995e-15, 0],
    [2.633289e-03, -4.659318e-06, 5.933422e-11, 1.599828e-14, 0, 0],
    [-7.320044e-06, 1.295341e-08, -1.857516e-13, 0, 0, 0],
    [6.762639e-09, -1.259232e-11, 0, 0, 0, 0],
    [9.144145e-13, 0, 0, 0, 0, 0],
]));

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 7x7 matrix for A predictors
 */
const buildAMatrix7 = (value) => math.bignumber(math.matrix([
    [1, value ** 1, value ** 2, value ** 3, value ** 4, value ** 5, value ** 6],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0],
]));

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 6x6 matrix for A predictors
 */
const buildAMatrix6 = (value) => math.bignumber(math.matrix([
    [1, value ** 1, value ** 2, value ** 3, value ** 4, value ** 5],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0],
]));

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 7x7 matrix for B predictors
 */
const buildBMatrix7 = (value) => math.bignumber(math.matrix([
    [1, 0, 0, 0, 0, 0, 0],
    [value ** 1, 0, 0, 0, 0, 0, 0],
    [value ** 2, 0, 0, 0, 0, 0, 0],
    [value ** 3, 0, 0, 0, 0, 0, 0],
    [value ** 4, 0, 0, 0, 0, 0, 0],
    [value ** 5, 0, 0, 0, 0, 0, 0],
    [value ** 6, 0, 0, 0, 0, 0, 0],
]));

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 6x6 matrix for B predictors
 */
const buildBMatrix6 = (value) => math.bignumber(math.matrix([
    [1, 0, 0, 0, 0, 0],
    [value ** 1, 0, 0, 0, 0, 0],
    [value ** 2, 0, 0, 0, 0, 0],
    [value ** 3, 0, 0, 0, 0, 0],
    [value ** 4, 0, 0, 0, 0, 0],
    [value ** 5, 0, 0, 0, 0, 0],
]));
// TODO Refactor this when you have time
export class A32NX_FuelPred {
    static altCorrection: {
        LOW_AIR_CONDITIONING: number;
        ENGINE_ANTI_ICE_ON: number;
        TOTAL_ANTI_ICE_ON: number;
        LOW_AIR_CONDITIONING_HIGH_FL: number;
        ENGINE_ANTI_ICE_ON_HIGH_FL: number;
        TOTAL_ANTI_ICE_ON_HIGH_FL: number;
    };

    static correction: { LOW_AIR_CONDITIONING: number; ENGINE_ANTI_ICE_ON: number; TOTAL_ANTI_ICE_ON: number; };

    static computations: { TIME: string; FUEL: string; CORRECTIONS: string; };

    static refWeight: number;

    /**
     * Computes a flight time when a user inputs they're own weight for alternate fuel
     * @param {number} fuel - fuel in kg e.g 1200KG
     * @param {number} flightLevel - Flight Level in raw form e.g FL120 = 120
     * @return {number} predicted flight time
     */
    static computeUserAltTime(fuel, flightLevel) {
        const fuelMatrix = buildAMatrix6(fuel);
        const flightLevelMatrix = buildBMatrix6(flightLevel);
        const mmOfFuelFL = math.multiply(flightLevelMatrix, fuelMatrix);
        return (Math.round(math.sum(math.dotMultiply(userAltTimeCoeff, mmOfFuelFL) as any)));
    }

    /**
     * Computes Air Distance in NM using computed polynomial coefficients
     * @param {number} groundDistance - ground distance in NM e.g 200
     * @param {number} windComponent - wind in KTs, HD should be identified with a negative number
     * e.g HD150 == -150 vice versa for tailwind
     * @returns {number} computedAirDistance in NM
     */
    static computeAirDistance(groundDistance, windComponent) {
        const groundMatrix = buildAMatrix7(groundDistance);
        const windMatrix = buildBMatrix7(windComponent);

        const mmOfGroundWind = math.multiply(windMatrix, groundMatrix);
        return (Math.round(math.sum(math.dotMultiply(airDistanceCoeff, mmOfGroundWind) as any)));
    }

    /**
     *
     * @param {number} weight - ZFW weight of the aircraft in padded form e.g 53,000KG = 53
     * @param {number} flightLevel - Flight level in padded form without any alpha chracters e.g FL250 = 250
     * @return {number} predicted fuel flow for one engine per hour e.g result = 600, then 600kg for 30 minutes of holding
     */
    static computeHoldingTrackFF(weight, flightLevel) {
        const weightMatrix = buildAMatrix7(weight);
        const flightLevelMatrix = buildBMatrix7(flightLevel);
        const mmOfWeightFL = math.multiply(flightLevelMatrix, weightMatrix);
        return (Math.round(math.sum(math.dotMultiply(holdingFFCoeff, mmOfWeightFL) as any)));
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
        const airDistanceMatrix = buildAMatrix6(airDistance);
        const flightLevelMatrix = buildBMatrix6(flightLevel);
        const mmOfDistFL = math.multiply(flightLevelMatrix, airDistanceMatrix);
        // TODO Create logic for handling 200NM and FL390 = 0
        switch (computation) {
        case this.computations.FUEL:
            return (Math.round(math.sum(math.dotMultiply((alternate ? altFuelConsumedCoef : fuelConsumedCoeff), mmOfDistFL) as any)));
        case this.computations.TIME:
            return (Math.round(math.sum(math.dotMultiply((alternate ? altTimeCoef : timeCoeff), mmOfDistFL) as any)));
        case this.computations.CORRECTIONS:
            return (Math.round(math.sum(math.dotMultiply((alternate ? altCorrectionsCoeff : correctionsCoef), mmOfDistFL) as any)));
        default:
            return 0;
        }
    }
}

A32NX_FuelPred.refWeight = 55;

A32NX_FuelPred.computations = {
    TIME: 'time',
    FUEL: 'fuel',
    CORRECTIONS: 'corrections',
};

A32NX_FuelPred.correction = {
    LOW_AIR_CONDITIONING: -0.005,
    ENGINE_ANTI_ICE_ON: 0.02,
    TOTAL_ANTI_ICE_ON: 0.05,
};

A32NX_FuelPred.altCorrection = {
    LOW_AIR_CONDITIONING: -0.05,
    ENGINE_ANTI_ICE_ON: 0.02,
    TOTAL_ANTI_ICE_ON: 0.09,
    LOW_AIR_CONDITIONING_HIGH_FL: -0.005,
    ENGINE_ANTI_ICE_ON_HIGH_FL: 0.015,
    TOTAL_ANTI_ICE_ON_HIGH_FL: 0.07,
};
