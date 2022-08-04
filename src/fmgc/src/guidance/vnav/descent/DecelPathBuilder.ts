//  Copyright (c) 2021 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { Geometry } from '@fmgc/guidance/Geometry';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { Predictions, StepResults, VnavStepError } from '@fmgc/guidance/vnav/Predictions';
import { FlapConf } from '@fmgc/guidance/vnav/common';
import { NavGeometryProfile, VerticalCheckpointReason } from '@fmgc/guidance/vnav/profile/NavGeometryProfile';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { VerticalProfileComputationParametersObserver } from '@fmgc/guidance/vnav/VerticalProfileComputationParameters';
import { AtmosphericConditions } from '@fmgc/guidance/vnav/AtmosphericConditions';
import { ManagedSpeedType, SpeedProfile } from '@fmgc/guidance/vnav/climb/SpeedProfile';

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
    constructor(private observer: VerticalProfileComputationParametersObserver, private atmosphericConditions: AtmosphericConditions) { }

    computeDecelPath(profile: NavGeometryProfile, speedProfile: SpeedProfile, estimatedFuelOnBoardAtDestination: number, estimatedSecondsFromPresentAtDestination: number) {
        // TO GET FPA:
        // If approach exists, use approach alt constraints to get FPA and glidepath
        // If no approach but arrival, use arrival alt constraints, if any
        // If no other alt constraints, use 3 degree descent from cruise altitude

        // Given FPA above, calculate distance required (backwards from Vapp @ runway threshold alt + 50ft + 1000ft),
        // to decelerate from green dot speed to Vapp using `decelerationFromGeometricStep`
        // Then, add a speedChangeStep (1.33 knots/second decel) backwards from this point (green dot spd) to previous speed, aka min(last spd constraint, spd lim)
        //      - TODO: make sure alt constraints are obeyed during this speed change DECEL segment?
        // The point at the beginning of the speedChangeStep is DECEL

        const DES = 250;

        const { approachSpeed, flapRetractionSpeed, slatRetractionSpeed, cleanSpeed, zeroFuelWeight, managedDescentSpeedMach, destinationAirfieldElevation } = this.observer.get();

        if (!this.canCompute(profile.geometry, profile.waypointCount)) {
            return;
        }

        const vappSegment = Predictions.geometricStep(
            destinationAirfieldElevation + 1_000,
            destinationAirfieldElevation + 50,
            3.14,
            approachSpeed,
            managedDescentSpeedMach,
            zeroFuelWeight,
            estimatedFuelOnBoardAtDestination,
            0,
            this.atmosphericConditions.isaDeviation,
            true,
            FlapConf.CONF_FULL,
        );

        let timeElapsed = estimatedSecondsFromPresentAtDestination - vappSegment.timeElapsed;
        let fuelWeight = estimatedFuelOnBoardAtDestination + vappSegment.fuelBurned;
        let distanceFromEnd = vappSegment.distanceTraveled;

        profile.checkpoints.push({
            reason: VerticalCheckpointReason.Landing,
            distanceFromStart: profile.getDistanceFromStart(distanceFromEnd),
            speed: approachSpeed, // FIXME
            altitude: vappSegment.finalAltitude,
            remainingFuelOnBoard: fuelWeight,
            secondsFromPresent: timeElapsed,
        });

        const cFullTo3Segment = DecelPathBuilder.computeConfigurationChangeSegment(
            ApproachPathSegmentType.CONSTANT_SLOPE,
            -3,
            destinationAirfieldElevation + 1_000,
            flapRetractionSpeed,
            approachSpeed,
            fuelWeight,
            FlapConf.CONF_FULL,
            true,
            this.atmosphericConditions.isaDeviation,
        );

        fuelWeight += cFullTo3Segment.fuelBurned;
        distanceFromEnd += cFullTo3Segment.distanceTraveled;
        timeElapsed -= cFullTo3Segment.timeElapsed;

        profile.checkpoints.push({
            reason: VerticalCheckpointReason.FlapsFull,
            distanceFromStart: profile.getDistanceFromStart(distanceFromEnd),
            speed: flapRetractionSpeed,
            altitude: cFullTo3Segment.initialAltitude,
            remainingFuelOnBoard: fuelWeight,
            secondsFromPresent: timeElapsed,
        });

        const c3to2Segment = DecelPathBuilder.computeConfigurationChangeSegment(
            ApproachPathSegmentType.CONSTANT_SLOPE,
            -3,
            cFullTo3Segment.initialAltitude,
            (flapRetractionSpeed + slatRetractionSpeed) / 2,
            flapRetractionSpeed,
            fuelWeight,
            FlapConf.CONF_3,
            true,
            this.atmosphericConditions.isaDeviation,
        );

        fuelWeight += c3to2Segment.fuelBurned;
        distanceFromEnd += c3to2Segment.distanceTraveled;
        timeElapsed -= c3to2Segment.timeElapsed;

        profile.checkpoints.push({
            reason: VerticalCheckpointReason.Flaps3,
            distanceFromStart: profile.getDistanceFromStart(distanceFromEnd),
            speed: (flapRetractionSpeed + slatRetractionSpeed) / 2,
            altitude: c3to2Segment.initialAltitude,
            remainingFuelOnBoard: fuelWeight,
            secondsFromPresent: timeElapsed,
        });

        const c2to1Segment = DecelPathBuilder.computeConfigurationChangeSegment(
            ApproachPathSegmentType.CONSTANT_SLOPE,
            -3,
            c3to2Segment.initialAltitude,
            slatRetractionSpeed,
            (flapRetractionSpeed + slatRetractionSpeed) / 2,
            fuelWeight,
            FlapConf.CONF_2,
            false,
            this.atmosphericConditions.isaDeviation,
        );

        fuelWeight += c2to1Segment.fuelBurned;
        distanceFromEnd += c2to1Segment.distanceTraveled;
        timeElapsed -= c2to1Segment.timeElapsed;

        profile.checkpoints.push({
            reason: VerticalCheckpointReason.Flaps2,
            distanceFromStart: profile.getDistanceFromStart(distanceFromEnd),
            speed: slatRetractionSpeed,
            altitude: c2to1Segment.initialAltitude,
            remainingFuelOnBoard: fuelWeight,
            secondsFromPresent: timeElapsed,
        });

        const c1toCleanSegment = DecelPathBuilder.computeConfigurationChangeSegment(
            ApproachPathSegmentType.CONSTANT_SLOPE,
            -2.5,
            c2to1Segment.initialAltitude,
            cleanSpeed,
            slatRetractionSpeed,
            fuelWeight,
            FlapConf.CONF_1,
            false,
            this.atmosphericConditions.isaDeviation,
        );

        fuelWeight += c1toCleanSegment.fuelBurned;
        distanceFromEnd += c1toCleanSegment.distanceTraveled;
        timeElapsed -= c1toCleanSegment.timeElapsed;

        profile.checkpoints.push({
            reason: VerticalCheckpointReason.Flaps1,
            distanceFromStart: profile.getDistanceFromStart(distanceFromEnd),
            speed: cleanSpeed,
            altitude: c1toCleanSegment.initialAltitude,
            remainingFuelOnBoard: fuelWeight,
            secondsFromPresent: timeElapsed,
        });

        let cleanToDesSpeedSegment = DecelPathBuilder.computeConfigurationChangeSegment(
            ApproachPathSegmentType.CONSTANT_SLOPE,
            -2.5,
            c1toCleanSegment.initialAltitude,
            speedProfile.getTarget(profile.getDistanceFromStart(distanceFromEnd), c1toCleanSegment.initialAltitude, ManagedSpeedType.Descent),
            cleanSpeed,
            fuelWeight,
            FlapConf.CLEAN,
            false,
            this.atmosphericConditions.isaDeviation,
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
                speedProfile.getTarget(profile.getDistanceFromStart(distanceFromEnd), c1toCleanSegment.initialAltitude, ManagedSpeedType.Descent),
                cleanSpeed,
                fuelWeight,
                FlapConf.CLEAN,
                false,
                this.atmosphericConditions.isaDeviation,
            );
            // } else {
            //     throw new Error('[VNAV/computeDecelPath] Computation of cleanToDesSpeedSegment for CDA is not yet implemented');
            // }
        }

        fuelWeight += cleanToDesSpeedSegment.fuelBurned;
        distanceFromEnd += cleanToDesSpeedSegment.distanceTraveled;
        timeElapsed -= cleanToDesSpeedSegment.timeElapsed;

        profile.checkpoints.push({
            reason: VerticalCheckpointReason.Decel,
            distanceFromStart: profile.getDistanceFromStart(distanceFromEnd),
            speed: DES,
            altitude: cleanToDesSpeedSegment.initialAltitude,
            remainingFuelOnBoard: fuelWeight,
            secondsFromPresent: timeElapsed,
        });
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
            return {
                ...Predictions.speedChangeStep(
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
                ),
                initialAltitude: finalAltitude * ALTITUDE_ADJUSTMENT_FACTOR,
            };
        default:
            throw new Error('[FMS/VNAV/computeConfigurationChangeSegment] Unknown segment type.');
        }
    }

    /**
     * Only compute if the last leg is a destination airport / runway
     */
    canCompute(geometry: Geometry, wptCount: number): boolean {
        let lastLeg = geometry.legs.get(wptCount - 1);

        // If somehow this wasn't the last leg, we find it the hard way.
        if (!lastLeg) {
            lastLeg = this.findLastLeg(geometry);
        }

        return lastLeg && lastLeg instanceof TFLeg && (lastLeg.to.isRunway || lastLeg.to.type === 'A');
    }

    findLastLeg(geometry: Geometry): Leg {
        let lastLeg = undefined;
        let maxIndex = -Infinity;

        for (const [i, leg] of geometry.legs) {
            if (i > maxIndex) {
                lastLeg = leg;
                maxIndex = i;
            }
        }

        return lastLeg;
    }

    /**
     * Returns altitude of either, in order of priority:
     * - runway threshold;
     * - missed approach point;
     * - airport.
     */
    private findLastApproachPoint(
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
