import { WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { SegmentType } from '@fmgc/flightplanning/FlightPlanSegment';
import { NauticalMiles } from '@typings/types';
import { AltitudeConstraint, SpeedConstraint } from '../lnav/legs';

export enum FlapConf {
    CLEAN,
    CONF_1,
    CONF_2,
    CONF_3,
    CONF_FULL
}

export enum AccelFactorMode {
    CONSTANT_CAS,
    CONSTANT_MACH,
}

export enum VerticalWaypointType {
    CRZ,
    CLB,
    DES,
}

export interface VerticalLeg {
    constraintType: VerticalWaypointType;
    length: NauticalMiles;
    distanceFromRef: NauticalMiles;
    altConstraint: AltitudeConstraint | undefined;
    speedConstraint: SpeedConstraint | undefined;
    altIgnored: boolean;
    speedIgnored: boolean;
    altConstraintDirectlyApplied: boolean;
    speedConstraintDirectlyApplied: boolean;
}

export interface VerticalLegPrediction {

}

export class Common {
    /**
     * Calculates ISA temperature as a function of altitude
     * @param alt in feet
     * @param aboveTropo boolean
     * @returns ISA temperature in celsius
     */
    static getIsaTemp(alt: number, aboveTropo = false): number {
        if (aboveTropo) {
            return -56.5;
        }
        return 15 - (0.0019812 * alt);
    }

    static getTemp(alt: number, isaDev = 0, aboveTropo = false): number {
        if (aboveTropo) {
            return (-56.5 + isaDev);
        }
        return 15 - (0.0019812 * alt) + isaDev;
    }

    /**
     * Get temperature ratio for a particular altitude (below tropopause)
     * @param alt pressure altitude
     * @param isaDev ISA deviation in celsius
     * @param aboveTropo whether the aircraft is above the tropopause
     * @returns temperature ratio
     */
    static getTheta(alt: number, isaDev = 0, aboveTropo = false): number {
        if (aboveTropo) {
            return (216.65 + isaDev) / 288.15;
        }
        return (288.15 - (0.0019812 * alt) + isaDev) / 288.15;
    }

    /**
     * Get temperature ratio for a particular altitude and mach.
     * @param theta temperature ratio (from only altitude)
     * @param mach mach
     * @returns temperature ratio
     */
    static getTheta2(theta: number, mach: number): number {
        return theta * (1 + 0.2 * (mach ** 2));
    }

    /**
     * Get pressure ratio for a particular theta
     * @param theta temperature ratio
     * @param aboveTropo whether the aircraft is above the tropopause
     * @param alt? pressure altitude used only if aboveTropo is true
     * @returns pressure ratio
     */
    static getDelta(theta: number, aboveTropo = false, alt?: number): number {
        if (aboveTropo && alt !== undefined) {
            return 0.22336 * Math.exp((36089.24 - alt) / 20805.7);
        }
        return theta ** 5.25588;
    }

    /**
     * Get pressure ratio for a particular theta and mach
     * @param delta pressure ratio (from only theta)
     * @param mach mach
     * @returns pressure ratio
     */
    static getDelta2(delta: number, mach: number): number {
        return delta * (1 + 0.2 * (mach ** 2)) ** 3.5;
    }

    /**
     * Get KTAS value from mach
     * @param mach
     * @param theta
     * @returns speed in KTAS (knots true airspeed)
     */
    static machToTAS(mach: number, theta: number): number {
        return 661.4786 * mach * Math.sqrt(theta);
    }

    static machToEAS(mach: number, delta: number): number {
        return 661.4786 * mach * Math.sqrt(delta);
    }

    static CAStoMach(cas: number, delta: number): number {
        const term1 = 1 + 0.2 * (cas / 661.4786) ** 2;
        const term2 = (1 / delta) * ((term1 ** 3.5) - 1);
        const term3 = 5 * (((term2 + 1) ** (1 / 3.5)) - 1);
        return Math.sqrt(term3);
    }

    static TAStoCAS(tas: number, theta: number, delta: number): number {
        const term1 = 1 + (1 / theta) * (tas / 1479.1) ** 2;
        const term2 = delta * ((term1 ** 3.5) - 1) + 1;
        const term3 = ((term2) ** (1 / 3.5)) - 1;
        return 1479.1 * Math.sqrt(term3);
    }

    static CAStoTAS(cas: number, theta: number, delta: number): number {
        const term1 = 1 + 0.2 * (cas / 661.4786) ** 2;
        const term2 = (1 / delta) * ((term1 ** 3.5) - 1);
        const term3 = theta * (((term2 + 1) ** (1 / 3.5)) - 1);
        return 1479.1 * Math.sqrt(term3);
    }

    static CAStoEAS(cas: number, delta: number): number {
        const term1 = 1 + 0.2 * (cas / 661.4786) ** 2;
        const term2 = (1 / delta) * ((term1 ** 3.5) - 1);
        const term3 = delta * (((term2 + 1) ** (1 / 3.5)) - 1);
        return 1479.1 * Math.sqrt(term3);
    }

    static getAccelFactorCAS(mach: number, aboveTropo: boolean, tempRatio?: number): number {
        const phi = (((1 + 0.2 * mach ** 2) ** 3.5) - 1) / ((0.7 * mach ** 2) * (1 + 0.2 * mach ** 2) ** 2.5);
        if (aboveTropo) {
            return 1 + 0.7 * (mach ** 2) * phi;
        }
        return 1 + 0.7 * (mach ** 2) * (phi - 0.190263 * tempRatio);
    }

    static getAccelFactorMach(mach: number, aboveTropo: boolean, tempRatio?: number): number {
        if (aboveTropo) {
            return 0;
        }
        return -0.13318 * (mach ** 2) * tempRatio;
    }

    /**
     * Placeholder
     * @param mach
     * @param temp
     * @param stdTemp
     * @param aboveTropo
     * @param accelFactorMode
     * @returns
     */
    static getAccelerationFactor(
        mach: number,
        altitude: number,
        isaDev: number,
        aboveTropo: boolean,
        accelFactorMode: AccelFactorMode,
    ): number {
        const stdTemp = Common.getIsaTemp(altitude, aboveTropo);
        const temp = Common.getTemp(altitude, isaDev, aboveTropo);
        const tempRatio = stdTemp / temp;
        if (accelFactorMode === AccelFactorMode.CONSTANT_CAS) {
            return Common.getAccelFactorCAS(mach, aboveTropo, tempRatio);
        }

        return Common.getAccelFactorMach(mach, aboveTropo, tempRatio);
    }

    static interpolate(x: number, x0: number, x1: number, y0: number, y1: number): number {
        return ((y0 * (x1 - x)) + (y1 * (x - x0))) / (x1 - x0);
    }

    static poundsToMetricTons(pounds: number): number {
        return pounds / 2204.6;
    }
}
