// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * This enum represents a Control Law selected by the guidance system.
 */
export enum ControlLaw {
    /**
     * The only parameter for the Heading law is the desired heading.
     */
    HEADING = 1,
    /**
     * The only parameter for the Track law is the desired course.
     */
    TRACK = 2,
    /**
     * The lateral path law allows for complex lateral path traversal. It requires three parameters:
     * - Crosstrack Error (XTE)
     * - Track Angle Error (TAE)
     * - Roll Angle (Phi)
     */
    LATERAL_PATH = 3,
}

export type HeadingGuidance = {
    law: ControlLaw.HEADING,
    heading: Degrees;

    /** Only for RAD */
    phiCommand?: Degrees;
}

export type TrackGuidance = {
    law: ControlLaw.TRACK,
    course: Degrees;

    /** Only for RAD */
    phiCommand?: Degrees;
}

export type LateralPathGuidance = {
    law: ControlLaw.LATERAL_PATH,
    crossTrackError: NauticalMiles;
    trackAngleError: Degrees;
    phiCommand: Degrees;
}

export type GuidanceParameters = HeadingGuidance | TrackGuidance | LateralPathGuidance;
