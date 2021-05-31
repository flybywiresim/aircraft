// class A32NX_ROPS {
//     constructor(_fmcMainDisplay) {
//         console.log("A32NX_ROPS constructed");
//         this.fmcMainDisplay = _fmcMainDisplay;
//         this.fpm = this.fmcMainDisplay.flightPlanManager;
//         this.lda = NaN;
//     }

//     init() {
//         console.log("A32NX_ROPS init");

//         // Put the ROPS into the appropriate state when loading into the aircraft.
//         if (ra > 2000) {
//             ropsStateMachine.states.GROUND_INHIBIT.engageInflightInhibit();
//         } else if (ra <= 2000 && ra > 400) {
//             ropsStateMachine.states.FLIGHT_INHIBIT.activateROPS();
//         } else if (ra <= 400 && !Simplane.getIsGrounded()) {
//             ropsStateMachine.states.ROPS.armROW();
//         } else if (Simplane.getIsGrounded()) {
//             ropsStateMachine.states.ROP.engageGroundInhibit();
//         }

//         SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
//         SimVar.SetSimVarValue("L:A32NX_ROPS_IF_WET", "bool", 0);
//         SimVar.SetSimVarValue("L:A32NX_ROPS_TOO_SHORT", "bool", 0);
//         SimVar.SetSimVarValue("L:A32NX_ROPS_MAX_BRAKING", "bool", 0);
//         SimVar.SetSimVarValue("L:A32NX_ROPS_KEEP_REVERSE", "bool", 0);

//         const ra = Simplane.getAltitudeAboveGround();
//         const gs = Simplane.getGroundSpeed();
//         console.log(gs);
//         console.log(ra);
//         console.log(`CURRENT STATE: ${ropsStateMachine.currentState.value}`);
//     }

//     update() {
//         this.updateState();

//         ropsStateMachine.currentState.execute();
//     }

//     /**
//      * Checks the current state and will transition to the next state if required.
//      */
//     updateState() {
//         const ra = Simplane.getAltitudeAboveGround();
//         const gs = Simplane.getGroundSpeed();

//         console.log(`GS: ${gs}`);
//         console.log(`RA: ${ra}`);

//         const state = ropsStateMachine.currentState;
//         console.log(`CUR STATE: ${state.value}`);

//         switch (state.value) {
//             case 0:
//                 if (ra <= 2000 && ra > 400) {
//                     state.activateROPS();
//                 }
//                 break;
//             case 1:
//                 if (ra <= 400) {
//                     state.armROW();
//                 }
//                 break;
//             case 2:
//                 if (Simplane.getIsGrounded() && gs >= 30) {
//                     state.engageROP();
//                 }
//                 break;
//             case 3:
//                 if (gs < 30) {
//                     state.engageGroundInhibit();
//                 }
//                 break;
//             case 4:
//                 if (ra > 2000) {
//                     state.engageInFlightInhibit();
//                 }
//         }
//     }
// }

// /* BEGINNING OF LD CONSTANTS */
// // DO NOT CHANGE THESE

// const dryPerformance = {
//     flapFull: {
//         refDist: 1060,
//         positiveWeightCorrection: 50,
//         negativeWeightCorrection: -10,
//         speedCorrection: 70,
//         altCorrections: 40,
//         windCorrection: 130,
//         tempCorrection: 30,
//         downSlopeCorrection: 20,
//         reverseThrCorrection: 0,
//         overWeightCorrection: 910,
//         autolandCorrection: 280
//     },
//     config3: {
//         refDist: 1210,
//         positiveWeightCorrection: 50,
//         negativeWeightCorrection: 10,
//         speedCorrection: 80,
//         altCorrection: 50,
//         windCorrection: 130,
//         tempCorrection: 40,
//         downSlopeCorrection: 30,
//         reverseThrCorrection: - 20,
//         overWeightCorrection: 1080,
//         autolandCorrection: 250
//     }
// }
// Object.freeze(dryPerformance.flapFull);
// Object.freeze(dryPerformance.config3)

// const wetPerformance = {
//     flapFull: {
//         refDist: 2760,
//         positiveWeightCorrection: 60,
//         negativeWeightCorrection: -20,
//         speedCorrection: 140,
//         altCorrections: 110,
//         windCorrection: 430,
//         tempCorrection: 110,
//         downSlopeCorrection: 460,
//         reverseThrCorrection: -370,
//         overWeightCorrection: 550,
//         autolandCorrection: 360
//     },
//     config3: {
//         refDist: 3250,
//         positiveWeightCorrection: 70,
//         negativeWeightCorrection: -30,
//         speedCorrection: 150,
//         altCorrection: 130,
//         windCorrection: 470,
//         tempCorrection: 130,
//         downSlopeCorrection: 550,
//         reverseThrCorrection: -490,
//         overWeightCorrection: 660,
//         autolandCorrection: 350
//     }
// }
// Object.freeze(wetPerformance.config3);
// Object.freeze(wetPerformance.flapFull);

// /* END OF LD CONSTANTS */


// /*
//     FLIGHT_INHIBIT: The ROPS is inhibited - active above 2000ft RA
//     ROPS: The ROPS is actively detecting the landing runway
//     ROW: The ROW function arms and continously calculates the required landing distance -> activates if the available distance drops below the "WET RUNWAY" threshold
//     ROP: The ROP arms and continously calculates the required landing distance -> activates if the required distance is more than the distance available
//     GROUND_INHIBIT: The ROPS is inhibited on the ground - activates when on ground and GS < 30 kts - stays active until RA > 2000 ft
//  */
// const ropsStateMachine = { // TODO: impl. all runway related values
//     currentState: null,
//     states: {
//         FLIGHT_INHIBIT: {
//             value: 0,
//             activateROPS: () => {
//                 ropsStateMachine.currentState = ropsStateMachine.states.ROPS;
//                 SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
//             },
//             execute: () => {
//                 return;
//             }
//         },
//         ROPS: {
//             value: 1,
//             armROW: () => {
//                 ropsStateMachine.currentState = ropsStateMachine.states.ROW;
//                 SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
//             },
//             execute: () => {
//                 // TODO: landing runway detection
//             }
//         },
//         ROW: {
//             value: 2,
//             engageROP: () => {
//                 ropsStateMachine.currentState = ropsStateMachine.states.ROP;
//                 SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
//             },
//             execute: () => {
//                 const weight = Simplane.getWeight();
//                 const ias = Simplane.getIndicatedSpeed();
//                 const hdg = Simplane.getHeadingMagnetic();
//                 const vapp = this._fmcMainDisplay.approachSpeeds.vapp;
//                 const lda = NaN;
//                 const alt = Simplane.getAltitude();
//                 const windDirection = Simplane.getWindDirection();
//                 const windSpeed = Simplane.getWindStrength();
//                 const temp = Simplane.getAmbientTemperature();
//                 const downSlope = null; // TODO: impl. once runway system is impl.
//                 const isConfig3 = SimVar.GetSimVarValue("L:A32NX_VSPEEDS_LANDING_CONF3", "bool");
//                 const isAutoland = SimVar.GetSimVarValue("L:A32NX_AUTOPILOT_ACTIVE", "bool");

//                 // Compute Wet
//                 if (isConfig3) {
//                     let ldr = wetPerformance.config3.refDist;

//                     if (weight > 68) {
//                         for (let i = (weight - 68); i > 0; i--) {
//                             ldr += wetPerformance.config3.positiveWeightCorrection;
//                         }
//                     } else if (weight < 68) {
//                         for (let i = (68 - weight); i > 0; i--) {
//                             ldr += wetPerformance.config3.negativeWeightCorrection;
//                         }
//                     }

//                     if (ias > vapp) {
//                         for (let i = (ias - vapp); i > 0; i--) {
//                             ldr += wetPerformance.config3.speedCorrection;
//                         }
//                     }

//                     if (alt > 0) {} // TODO: impl. landing runway elevation

//                     if (windDirection) {} // TODO: impl. wind direction check -> only true if TL

//                     if (temp) {}

//                     if (slope) {}

//                     ldr += wetPerformance.config3.reverseThrCorrection;
//                     ldr += wetPerformance.config3.overWeightCorrection;

//                     if (isAutoland) {
//                         ldr += wetPerformance.config3.autolandCorrection;
//                     }

//                     ldr = ldr * 0.15; // Add 15% safety margin

//                     if (ldr > lda) {
//                         SimVar.SetSimVarValue("L:A32NX_ROPS_IF_WET", "bool", 1);
//                     } else {
//                         SimVar.SetSimVarValue("L:A32NX_ROPS_IF_WET", "bool", 0);
//                     }
//                 }
//             }
//         },
//         ROP: {
//             value: 3,
//             engageGroundInhibit: () => {
//                 ropsStateMachine.currentState = ropsStateMachine.states.GROUND_INHIBIT;
//                 SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
//             },
//             execute: () => {

//             }
//         },
//         GROUND_INHIBIT: {
//             value: 4,
//             engageInflightInhibit: () => {
//                 ropsStateMachine.currentState = ropsStateMachine.states.FLIGHT_INHIBIT;
//                 SimVar.SetSimVarValue("L:A32NX_ROPS_STATE", "number", ropsStateMachine.currentState.value);
//             },
//             execute: () => {

//             }
//         }
//     }
// }
