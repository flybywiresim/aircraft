import { MathUtils } from '@shared/MathUtils';
import { Common, FlapConf } from './common';

export class FlightModel {
    static Cd0 = 0.0187;

    static wingSpan = 117.454;

    static wingArea = 1319.7;

    static wingEffcyFactor = 0.70;

    static requiredAccelRateKNS = 1.33; // in knots/second

    static requiredAccelRateMS2 = 0.684; // in m/s^2

    static gravityConstKNS = 19.0626 // in knots/second

    static gravityConstMS2 = 9.806665; // in m/s^2

    // From https://github.com/flybywiresim/a32nx/pull/6903#issuecomment-1073168320
    static machValues: Mach[] = [0.55, 0.6, 0.65, 0.7, 0.75, 0.8, 0.85]

    static dragCoefficientCorrections: number[] = [0, 0.0002, 0.0003, 0.0004, 0.0008, 0.0015, 0.01]

    /**
     * Get lift coefficient at given conditions
     * @param weight in pounds
     * @param mach self-explanatory
     * @param delta pressure at the altitude divided by the pressure at sea level
     * @param loadFactor g-Force
     * @returns lift coefficient (Cl)
     */
    static getLiftCoefficient(weight: number, mach: number, delta: number, loadFactor = 1): number {
        return (weight * loadFactor) / (1481.4 * (mach ** 2) * delta * this.wingArea);
    }

    static getLiftCoefficientFromEAS(lift: number, eas: number): number {
        return (295.369 * lift) / ((eas ** 2) * this.wingArea);
    }

    /**
     * Get drag coefficient at given conditions
     * @param Cl coefficient of lift
     * @param spdBrkDeflected whether speedbrake is deflected at half or not
     * @param gearExtended whether gear is extended or not
     * @param flapConf flap configuration
     * @returns drag coefficient (Cd)
     */
    static getDragCoefficient(Cl: number, spdBrkDeflected = false, gearExtended = false, flapConf = FlapConf.CLEAN) : number {
        // Values taken at mach 0
        let baseDrag;
        switch (flapConf) {
        case FlapConf.CLEAN:
            baseDrag = (-0.1043 * Cl ** 5) + (0.2635 * Cl ** 4) - (0.2319 * Cl ** 3) + (0.1537 * Cl ** 2) - (0.0379 * Cl) + 0.0233;
            break;
        case FlapConf.CONF_1:
            baseDrag = (-0.0207 * Cl ** 5) + (0.0764 * Cl ** 4) - (0.0813 * Cl ** 3) + (0.0912 * Cl ** 2) - (0.0285 * Cl) + 0.0337;
            break;
        case FlapConf.CONF_2:
            baseDrag = (0.0066 * Cl ** 5) - (0.0271 * Cl ** 4) + (0.0615 * Cl ** 3) - (0.0187 * Cl ** 2) + (0.0035 * Cl) + 0.0538;
            break;
        case FlapConf.CONF_3:
            baseDrag = (0.0768 * Cl ** 5) - (0.3979 * Cl ** 4) + (0.8252 * Cl ** 3) - (0.7951 * Cl ** 2) + (0.3851 * Cl) - 0.0107;
            break;
        case FlapConf.CONF_FULL:
            baseDrag = (0.017 * Cl ** 5) - (0.0978 * Cl ** 4) + (0.2308 * Cl ** 3) - (0.2278 * Cl ** 2) + (0.1157 * Cl) + 0.0682;
            break;
        default:
            break;
        }

        const spdBrkIncrement = spdBrkDeflected ? 0.01 : 0;
        const gearIncrement = gearExtended ? 0.03 : 0;
        return baseDrag + spdBrkIncrement + gearIncrement;
    }

    /**
     * Get drag at given conditions
     * @param weight in pounds
     * @param mach self-explanatory
     * @param delta pressure at the altitude divided by the pressure at sea level
     * @param spdBrkDeflected Whether speedbrake is deflected at half or not
     * @param gearExtended whether gear is extended or not
     * @param flapConf flap configuration
     * @returns drag
     */
    static getDrag(weight: number, mach: number, delta: number, spdBrkDeflected: boolean, gearExtended: boolean, flapConf: FlapConf): number {
        const Cl = this.getLiftCoefficient(weight, mach, delta);
        const Cd = this.getDragCoefficient(Cl, spdBrkDeflected, gearExtended, flapConf);
        const deltaCd = this.getMachCorrection(mach, flapConf);

        return 1481.4 * (mach ** 2) * delta * this.wingArea * (Cd + deltaCd);
    }

    static getMachCorrection(mach: Mach, flapConf: FlapConf): number {
        if (flapConf !== FlapConf.CLEAN) {
            return 0;
        }

        return this.interpolate(mach, this.machValues, this.dragCoefficientCorrections);
    }

    /**
     * Interpolates in a list
     * @param x The value to look up in in `xs`.
     * @param xs The table of x values with known y values
     * @param ys The y values corresponding to the x values in `xs`
     */
    static interpolate(x: number, xs: number[], ys: number[]) {
        if (x <= xs[0]) {
            return ys[0];
        }

        for (let i = 0; i < xs.length - 1; i++) {
            if (x > xs[i] && x <= xs[i + 1]) {
                return Common.interpolate(x, xs[i], xs[i + 1], ys[i], ys[i + 1]);
            }
        }

        return ys[ys.length - 1];
    }

    // NEW

    /**
     * Returns the available climb or descent gradient.
     *
     * @param thrust the thrust in lbf
     * @param drag
     * @param weight in lbs
     *
     * @returns the available gradient in radians
     */
    static getAvailableGradient(
        thrust: number,
        drag: number,
        weight: number,
    ): number {
        return Math.asin((thrust - drag) / weight);
    }

    /**
     * Returns an acceleration for a given available gradient, fpa and acceleration factor.
     *
     * @param availableGradient in radians
     * @param fpa in radians
     * @param accelFactor
     *
     * @returns the acceleration
     */
    static accelerationForGradient(
        availableGradient: Radians,
        fpa: number,
        accelFactor: number,
    ): number {
        return (Math.sin(availableGradient) - Math.sin(fpa)) * accelFactor;
    }

    /**
     * Returns an fpa for a given available gradient, acceleration and acceleration factor.
     *
     * @param availableGradient in radians
     * @param acceleration
     * @param accelFactor
     *
     * @returns the fpa in radians
     */
    static fpaForGradient(
        availableGradient: Radians,
        acceleration: number,
        accelFactor: number,
    ): number {
        return Math.asin(Math.sin(availableGradient) - (acceleration / accelFactor));
    }

    // END NEW

    static getConstantThrustPathAngle(
        thrust: number,
        weight: number,
        drag: number,
        accelFactor: number,
    ): number {
        return Math.asin(((thrust - drag) / weight) / accelFactor);
    }

    static getConstantThrustPathAngleFromCoefficients(
        thrust: number,
        weight: number,
        Cl: number,
        Cd: number,
        accelFactor: number,
    ): number {
        return Math.asin(((thrust / weight) - (Cd / Cl)) / accelFactor);
    }

    static getThrustFromConstantPathAngle(
        fpa: number,
        weight: number,
        drag: number,
        accelFactor: number,
    ): number {
        // fpa is in degrees
        return weight * (accelFactor * Math.sin(fpa * MathUtils.DEGREES_TO_RADIANS)) + drag;
    }

    static getThrustFromConstantPathAngleCoefficients(
        fpa: number,
        weight: number,
        Cl: number,
        Cd: number,
        accelFactor: number,
    ): number {
        // fpa is in degrees
        return weight * (accelFactor * Math.sin(fpa * MathUtils.DEGREES_TO_RADIANS) + (Cd / Cl));
    }

    static getSpeedChangePathAngle(
        thrust: number,
        weight: number,
        drag: number,
    ): number {
        return Math.asin(((thrust - drag) / weight) - (1 / FlightModel.gravityConstMS2) * FlightModel.requiredAccelRateMS2);
    }

    static getSpeedChangePathAngleFromCoefficients(
        thrust: number,
        weight: number,
        Cl: number,
        Cd: number,
    ): number {
        return Math.asin(((thrust / weight) - (Cd / Cl)) - (1 / FlightModel.gravityConstMS2) * FlightModel.requiredAccelRateMS2);
    }

    static getAccelRateFromIdleGeoPath(
        thrust: number,
        weight: number,
        drag: number,
        fpaDeg: number,
    ): number {
        // fpa is in degrees
        const fpaRad = fpaDeg * MathUtils.DEGREES_TO_RADIANS;
        return FlightModel.gravityConstKNS * ((thrust - drag) / weight - Math.sin(fpaRad));
    }

    static getAccelRateFromIdleGeoPathCoefficients(
        thrust: number,
        weight: number,
        Cl: number,
        Cd: number,
        fpaDeg: number,
    ): number {
        // fpa is in degrees
        const fpaRad = fpaDeg * MathUtils.DEGREES_TO_RADIANS;
        return FlightModel.gravityConstKNS * (((thrust / weight) - (Cd / Cl)) - Math.sin(fpaRad));
    }

    /**
     * Gets distance required to accelerate/decelerate
     * @param thrust
     * @param drag
     * @param weight in pounds
     * @param initialSpeed
     * @param targetSpeed
     * @param fpa flight path angle, default value 0 for level segments
     * @param accelFactor acceleration factor, default value 0 for level segments
     * @returns distance to accel/decel
     */
    static getAccelerationDistance(
        thrust: number,
        drag: number,
        weight: number,
        initialSpeed: number,
        targetSpeed: number,
        fpa = 0,
        accelFactor = 0,
    ): number {
        const sign = Math.sign(fpa);
        const force = thrust - drag + (sign * weight * Math.sin(fpa * (Math.PI / 180))) * accelFactor;

        const accel = force / weight; // TODO: Check units
        const timeToAccel = (targetSpeed - initialSpeed) / accel;
        const distanceToAccel = (initialSpeed * timeToAccel) + (0.5 * accel * (timeToAccel ** 2)); // TODO: Check units
        return distanceToAccel;
    }

    static getGreenDotSpeedCas(
        altitude: number,
        weight: Kilograms,
    ): Knots {
        return weight / 500 + 85 + Math.max(0, (altitude - 20000) / 1000);
    }
}
