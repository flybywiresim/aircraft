import { FlightPlanManager } from "@fmgc/index";
import { FMCMainDisplay } from "../types/fstypes/FSTypes";
import { RopsStateMachine } from "../types/fstypes/FSTypes";
import { RopsState } from "../types/fstypes/FSTypes";
import { RopsLandingConstants } from "../types/fstypes/FSTypes";
import { NXSpeedsApp } from "../types/fstypes/FSTypes";

export class ROPS {

    private fmcMainDisplay: FMCMainDisplay;

    private fpm: FlightPlanManager;

    private lda: number;

    constructor(_fmcMainDisplay: FMCMainDisplay) {
        console.log("A32NX_ROPS constructed");
        this.fmcMainDisplay = _fmcMainDisplay;
        this.fpm = this.fmcMainDisplay.flightPlanManager;
        this.lda = NaN;
    }

    init(): void {
        console.log("A32NX_ROPS init");

        const ra: number = Simplane.getAltitudeAboveGround();
        const gs: number = Simplane.getGroundSpeed();

        // Put the ROPS into the appropriate state when loading into the aircraft.
        if (ra > 2000) {
            console.log(`set state to inflight inhibit`);
            this.ropsStateMachine.states.GROUND_INHIBIT.engageInflightInhibit();
        } else if (ra <= 2000 && ra > 400) {
            console.log(`set state to rops`);
            this.ropsStateMachine.states.FLIGHT_INHIBIT.activateROPS();
        } else if (ra <= 400 && !Simplane.getIsGrounded()) {
            console.log(`set state to row`);
            this.ropsStateMachine.states.ROPS.armROW();
        } else if (Simplane.getIsGrounded()) {
            console.log(`set state to ground inhibit`);
            this.ropsStateMachine.states.ROP.engageGroundInhibit();
        } else {
            // TODO: handle cases when the state of the aircraft could not be determined
        }

        SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", this.ropsStateMachine.currentState.value);
        SimVar.SetSimVarValue("L:A32NX_ROPS_IF_WET", "bool", 0);
        SimVar.SetSimVarValue("L:A32NX_ROPS_TOO_SHORT", "bool", 0);
        SimVar.SetSimVarValue("L:A32NX_ROPS_MAX_BRAKING", "bool", 0);
        SimVar.SetSimVarValue("L:A32NX_ROPS_KEEP_REVERSE", "bool", 0);

        console.log(gs);
        console.log(ra);
        console.log(`CURRENT STATE: ${this.ropsStateMachine.currentState.value}`);
    }

    update(): void {
        this.updateState();

        this.ropsStateMachine.currentState.execute();
    }

    updateState(): void {
        const ra = Simplane.getAltitudeAboveGround();
        const gs = Simplane.getGroundSpeed();

        console.log(`GS: ${gs}`);
        console.log(`RA: ${ra}`);

        const state: RopsState = this.ropsStateMachine.currentState;
        console.log(`CURRENT STATE: ${state.value}`);

        switch (state.value) {
            case 0:
                if (ra <= 2000 && ra > 400) {
                    state.activateROPS();
                }
                break;
            case 1:
                if (ra <= 400) {
                    state.armROW();
                }
                break;
            case 2:
                if (Simplane.getIsGrounded() && gs >= 30) {
                    state.engageROP();
                }
                break;
            case 3:
                if (gs < 30) {
                    state.engageGroundInhibit();
                }
                break;
            case 4:
                if (ra > 2000) {
                    state.engageInflightInhibit();
                }
                break;
        }
    }

    private computeTailwindComponent(aircraftHdg: number, windDirection: number, windSpeed: number): number {

        let correctedAircraftHdg: number;
        let interiorAngle: number;
        let tailwindComponent: number;

        if (aircraftHdg > 180) {
            correctedAircraftHdg = aircraftHdg - 180;
        } else {
            correctedAircraftHdg = aircraftHdg + 180;
        }

        if (aircraftHdg > windDirection) {
            interiorAngle = correctedAircraftHdg - windDirection;
        } else {
            interiorAngle = windDirection - correctedAircraftHdg;
        }

        tailwindComponent = Math.cos(interiorAngle) * windSpeed;

        if (tailwindComponent <= 0) {
            return 0;
        } else {
            return tailwindComponent;
        }
    }

    /**
     * States:
     * FLIGHT_INHIBIT: The ROPS is inhibited - active above 2000ft RA
     *
     * ROPS: The ROPS is actively detecting the landing runway
     *
     * ROW: The ROW function arms and continously calculates the required landing distance -> activates if the available distance drops below the "WET RUNWAY" threshold
     *
     * ROP: The ROP arms and continously calculates the required landing distance -> activates if the required distance is more than the distance available
     *
     * GROUND_INHIBIT: The ROPS is inhibited on the ground - activates when on ground and GS < 30 kts - stays active until RA > 2000 ft
     */
    private ropsStateMachine: RopsStateMachine = {
        currentState: null,
        states: {
            FLIGHT_INHIBIT: {
                value: 0,
                activateROPS: () => {
                    this.ropsStateMachine.currentState = this.ropsStateMachine.states.ROPS;
                    SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", this.ropsStateMachine.currentState.value);
                },
                execute: () => {
                    return;
                }
            },
            ROPS: {
                value: 1,
                armROW: () => {
                    this.ropsStateMachine.currentState = this.ropsStateMachine.states.ROW;
                    SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", this.ropsStateMachine.currentState.value);
                },
                execute: () => {
                    // TODO: landing runway detection
                }
            },
            ROW: {
                value: 2,
                engageROP: () => {
                    this.ropsStateMachine.currentState = this.ropsStateMachine.states.ROP;
                    SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", this.ropsStateMachine.currentState.value);
                },
                execute: () => {
                    const weight: number = Simplane.getWeight();
                    const ias: number = Simplane.getIndicatedSpeed();
                    const hdg: number = Simplane.getHeadingMagnetic();
                    const vapp: number = this.fmcMainDisplay.approachSpeeds.vapp;
                    const lda: number = NaN;
                    const alt: number = Simplane.getAltitude();
                    const windDirection: number = Simplane.getWindDirection();
                    const windSpeed: number = Simplane.getWindStrength();
                    const temp: number = Simplane.getAmbientTemperature();
                    const downSlope: number = NaN;
                    const isConfig3: number = SimVar.GetSimVarValue("L:A32NX_VSPEEDS_LANDING_CONF3", "bool");
                    const isAutoland: number = SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_ACTIVE", "bool");

                    // Compute Wet
                    if (isConfig3) {
                        let ldr: number = wetPerformance.config3.refDist;

                        if (weight > 68) {
                            for (let i: number = (weight - 68); i > 0; i--) {
                                ldr += wetPerformance.config3.positiveWeightCorrection;
                            }
                        } else if (weight < 68) {
                            for (let i: number = (68 - weight); i > 0; i--) {
                                ldr += wetPerformance.config3.negativeWeightCorrection;
                            }
                        }

                        if (ias > vapp) {
                            for (let i: number = (ias - vapp); i > 0; i--) {
                                ldr += wetPerformance.config3.speedCorrection;
                            }
                        }

                        if (alt > 0) {} // TODO: impl. landing runway elevation

                        if (windDirection) {} // TODO: impl. wind direction check -> only true if TW

                        if (temp) {}

                        if (downSlope) {}

                        ldr += wetPerformance.config3.reverseThrCorrection;
                        ldr += wetPerformance.config3.overWeightCorrection; // TODO: impl. logic to detect overweight landing

                        if (isAutoland) {
                            ldr += wetPerformance.config3.autolandCorrection;
                        }

                        // Add 15% safety margin
                        ldr += ldr * 0.15;
                    }
                }
            },
            ROP: {
                value: 3,
                engageGroundInhibit: () => {
                    this.ropsStateMachine.currentState = this.ropsStateMachine.states.GROUND_INHIBIT;
                    SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", this.ropsStateMachine.currentState.value);
                },
                execute: () => {

                }
            },
            GROUND_INHIBIT: {
                value: 4,
                engageInflightInhibit: () => {
                    this.ropsStateMachine.currentState = this.ropsStateMachine.states.FLIGHT_INHIBIT;
                    SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", this.ropsStateMachine.currentState.value);
                },
                execute: () => {

                }
            }
        }
    }
}

/* BEGINNING OF LD CONSTANTS */
// DO NOT CHANGE THESE

const dryPerformance: RopsLandingConstants = {
    flapFull: {
        refDist: 1060,
        positiveWeightCorrection: 50,
        negativeWeightCorrection: -10,
        speedCorrection: 70,
        altCorrection: 40,
        windCorrection: 130,
        tempCorrection: 30,
        downSlopeCorrection: 20,
        reverseThrCorrection: 0,
        overWeightCorrection: 910,
        autolandCorrection: 280
    },
    config3: {
        refDist: 1210,
        positiveWeightCorrection: 50,
        negativeWeightCorrection: 10,
        speedCorrection: 80,
        altCorrection: 50,
        windCorrection: 130,
        tempCorrection: 40,
        downSlopeCorrection: 30,
        reverseThrCorrection: - 20,
        overWeightCorrection: 1080,
        autolandCorrection: 250
    }
}
Object.freeze(dryPerformance.flapFull);
Object.freeze(dryPerformance.config3);

const wetPerformance: RopsLandingConstants = {
    flapFull: {
        refDist: 2760,
        positiveWeightCorrection: 60,
        negativeWeightCorrection: -20,
        speedCorrection: 140,
        altCorrection: 110,
        windCorrection: 430,
        tempCorrection: 110,
        downSlopeCorrection: 460,
        reverseThrCorrection: -370,
        overWeightCorrection: 550,
        autolandCorrection: 360
    },
    config3: {
        refDist: 3250,
        positiveWeightCorrection: 70,
        negativeWeightCorrection: -30,
        speedCorrection: 150,
        altCorrection: 130,
        windCorrection: 470,
        tempCorrection: 130,
        downSlopeCorrection: 550,
        reverseThrCorrection: -490,
        overWeightCorrection: 660,
        autolandCorrection: 350
    }
}
Object.freeze(wetPerformance.flapFull);
Object.freeze(wetPerformance.config3);



// TODO: add FMCMainDisplay to FSTypes.d.ts -> ask in #dev-support
