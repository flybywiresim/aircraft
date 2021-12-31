/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

// Data and calculations obtained from Quick Reference Handbook (In Flight Procedures, Landing Performance Assessment/Landing Distance)

import { getTailWind } from './CommonCalculations';

export enum LandingRunwayConditions {
    Dry,
    Good,
    GoodMedium,
    Medium,
    MediumPoor,
    Poor,
}

export enum LandingFlapsConfig {
    Conf3,
    Full
}

export enum AutobrakeMode {
    Low,
    Medium,
    Max // Manual brake is the same as max auto
}

/**
 * Landing data for a specific aircraft configuration with a specific runway condition
 */
type LandingData = {
    refDistance: number,
    weightCorrectionAbove: number, // per 1T above 68T
    weightCorrectionBelow: number, // per 1T below 68T
    speedCorrection: number, // Per 5kt
    altitudeCorrection: number, // Per 1000ft ASL
    windCorrection: number, // Per 5KT tail wind
    tempCorrection: number, // Per 10 deg C above ISA
    slopeCorrection: number, // Per 1% down slope
    reverserCorrection: number, // Per thrust reverser operative
    overweightProcedureCorrection: number // If overweight procedure applied
};

type FlapsConfigLandingData = {
    [flapsConfig in LandingFlapsConfig]: LandingData
};

type AutobrakeConfigLandingData = {
    [autobrakeConfig in AutobrakeMode]: FlapsConfigLandingData
}

type RunwayConditionLandingData = {
    [runwayCondition in LandingRunwayConditions]: AutobrakeConfigLandingData;
}

const dryRunwayLandingData: AutobrakeConfigLandingData = {
    [AutobrakeMode.Max]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1060,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -10,
            speedCorrection: 70,
            altitudeCorrection: 40,
            windCorrection: 130,
            tempCorrection: 30,
            slopeCorrection: 20,
            reverserCorrection: 0,
            overweightProcedureCorrection: 910,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 1210,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -10,
            speedCorrection: 80,
            altitudeCorrection: 50,
            windCorrection: 130,
            tempCorrection: 40,
            slopeCorrection: 30,
            reverserCorrection: -10,
            overweightProcedureCorrection: 1080,
        },
    },
    [AutobrakeMode.Medium]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1330,
            weightCorrectionAbove: 30,
            weightCorrectionBelow: -10,
            speedCorrection: 90,
            altitudeCorrection: 50,
            windCorrection: 140,
            tempCorrection: 40,
            slopeCorrection: 10,
            reverserCorrection: 0,
            overweightProcedureCorrection: 220,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 1510,
            weightCorrectionAbove: 40,
            weightCorrectionBelow: -10,
            speedCorrection: 100,
            altitudeCorrection: 50,
            windCorrection: 140,
            tempCorrection: 50,
            slopeCorrection: 10,
            reverserCorrection: 0,
            overweightProcedureCorrection: 230,
        },
    },
    [AutobrakeMode.Low]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1860,
            weightCorrectionAbove: 40,
            weightCorrectionBelow: -10,
            speedCorrection: 130,
            altitudeCorrection: 70,
            windCorrection: 200,
            tempCorrection: 70,
            slopeCorrection: 30,
            reverserCorrection: 0,
            overweightProcedureCorrection: 210,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 2160,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -10,
            speedCorrection: 140,
            altitudeCorrection: 80,
            windCorrection: 220,
            tempCorrection: 70,
            slopeCorrection: 30,
            reverserCorrection: -10,
            overweightProcedureCorrection: 230,
        },
    },
};

const goodRunwayLandingData: AutobrakeConfigLandingData = {
    [AutobrakeMode.Max]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1320,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -10,
            speedCorrection: 110,
            altitudeCorrection: 70,
            windCorrection: 200,
            tempCorrection: 60,
            slopeCorrection: 50,
            reverserCorrection: -20,
            overweightProcedureCorrection: 710,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 1570,
            weightCorrectionAbove: 60,
            weightCorrectionBelow: -20,
            speedCorrection: 120,
            altitudeCorrection: 80,
            windCorrection: 230,
            tempCorrection: 70,
            slopeCorrection: 60,
            reverserCorrection: -30,
            overweightProcedureCorrection: 810,
        },
    },
    [AutobrakeMode.Medium]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1380,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -10,
            speedCorrection: 110,
            altitudeCorrection: 70,
            windCorrection: 200,
            tempCorrection: 60,
            slopeCorrection: 50,
            reverserCorrection: 0,
            overweightProcedureCorrection: 200,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 1630,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -20,
            speedCorrection: 120,
            altitudeCorrection: 80,
            windCorrection: 230,
            tempCorrection: 70,
            slopeCorrection: 60,
            reverserCorrection: -20,
            overweightProcedureCorrection: 290,
        },
    },
    [AutobrakeMode.Low]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1860,
            weightCorrectionAbove: 40,
            weightCorrectionBelow: -10,
            speedCorrection: 130,
            altitudeCorrection: 70,
            windCorrection: 200,
            tempCorrection: 70,
            slopeCorrection: 30,
            reverserCorrection: 0,
            overweightProcedureCorrection: 210,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 2160,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -20,
            speedCorrection: 140,
            altitudeCorrection: 80,
            windCorrection: 220,
            tempCorrection: 70,
            slopeCorrection: 30,
            reverserCorrection: -10,
            overweightProcedureCorrection: 230,
        },
    },
};

const goodMediumRunwayLandingData: AutobrakeConfigLandingData = {
    [AutobrakeMode.Max]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1570,
            weightCorrectionAbove: 40,
            weightCorrectionBelow: -10,
            speedCorrection: 100,
            altitudeCorrection: 60,
            windCorrection: 190,
            tempCorrection: 60,
            slopeCorrection: 70,
            reverserCorrection: -50,
            overweightProcedureCorrection: 800,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 1820,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -20,
            speedCorrection: 100,
            altitudeCorrection: 70,
            windCorrection: 200,
            tempCorrection: 70,
            slopeCorrection: 80,
            reverserCorrection: -80,
            overweightProcedureCorrection: 930,
        },
    },
    [AutobrakeMode.Medium]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1620,
            weightCorrectionAbove: 40,
            weightCorrectionBelow: -10,
            speedCorrection: 100,
            altitudeCorrection: 60,
            windCorrection: 190,
            tempCorrection: 60,
            slopeCorrection: 80,
            reverserCorrection: -60,
            overweightProcedureCorrection: 200,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 1870,
            weightCorrectionAbove: 40,
            weightCorrectionBelow: -20,
            speedCorrection: 100,
            altitudeCorrection: 70,
            windCorrection: 200,
            tempCorrection: 70,
            slopeCorrection: 90,
            reverserCorrection: -90,
            overweightProcedureCorrection: 280,
        },
    },
    [AutobrakeMode.Low]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1880,
            weightCorrectionAbove: 40,
            weightCorrectionBelow: -10,
            speedCorrection: 130,
            altitudeCorrection: 70,
            windCorrection: 210,
            tempCorrection: 60,
            slopeCorrection: 50,
            reverserCorrection: -10,
            overweightProcedureCorrection: 210,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 2170,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -20,
            speedCorrection: 140,
            altitudeCorrection: 80,
            windCorrection: 220,
            tempCorrection: 80,
            slopeCorrection: 60,
            reverserCorrection: -30,
            overweightProcedureCorrection: 230,
        },
    },
};

const mediumRunwayLandingData: AutobrakeConfigLandingData = {
    [AutobrakeMode.Max]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1760,
            weightCorrectionAbove: 40,
            weightCorrectionBelow: -10,
            speedCorrection: 100,
            altitudeCorrection: 70,
            windCorrection: 220,
            tempCorrection: 60,
            slopeCorrection: 110,
            reverserCorrection: -90,
            overweightProcedureCorrection: 750,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 2050,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -20,
            speedCorrection: 110,
            altitudeCorrection: 80,
            windCorrection: 240,
            tempCorrection: 70,
            slopeCorrection: 120,
            reverserCorrection: -130,
            overweightProcedureCorrection: 880,
        },
    },
    [AutobrakeMode.Medium]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1810,
            weightCorrectionAbove: 40,
            weightCorrectionBelow: -10,
            speedCorrection: 110,
            altitudeCorrection: 70,
            windCorrection: 230,
            tempCorrection: 60,
            slopeCorrection: 110,
            reverserCorrection: -100,
            overweightProcedureCorrection: 200,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 2100,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -20,
            speedCorrection: 110,
            altitudeCorrection: 80,
            windCorrection: 240,
            tempCorrection: 70,
            slopeCorrection: 130,
            reverserCorrection: -140,
            overweightProcedureCorrection: 300,
        },
    },
    [AutobrakeMode.Low]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1960,
            weightCorrectionAbove: 40,
            weightCorrectionBelow: -10,
            speedCorrection: 130,
            altitudeCorrection: 70,
            windCorrection: 240,
            tempCorrection: 70,
            slopeCorrection: 100,
            reverserCorrection: -40,
            overweightProcedureCorrection: 230,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 2270,
            weightCorrectionAbove: 50,
            weightCorrectionBelow: -20,
            speedCorrection: 140,
            altitudeCorrection: 80,
            windCorrection: 250,
            tempCorrection: 80,
            slopeCorrection: 110,
            reverserCorrection: -70,
            overweightProcedureCorrection: 260,
        },
    },
};

const mediumPoorRunwayLandingData: AutobrakeConfigLandingData = {
    [AutobrakeMode.Max]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1930,
            weightCorrectionAbove: 70,
            weightCorrectionBelow: -10,
            speedCorrection: 170,
            altitudeCorrection: 110,
            windCorrection: 350,
            tempCorrection: 100,
            slopeCorrection: 150,
            reverserCorrection: -110,
            overweightProcedureCorrection: 480,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 2380,
            weightCorrectionAbove: 80,
            weightCorrectionBelow: -30,
            speedCorrection: 170,
            altitudeCorrection: 140,
            windCorrection: 410,
            tempCorrection: 120,
            slopeCorrection: 200,
            reverserCorrection: -150,
            overweightProcedureCorrection: 580,
        },
    },
    [AutobrakeMode.Medium]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 1960,
            weightCorrectionAbove: 70,
            weightCorrectionBelow: -10,
            speedCorrection: 160,
            altitudeCorrection: 110,
            windCorrection: 360,
            tempCorrection: 90,
            slopeCorrection: 150,
            reverserCorrection: -110,
            overweightProcedureCorrection: 230,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 2400,
            weightCorrectionAbove: 80,
            weightCorrectionBelow: -30,
            speedCorrection: 170,
            altitudeCorrection: 140,
            windCorrection: 410,
            tempCorrection: 120,
            slopeCorrection: 200,
            reverserCorrection: -160,
            overweightProcedureCorrection: 310,
        },
    },
    [AutobrakeMode.Low]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 2000,
            weightCorrectionAbove: 70,
            weightCorrectionBelow: -10,
            speedCorrection: 160,
            altitudeCorrection: 120,
            windCorrection: 360,
            tempCorrection: 90,
            slopeCorrection: 150,
            reverserCorrection: -40,
            overweightProcedureCorrection: 220,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 2430,
            weightCorrectionAbove: 80,
            weightCorrectionBelow: -30,
            speedCorrection: 180,
            altitudeCorrection: 140,
            windCorrection: 400,
            tempCorrection: 130,
            slopeCorrection: 210,
            reverserCorrection: -80,
            overweightProcedureCorrection: 290,
        },
    },
};

const poorRunwayLandingData: AutobrakeConfigLandingData = {
    [AutobrakeMode.Max]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 2760,
            weightCorrectionAbove: 60,
            weightCorrectionBelow: -20,
            speedCorrection: 140,
            altitudeCorrection: 110,
            windCorrection: 430,
            tempCorrection: 110,
            slopeCorrection: 460,
            reverserCorrection: -370,
            overweightProcedureCorrection: 550,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 3250,
            weightCorrectionAbove: 70,
            weightCorrectionBelow: -30,
            speedCorrection: 150,
            altitudeCorrection: 130,
            windCorrection: 470,
            tempCorrection: 130,
            slopeCorrection: 550,
            reverserCorrection: -490,
            overweightProcedureCorrection: 660,
        },
    },
    [AutobrakeMode.Medium]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 2790,
            weightCorrectionAbove: 60,
            weightCorrectionBelow: -20,
            speedCorrection: 130,
            altitudeCorrection: 110,
            windCorrection: 440,
            tempCorrection: 100,
            slopeCorrection: 470,
            reverserCorrection: -380,
            overweightProcedureCorrection: 230,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 3280,
            weightCorrectionAbove: 70,
            weightCorrectionBelow: -30,
            speedCorrection: 150,
            altitudeCorrection: 130,
            windCorrection: 470,
            tempCorrection: 120,
            slopeCorrection: 560,
            reverserCorrection: -490,
            overweightProcedureCorrection: 310,
        },
    },
    [AutobrakeMode.Low]: {
        [LandingFlapsConfig.Full]: {
            refDistance: 2830,
            weightCorrectionAbove: 60,
            weightCorrectionBelow: -20,
            speedCorrection: 140,
            altitudeCorrection: 110,
            windCorrection: 440,
            tempCorrection: 110,
            slopeCorrection: 470,
            reverserCorrection: -380,
            overweightProcedureCorrection: 220,
        },
        [LandingFlapsConfig.Conf3]: {
            refDistance: 3330,
            weightCorrectionAbove: 70,
            weightCorrectionBelow: -30,
            speedCorrection: 140,
            altitudeCorrection: 130,
            windCorrection: 470,
            tempCorrection: 120,
            slopeCorrection: 560,
            reverserCorrection: -500,
            overweightProcedureCorrection: 290,
        },
    },
};

/**
 * Stores all landing data for the aircraft.
 * Retrieve with runwayConditionLandingData[runwayCondition][autobrakeMode][flapsConfig]
 */
const runwayConditionLandingData: RunwayConditionLandingData = {
    [LandingRunwayConditions.Dry]: dryRunwayLandingData,
    [LandingRunwayConditions.Good]: goodRunwayLandingData,
    [LandingRunwayConditions.GoodMedium]: goodMediumRunwayLandingData,
    [LandingRunwayConditions.Medium]: mediumRunwayLandingData,
    [LandingRunwayConditions.MediumPoor]: mediumPoorRunwayLandingData,
    [LandingRunwayConditions.Poor]: poorRunwayLandingData,
};

/**
 * Safety margin multiplier, obtained from QRH In-Flight Performance section
 */
const safetyMargin = 1.15;

/**
 * VLS speed (kts) for full flap configuration
 * Index 0 = 40T, Index 8 = 80T, 5T increment
 */
const confFullVls = [116, 116, 116, 120, 125, 130, 135, 139, 143];

/**
 * VLS speed (kts) for conf 3 flaps
 * Index 0 = 40T, Index 8 = 80T, 5T increment
 */
const conf3Vls = [116, 116, 124, 130, 136, 141, 146, 151, 155];

/**
 * Converts mass into an index from 0-8 for use with VLS tables
 * @param mass Mass in tons
 */
function getVlsTableIndex(mass: number): number {
    const index = Math.ceil(((mass > 80 ? 80 : mass) - 40) / 5);
    return index >= 0
        ? index
        : 0;
}

export default class LandingCalculator {
    /**
     * Calculates the landing distances for each autobrake mode for the given conditions
     * @param weight Aircraft weight in KGs
     * @param flaps Flap Configuration
     * @param runwayCondition
     * @param approachSpeed Actual approach speed in kts
     * @param windDirection Heading wind is coming from, relative to north
     * @param windMagnitude Magnitude of wind in Knots
     * @param runwayHeading Heading of runway relative to north
     * @param reverseThrust Indicates if reverse thrust is active
     * @param altitude Runway altitude in feet ASL
     * @param temperature OAT of runway
     * @param slope Runway slope in %. Negative is downward slope
     * @param overweightProcedure Overweight procedure is being used if true
     */
    public calculateLandingDistances(weight: number, flaps: LandingFlapsConfig, runwayCondition: LandingRunwayConditions,
        approachSpeed: number, windDirection: number, windMagnitude: number, runwayHeading: number, reverseThrust: boolean, altitude: number,
        temperature: number, slope: number, overweightProcedure: boolean, pressure: number): { maxAutobrakeDist: number, mediumAutobrakeDist: number, lowAutobrakeDist: number} {
        return {
            maxAutobrakeDist: safetyMargin
                * this.calculateRequiredLandingDistance(weight, flaps, runwayCondition, AutobrakeMode.Max, approachSpeed,
                    windDirection, windMagnitude, runwayHeading, reverseThrust, altitude, temperature, slope, overweightProcedure, pressure),
            mediumAutobrakeDist: safetyMargin
                * this.calculateRequiredLandingDistance(weight, flaps, runwayCondition, AutobrakeMode.Medium, approachSpeed,
                    windDirection, windMagnitude, runwayHeading, reverseThrust, altitude, temperature, slope, overweightProcedure, pressure),
            lowAutobrakeDist: safetyMargin
                * this.calculateRequiredLandingDistance(weight, flaps, runwayCondition, AutobrakeMode.Low, approachSpeed,
                    windDirection, windMagnitude, runwayHeading, reverseThrust, altitude, temperature, slope, overweightProcedure, pressure),
        };
    }

    /**
     * Calculates the required landing distance for the given conditions
     * @param weight Aircraft weight in KGs
     * @param flaps Flap Configuration
     * @param runwayCondition
     * @param autobrakeMode
     * @param approachSpeed Actual approach speed in kts
     * @param windDirection Heading wind is coming from, relative to north
     * @param windMagnitude Magnitude of wind in Knots
     * @param runwayHeading Heading of runway relative to north
     * @param reverseThrust Indicates if reverse thrust is active
     * @param altitude Runway altitude in feet ASL
     * @param temperature OAT of runway
     * @param slope Runway slope in %. Negative is downward slope
     * @param overweightProcedure Overweight procedure is being used if true
     */
    private calculateRequiredLandingDistance(weight: number, flaps: LandingFlapsConfig, runwayCondition: LandingRunwayConditions, autobrakeMode: AutobrakeMode,
        approachSpeed: number, windDirection: number, windMagnitude: number, runwayHeading: number, reverseThrust: boolean, altitude: number,
        temperature: number, slope: number, overweightProcedure: boolean, pressure: number): number {
        const pressureAltitude = altitude + this.getPressureAltitude(pressure);
        const isaTemperature = this.getISATemperature(pressureAltitude);

        let targetApproachSpeed: number;
        const vlsTableIndex = getVlsTableIndex(weight / 1000);
        if (flaps === LandingFlapsConfig.Full) {
            targetApproachSpeed = confFullVls[vlsTableIndex];
        } else {
            targetApproachSpeed = conf3Vls[vlsTableIndex];
        }

        const landingData = runwayConditionLandingData[runwayCondition][autobrakeMode][flaps];

        let tailWind = getTailWind(windDirection, windMagnitude, runwayHeading);
        if (tailWind < 0) {
            tailWind = 0;
        }

        const weightDifference = (weight / 1000) - 68;
        let weightCorrection: number;
        if (weightDifference < 0) {
            weightCorrection = landingData.weightCorrectionBelow * Math.abs(weightDifference);
        } else {
            weightCorrection = landingData.weightCorrectionAbove * weightDifference;
        }

        let speedDifference = approachSpeed - targetApproachSpeed;
        if (speedDifference < 0) {
            speedDifference = 0;
        }

        const speedCorrection = (speedDifference / 5) * landingData.speedCorrection;
        const windCorrection = (tailWind / 5) * landingData.windCorrection;
        let reverserCorrection;
        if (reverseThrust) {
            reverserCorrection = landingData.reverserCorrection * 2;
        } else {
            reverserCorrection = 0;
        }

        const altitudeCorrection = pressureAltitude > 0
            ? (pressureAltitude / 1000) * landingData.altitudeCorrection
            : 0;
        const slopeCorrection = slope < 0
            ? Math.abs(slope) * landingData.slopeCorrection
            : 0;
        const temperatureCorrection = temperature > isaTemperature
            ? ((temperature - isaTemperature) / 10) * landingData.tempCorrection
            : 0;
        const overweightProcCorrection = overweightProcedure
            ? landingData.overweightProcedureCorrection
            : 0;

        const requiredLandingDistance = landingData.refDistance + weightCorrection + speedCorrection + windCorrection + reverserCorrection
            + altitudeCorrection + slopeCorrection + temperatureCorrection + overweightProcCorrection;

        return Math.round(requiredLandingDistance);
    }

    /**
     * Converts a given pressure to equivalent pressure altitude
     * @param pressure Pressure in mb
     * @returns Pressure altitude in feet
     */
    private getPressureAltitude(pressure: number): number {
        // Equation from Boeing Jet Transport Performance Methods document
        return 145442.15 * (1 - ((pressure / 1013.25) ** 0.190263));
    }

    /**
     * Calculates ISA temperature for a given pressure altitude
     * @param PressureAltitude is pressure altitude in feet
     * @returns ISA temperature in degrees C
     */
    private getISATemperature(pressureAltitude: number): number {
        return 15 - (0.0019812 * pressureAltitude);
    }
}
