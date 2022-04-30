// // Copyright (c) 2022 FlyByWire Simulations
// // SPDX-License-Identifier: GPL-3.0
//
// const SHOW_DEBUG_INFO = false;
//
// const InternalTugHeadingDegrees = 0xffffffff / 360;
//
// export class PushbackUpdater {
//     private timeout = 50;
//
//     private updateInterval = undefined;
//
//     private lastTime = 0.0;
//
//     private startTime = 0.0;
//
//     private deltaTime = 0.0;
//
//     private updateTime = 0.0;
//
//     private simOnGround = true;
//
//     private pushBackAttached = false;
//
//     private parkingBrakeEngaged = true;
//
//     private aircraftHeading = 0;
//
//     private tugCommandedSpeedFactor = 0;
//
//     private tugCommandedHeadingFactor = 0;
//
//     private computedTugHeading = 0;
//
//     constructor() {
//         console.log('PushbackUpdater initialized.');
//     }
//
//     updater(pb) {
//         pb.startTime = Date.now();
//         pb.deltaTime = pb.startTime - pb.lastTime;
//         pb.lastTime = pb.startTime;
//         SimVar.SetSimVarValue('L:A32NX_PUSHBACK_DELTA_TIME', 'Number', pb.deltaTime);
//
//         pb.simOnGround = SimVar.GetSimVarValue('SIM ON GROUND', 'bool');
//         pb.pushBackAttached = SimVar.GetSimVarValue('Pushback Attached', 'bool');
//
//         if (pb.pushBackAttached && pb.simOnGround) {
//             pb.tugCommandedSpeedFactor = SimVar.GetSimVarValue('L:A32NX_PUSHBACK_TUG_COMMANDED_SPEED_FACTOR', 'Number');
//             // If no speed is commanded stop the aircraft and return.
//             if (pb.tugCommandedSpeedFactor === 0) {
//                 SimVar.SetSimVarValue('K:KEY_TUG_SPEED', 'Number', 0);
//                 SimVar.SetSimVarValue('Pushback Wait', 'bool', true);
//                 SimVar.SetSimVarValue('VELOCITY BODY Z', 'Number', 0);
//             } else {
//                 SimVar.SetSimVarValue('Pushback Wait', 'bool', false);
//                 pb.parkingBrakeEngaged = SimVar.GetSimVarValue('L:A32NX_PARK_BRAKE_LEVER_POS', 'Bool');
//                 pb.aircraftHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degrees');
//                 pb.tugCommandedHeadingFactor = SimVar.GetSimVarValue('L:A32NX_PUSHBACK_TUG_COMMANDED_HEADING_FACTOR', 'Number');
//                 pb.computedTugHeading = (pb.aircraftHeading - (50 * pb.tugCommandedHeadingFactor)) % 360;
//                 // Set tug heading
//                 SimVar.SetSimVarValue('L:A32NX_PUSHBACK_TUG_COMMANDED_HEADING', 'Number',
//                     pb.computedTugHeading); // debug
//                 SimVar.SetSimVarValue('K:KEY_TUG_HEADING', 'Number',
//                     (pb.computedTugHeading * InternalTugHeadingDegrees) & 0xffffffff);
//                 SimVar.SetSimVarValue('ROTATION VELOCITY BODY Y', 'Number',
//                     (pb.tugCommandedSpeedFactor <= 0 ? -1 : 1) * pb.tugCommandedHeadingFactor * (pb.parkingBrakeEngaged ? 0.01 : 0.1));
//                 // Set tug speed
//                 SimVar.SetSimVarValue('K:KEY_TUG_SPEED', 'Number', 0);
//                 SimVar.SetSimVarValue('VELOCITY BODY Z', 'Number', pb.tugCommandedSpeedFactor * (pb.parkingBrakeEngaged ? 0.8 : 8));
//
//                 SimVar.SetSimVarValue('ROTATION VELOCITY BODY X', 'Number', 0);
//                 SimVar.SetSimVarValue('ROTATION VELOCITY BODY Z', 'Number', 0);
//                 SimVar.SetSimVarValue('VELOCITY BODY X', 'Number', 0);
//                 SimVar.SetSimVarValue('VELOCITY BODY Y', 'Number', 0);
//             }
//         }
//
//         if (SHOW_DEBUG_INFO) {
//             pb.updateTime = Date.now() - pb.startTime;
//             console.log(`Pushback update took: ${pb.updateTime}ms - Delta: ${pb.deltaTime}ms`);
//         }
//     }
// }
