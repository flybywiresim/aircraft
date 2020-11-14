// DO NOT TOUCH THESE VALUES
const airDistanceCoeff = math.bignumber(math.matrix([
    [-5.64E-02,1.00E+00,-3.30E-07,1.38E-10,-8.55E-15,-3.73E-18,4.77E-22],
    [-1.06E-03,-2.22E-03,-8.92E-10,1.31E-12,-4.30E-16,4.02E-20,0],
    [9.93E-05,4.89E-06,1.75E-11,-6.27E-15,6.91E-19,0,0],
    [1.12E-07,-1.11E-08,-1.14E-13,1.73E-17,0,0,0],
    [-1.30E-08,3.04E-11,-2.14E-16,0,0,0,0],
    [-4.07E-12,-5.50E-14,0,0,0,0,0],
    [3.74E-13,0,0,0,0,0,0]
]));

// DO NOT TOUCH THESE VALUES
const fuelConsumedCoeff = math.bignumber(math.matrix([
    [-1.048830e+06, 1.100051e+02, -4.189034e-03, 9.135252e-07, 2.763159e-11, 2.262649e-14],
    [1.504015e+04, -1.183834e+00, 2.259431e-05, -6.434822e-09, -6.773189e-13, 0],
    [-8.582186e+01, 5.075198e-03, -9.780696e-09, 1.674814e-11, 0, 0],
    [2.435581e-01, -9.912046e-06, -8.158594e-11, 0, 0, 0],
    [-3.434985e-04, 7.483351e-09, 0, 0, 0, 0],
    [1.923913e-07, 0, 0, 0, 0, 0]
]));

// DO NOT TOUCH THESE VALUES
const timeCoeff = math.bignumber(math.matrix([
    [5.614134e+05, -3.039145e+01, 4.316546e-04, -1.734017e-08, 1.426283e-12, 5.335886e-16],
    [-8.194045e+03, 3.460325e-01, -2.939464e-06, 4.627882e-11, -1.714844e-14, 0],
    [4.770323e+01, -1.464326e-03, 6.507908e-09, 1.329098e-13, 0, 0],
    [-1.384741e-01, 2.744817e-06, -5.321168e-12, 0, 0, 0],
    [2.004457e-04, -1.922998e-09, 0, 0, 0, 0],
    [-1.157609e-07, 0, 0, 0, 0, 0]
]));

// DO NOT TOUCH THESE VALUES
const correctionsCoef = math.bignumber(math.matrix ([
    [5.766245e+05, 9.363354e+00, -1.459221e-04, 4.291358e-08, 1.138064e-11, -1.329147e-15],
    [-8.522673e+03, -1.094951e-01, 8.738721e-07, -4.335285e-10, -2.309505e-15, 0],
    [5.023988e+01, 4.795383e-04, -4.552810e-10, 6.393554e-13, 0, 0],
    [-1.476505e-01, -9.295518e-07, -1.493682e-12, 0, 0, 0],
    [2.163486e-04, 6.730100e-10, 0, 0, 0, 0],
    [-1.264493e-07, 0, 0, 0, 0, 0]
]));

// DO NOT TOUCH THESE VALUES
const altTimeCoef = math.bignumber(math.matrix([
    [-2.491288e+01, 4.715493e-01, -8.365416e-04, -2.578474e-06, 2.125971e-08, -3.165746e-11],
    [2.537249e-01, -1.867867e-03, 1.154863e-05, -6.299859e-08, 1.098651e-10, 0],
    [1.299638e-04, 5.221100e-06, 3.780907e-08, -1.382036e-10, 0, 0],
    [-1.363711e-05, -3.246849e-08, 1.174097e-10, 0, 0, 0],
    [5.570762e-08, -3.605170e-11, 0, 0, 0, 0],
    [-5.290598e-11, 0, 0, 0, 0, 0]
]));

// DO NOT TOUCH THESE VALUES
const altFuelConsumedCoef = math.bignumber(math.matrix([
    [-1.150449e+03, 2.328350e+01, -2.914237e-02, -6.834285e-05, 6.611919e-07, -1.041647e-09],
    [1.122890e+01, -2.179675e-01, 3.322086e-04, -1.966203e-06, 3.776331e-09, 0],
    [3.397620e-02, 1.309511e-03, 1.089408e-06, -5.094745e-09, 0, 0],
    [-8.409842e-04, -4.082921e-06, 4.695926e-09, 0, 0, 0],
    [3.119312e-06, 1.397091e-09, 0, 0, 0, 0],
    [-3.065377e-09, 0, 0, 0, 0, 0]
]));

// DO NOT TOUCH THESE VALUES
const altCorrectionsCoeff = math.bignumber(math.matrix([
    [5.735300e+01, -1.087438e-01, 2.945632e-04, -1.440854e-06, 4.636839e-09, -5.967608e-12],
    [-1.495235e+00, 1.909434e-03, -1.015931e-07, -7.037200e-09, 1.818587e-11, 0],
    [1.484228e-02, -8.755315e-06, 7.469694e-09, -2.930156e-11, 0, 0],
    [-7.065761e-05, 1.559773e-08, 2.511840e-11, 0, 0, 0],
    [1.596208e-07, -2.479681e-11, 0, 0, 0, 0],
    [-1.354973e-10, 0, 0, 0, 0, 0]
]));

// DO NOT TOUCH THESE VALUES
const holdingFFCoeff = math.bignumber(math.matrix([
    [-7.241814e+01, 1.547344e+02, -9.771374e+00, 2.825355e-01, -4.163005e-03, 3.112997e-05, -9.425687e-08],
    [-8.776689e+01, 4.591613e+00, -9.195936e-02, 9.173242e-04, -4.938582e-06, 1.249467e-08, 0],
    [8.290402e-01, -3.535182e-02, 5.086226e-04, -2.918997e-06, 5.495734e-09, 0, 0],
    [-3.263924e-03, 1.145225e-04, -1.177681e-06, 3.652267e-09, 0, 0, 0],
    [5.285811e-06, -1.484045e-07, 8.385686e-10, 0, 0, 0, 0],
    [-2.100748e-09, 5.800337e-11, 0, 0, 0, 0, 0],
    [-1.558294e-12, 0, 0, 0, 0, 0, 0]
]));

const userAltTimeCoeff = math.bignumber(math.matrix([
    [1.934198e+01, -3.211068e-03, 7.848773e-06, -9.051067e-09, 3.631462e-12, -4.555530e-16],
    [-3.851766e-01, 6.104416e-04, 7.078771e-08, -2.693042e-11, 1.890995e-15, 0],
    [2.633289e-03, -4.659318e-06, 5.933422e-11, 1.599828e-14, 0, 0],
    [-7.320044e-06, 1.295341e-08, -1.857516e-13, 0, 0, 0],
    [6.762639e-09, -1.259232e-11, 0, 0, 0, 0],
    [9.144145e-13, 0, 0, 0, 0, 0]
]));

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 7x7 matrix for A predictors
 */
const _buildAMatrix7 = (value) => {
    return math.bignumber(math.matrix([
        [1, value ** 1, value ** 2, value ** 3, value ** 4, value ** 5, value ** 6],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
        [0,0,0,0,0,0,0],
    ]));
};

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 6x6 matrix for A predictors
 */
const _buildAMatrix6 = (value) => {
    return math.bignumber(math.matrix([
        [1, value ** 1, value ** 2, value ** 3, value ** 4, value ** 5],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0],
        [0,0,0,0,0,0],
    ]));
};

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 7x7 matrix for B predictors
 */
const _buildBMatrix7 = (value) => {
    return math.bignumber(math.matrix([
        [1,0,0,0,0,0,0],
        [value ** 1,0,0,0,0,0,0],
        [value ** 2,0,0,0,0,0,0],
        [value ** 3,0,0,0,0,0,0],
        [value ** 4,0,0,0,0,0,0],
        [value ** 5,0,0,0,0,0,0],
        [value ** 6,0,0,0,0,0,0],
    ]));
};

/**
 * @param {number}value - the value to build the matrix from
 * @returns {math.matrix} return a 6x6 matrix for B predictors
 */
const _buildBMatrix6 = (value) => {
    return math.bignumber(math.matrix([
        [1,0,0,0,0,0],
        [value ** 1,0,0,0,0,0],
        [value ** 2,0,0,0,0,0],
        [value ** 3,0,0,0,0,0],
        [value ** 4,0,0,0,0,0],
        [value ** 5,0,0,0,0,0],
    ]));
};
//TODO Refactor this when you have time
class A32NX_FuelPred {

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
        return (Math.round(math.sum(math.dotMultiply(userAltTimeCoeff, mmOfFuelFL))));
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
        return (Math.round(math.sum(math.dotMultiply(airDistanceCoeff,mmOfGroundWind))));
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
        return (Math.round(math.sum(math.dotMultiply(holdingFFCoeff,mmOfWeightFL))));
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
        if (!alternate) {
            switch (computation) {
                case this.computations.FUEL:
                    const deviation = 0;
                    return (Math.round(math.sum(math.dotMultiply(fuelConsumedCoeff,mmOfDistFL)))) + deviation;
                case this.computations.TIME:
                    return (Math.round(math.sum(math.dotMultiply(timeCoeff,mmOfDistFL))));
                case this.computations.CORRECTIONS:
                    return (Math.round(math.sum(math.dotMultiply(correctionsCoef,mmOfDistFL))));
            }
        } else {
            switch (computation) {
                case this.computations.FUEL:
                    const deviation = 0;
                    return (Math.round(math.sum(math.dotMultiply(altFuelConsumedCoef,mmOfDistFL)))) + deviation;
                case this.computations.TIME:
                    return (Math.round(math.sum(math.dotMultiply(altTimeCoef,mmOfDistFL))));
                case this.computations.CORRECTIONS:
                    return (Math.round(math.sum(math.dotMultiply(altCorrectionsCoeff,mmOfDistFL))));
            }
        }
    }

    constructor() {
    }
}

A32NX_FuelPred.refWeight = 55;

A32NX_FuelPred.computations = {
    TIME:"time",
    FUEL:"fuel",
    CORRECTIONS:"corrections"
};

A32NX_FuelPred.correction = {
    LOW_AIR_CONDITIONING : -0.005,
    ENGINE_ANTI_ICE_ON : 0.02,
    TOTAL_ANTI_ICE_ON : 0.05,
};

A32NX_FuelPred.altCorrection = {
    LOW_AIR_CONDITIONING: -0.05,
    ENGINE_ANTI_ICE_ON: 0.02,
    TOTAL_ANTI_ICE_ON: 0.09,
    LOW_AIR_CONDITIONING_HIGH_FL: -0.005,
    ENGINE_ANTI_ICE_ON_HIGH_FL : 0.015,
    TOTAL_ANTI_ICE_ON_HIGH_FL : 0.07
};
