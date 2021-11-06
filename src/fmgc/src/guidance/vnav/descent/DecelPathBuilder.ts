//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Geometry } from '@fmgc/guidance/Geometry';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { Predictions, StepResults, VnavStepError } from '@fmgc/guidance/vnav/Predictions';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { Feet, Knots, NauticalMiles } from '../../../../../../typings';

const ALTITUDE_ADJUSTMENT_FACTOR = 1.4;

/**
 * The minimum deceleration rate, in knots per second, to target on the approach path.
 *
 * This will be used as the target rate in case it cannot be achieved using the desired fpa.
 */
const MINIMUM_APPROACH_DECELERATION = 0.5;

export enum ApproachPathSegmentType {
    CONSTANT_SLOPE,
    CONSTANT_SPEED,
    LEVEL_DECELERATION,
}

export interface DecelPathCharacteristics {
    flap1: NauticalMiles,
    flap2: NauticalMiles,
    decel: NauticalMiles,
    top: Feet,
}

export class DecelPathBuilder {
    static computeDecelPath(
        geometry: Geometry,
    ): DecelPathCharacteristics {
        // TO GET FPA:
        // If approach exists, use approach alt constraints to get FPA and glidepath
        // If no approach but arrival, use arrival alt constraints, if any
        // If no other alt constraints, use 3 degree descent from cruise altitude

        // Given FPA above, calculate distance required (backwards from Vapp @ runway threshold alt + 50ft + 1000ft),
        // to decelerate from green dot speed to Vapp using `decelerationFromGeometricStep`
        // Then, add a speedChangeStep (1.33 knots/second decel) backwards from this point (green dot spd) to previous speed, aka min(last spd constraint, spd lim)
        //      - TODO: make sure alt constraints are obeyed during this speed change DECEL segment?
        // The point at the beginning of the speedChangeStep is DECEL

        const TEMP_TROPO = 36_000;
        const TEMP_FUEL_WEIGHT = 2_300;
        const DES = 250;
        const O = 203;
        const S = 184;
        const F = 143;

        const vappSegment = DecelPathBuilder.computeVappSegment(geometry);

        let fuelWeight = TEMP_FUEL_WEIGHT;

        const cFullTo3Segment = DecelPathBuilder.computeConfigurationChangeSegment(
            ApproachPathSegmentType.CONSTANT_SLOPE,
            -3,
            1_000,
            F,
            135,
            fuelWeight,
            FlapConf.CONF_FULL,
            true,
            TEMP_TROPO,
        );
        fuelWeight += cFullTo3Segment.fuelBurned;

        const c3to2Segment = DecelPathBuilder.computeConfigurationChangeSegment(
            ApproachPathSegmentType.CONSTANT_SLOPE,
            -3,
            cFullTo3Segment.initialAltitude,
            F + (S - F) / 2,
            F,
            fuelWeight,
            FlapConf.CONF_3,
            true,
            TEMP_TROPO,
        );
        fuelWeight += c3to2Segment.fuelBurned;

        const c2to1Segment = DecelPathBuilder.computeConfigurationChangeSegment(
            ApproachPathSegmentType.CONSTANT_SLOPE,
            -3,
            c3to2Segment.initialAltitude,
            S,
            F + (S - F) / 2,
            fuelWeight,
            FlapConf.CONF_2,
            false,
            TEMP_TROPO,
        );
        fuelWeight += c2to1Segment.fuelBurned;

        const c1toCleanSegment = DecelPathBuilder.computeConfigurationChangeSegment(
            ApproachPathSegmentType.CONSTANT_SLOPE,
            -3,
            c2to1Segment.initialAltitude,
            O,
            S,
            fuelWeight,
            FlapConf.CONF_1,
            false,
            TEMP_TROPO,
        );
        fuelWeight += c1toCleanSegment.fuelBurned;

        let cleanToDesSpeedSegment = DecelPathBuilder.computeConfigurationChangeSegment(
            ApproachPathSegmentType.CONSTANT_SLOPE,
            -2.5,
            c1toCleanSegment.initialAltitude,
            DES,
            O,
            fuelWeight,
            FlapConf.CLEAN,
            false,
            TEMP_TROPO,
        );

        // TODO for TOO_LOW_DECELERATION do CONSTANT_DECELERATION, not LEVEL_DECELERATION
        if (cleanToDesSpeedSegment.error === VnavStepError.AVAILABLE_GRADIENT_INSUFFICIENT
            || cleanToDesSpeedSegment.error === VnavStepError.TOO_LOW_DECELERATION) {
            if (DEBUG) {
                console.warn('[VNAV/computeDecelPath] AVAILABLE_GRADIENT_INSUFFICIENT/TOO_LOW_DECELERATION on cleanToDesSpeedSegment -> reverting to LEVEL_DECELERATION segment.');
            }

            // if (VnavConfig.VNAV_DESCENT_MODE !== VnavDescentMode.CDA) {
            cleanToDesSpeedSegment = DecelPathBuilder.computeConfigurationChangeSegment(
                ApproachPathSegmentType.LEVEL_DECELERATION,
                undefined,
                c1toCleanSegment.initialAltitude,
                DES,
                O,
                fuelWeight,
                FlapConf.CLEAN,
                false,
                TEMP_TROPO,
            );
            // } else {
            //     throw new Error('[VNAV/computeDecelPath] Computation of cleanToDesSpeedSegment for CDA is not yet implemented');
            // }
        }

        return {
            flap1: vappSegment.distanceTraveled
                + cFullTo3Segment.distanceTraveled
                + c3to2Segment.distanceTraveled
                + c2to1Segment.distanceTraveled
                + c1toCleanSegment.distanceTraveled,
            flap2: vappSegment.distanceTraveled
                + cFullTo3Segment.distanceTraveled
                + c3to2Segment.distanceTraveled
                + c2to1Segment.distanceTraveled,
            decel: vappSegment.distanceTraveled
                + cFullTo3Segment.distanceTraveled
                + c3to2Segment.distanceTraveled
                + c2to1Segment.distanceTraveled
                + c1toCleanSegment.distanceTraveled
                + cleanToDesSpeedSegment.distanceTraveled,
            top: cleanToDesSpeedSegment.finalAltitude,
        };
    }

    /**
     * Calculates the Vapp segment of the DECEL path.
     *
     * @return the Vapp segment step results
     */
    private static computeVappSegment(
        geometry: Geometry,
    ): StepResults {
        const TEMP_VAPP = 135; // TODO actual Vapp

        const finalAltitude = DecelPathBuilder.findLastApproachPoint(geometry);

        // TODO For now we use some "reasonable" values for the segment. When we have the ability to predict idle N1 and such at approach conditions,
        // we can change this.
        return {
            ...Predictions.altitudeStep(
                1_000,
                -(1_000 - finalAltitude),
                TEMP_VAPP, // TODO placeholder value
                999, // TODO placeholder value
                26, // TODO placeholder value
                107_000, // TODO placeholder value
                5_000, // TODO placeholder value
                2, // TODO placeholder value
                0, // TODO placeholder value
                36_000, // TODO placeholder value
                false, // TODO placeholder value
            ),
            distanceTraveled: 3.14, // FIXME hard-coded correct value for -3deg fpa
        };
    }

    /**
     * Calculates a config change segment of the DECEL path.
     *
     * @return the config change segment step results
     */
    private static computeConfigurationChangeSegment(
        type: ApproachPathSegmentType,
        fpa: number,
        finalAltitude: Feet,
        fromSpeed: Knots,
        toSpeed: Knots,
        initialFuelWeight: number, // TODO take finalFuelWeight and make an iterative prediction
        newConfiguration: FlapConf,
        gearExtended: boolean,
        tropoAltitude: number,
    ): StepResults {
        // TODO For now we use some "reasonable" values for the segment. When we have the ability to predict idle N1 and such at approach conditions,
        // we can change this.

        switch (type) {
        case ApproachPathSegmentType.CONSTANT_SLOPE: // FIXME hard-coded to -3deg in speedChangeStep

            let currentIterationAltitude = finalAltitude * ALTITUDE_ADJUSTMENT_FACTOR;
            let stepResults: StepResults;
            let altitudeError = 0;
            let iterationCount = 0;

            if (DEBUG) {
                console.log('starting iterative step compute');
                console.time(`step to altitude ${finalAltitude}`);
            }

            do {
                if (DEBUG) {
                    console.log(`iteration #${iterationCount}, with initialAltitude = ${currentIterationAltitude}, targetFinalAltitude = ${finalAltitude}`);

                    console.time(`step to altitude ${finalAltitude} iteration ${iterationCount}`);
                }

                const newStepResults = Predictions.speedChangeStep(
                    fpa ?? -3,
                    currentIterationAltitude,
                    fromSpeed,
                    toSpeed,
                    999,
                    999,
                    26,
                    107_000,
                    initialFuelWeight,
                    2,
                    0,
                    tropoAltitude,
                    gearExtended,
                    newConfiguration,
                    MINIMUM_APPROACH_DECELERATION,
                );

                // Stop if we encounter a NaN
                if (Number.isNaN(newStepResults.finalAltitude)) {
                    if (DEBUG) {
                        console.timeEnd(`step to altitude ${finalAltitude} iteration ${iterationCount}`);
                    }
                    break;
                }

                stepResults = newStepResults;

                altitudeError = finalAltitude - stepResults.finalAltitude;
                currentIterationAltitude += altitudeError;

                if (DEBUG) {
                    console.timeEnd('stuff after');

                    console.log(`iteration #${iterationCount} done finalAltitude = ${stepResults.finalAltitude}, error = ${altitudeError}`);

                    console.timeEnd(`step to altitude ${finalAltitude} iteration ${iterationCount}`);
                }

                iterationCount++;
            } while (Math.abs(altitudeError) >= 25 && iterationCount < 4);

            if (DEBUG) {
                console.timeEnd(`step to altitude ${finalAltitude}`);
                console.log('done with iterative step compute');
            }

            return {
                ...stepResults,
                initialAltitude: currentIterationAltitude,
            };
        case ApproachPathSegmentType.CONSTANT_SPEED:
            throw new Error('[FMS/VNAV/computeConfigurationChangeSegment] CONSTANT_SPEED is not supported for configuration changes.');
        case ApproachPathSegmentType.LEVEL_DECELERATION:
            return Predictions.speedChangeStep(
                0,
                finalAltitude * ALTITUDE_ADJUSTMENT_FACTOR,
                fromSpeed,
                toSpeed,
                999,
                999,
                26,
                107_000,
                initialFuelWeight,
                2,
                0,
                tropoAltitude,
                gearExtended,
                newConfiguration,
            );
        default:
            throw new Error('[FMS/VNAV/computeConfigurationChangeSegment] Unknown segment type.');
        }
    }

    /**
     * Returns altitude of either, in order of priority:
     * - runway threshold;
     * - missed approach point;
     * - airport.
     */
    private static findLastApproachPoint(
        geometry: Geometry,
    ): Feet {
        const lastLeg = geometry.legs.get(geometry.legs.size - 1);

        // Last leg is TF AND is runway or airport
        if (lastLeg instanceof TFLeg && (lastLeg.to.isRunway || lastLeg.to.type === 'A')) {
            return lastLeg.to.legAltitude1;
        }
        return 150; // TODO temporary value
    }
}
