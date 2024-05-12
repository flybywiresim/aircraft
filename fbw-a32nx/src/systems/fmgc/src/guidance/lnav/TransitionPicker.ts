// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
import { HALeg, HFLeg, HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { RFLeg } from '@fmgc/guidance/lnav/legs/RF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Transition } from '@fmgc/guidance/lnav/Transition';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { PathCaptureTransition } from '@fmgc/guidance/lnav/transitions/PathCaptureTransition';
import { CourseCaptureTransition } from '@fmgc/guidance/lnav/transitions/CourseCaptureTransition';
import { DirectToFixTransition } from '@fmgc/guidance/lnav/transitions/DirectToFixTransition';
import { HoldEntryTransition } from '@fmgc/guidance/lnav/transitions/HoldEntryTransition';
import { CFLeg } from '@fmgc/guidance/lnav/legs/CF';
import { CRLeg } from '@fmgc/guidance/lnav/legs/CR';
import { CILeg } from '@fmgc/guidance/lnav/legs/CI';
import { AFLeg } from '@fmgc/guidance/lnav/legs/AF';
import { DmeArcTransition } from '@fmgc/guidance/lnav/transitions/DmeArcTransition';
import { PILeg } from '@fmgc/guidance/lnav/legs/PI';
import { CDLeg } from '@fmgc/guidance/lnav/legs/CD';
import { FDLeg } from '@fmgc/guidance/lnav/legs/FD';
import { FMLeg } from '@fmgc/guidance/lnav/legs/FM';
import { FALeg } from '@fmgc/guidance/lnav/legs/FA';

export class TransitionPicker {
  static forLegs(from: Leg, to: Leg): Transition | null {
    if (from instanceof AFLeg) {
      return TransitionPicker.fromAF(from, to);
    }
    if (from instanceof CALeg) {
      return TransitionPicker.fromCA(from, to);
    }
    if (from instanceof CDLeg) {
      return TransitionPicker.fromCD(from, to);
    }
    if (from instanceof CFLeg) {
      return TransitionPicker.fromCF(from, to);
    }
    if (from instanceof CILeg) {
      return TransitionPicker.fromCI(from, to);
    }
    if (from instanceof CRLeg) {
      return TransitionPicker.fromCR(from, to);
    }
    if (from instanceof DFLeg) {
      return TransitionPicker.fromDF(from, to);
    }
    if (from instanceof FALeg) {
      return TransitionPicker.fromFA(from, to);
    }
    if (from instanceof FDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return TransitionPicker.fromFD(from, to);
    }
    if (from instanceof FMLeg) {
      return TransitionPicker.fromFM(from, to);
    }
    if (from instanceof HALeg || from instanceof HFLeg || from instanceof HMLeg) {
      return TransitionPicker.fromHX(from, to);
    }
    if (from instanceof PILeg) {
      return TransitionPicker.fromPI(from, to);
    }
    if (from instanceof RFLeg) {
      return TransitionPicker.fromRF(from, to);
    }
    if (from instanceof TFLeg) {
      return TransitionPicker.fromTF(from, to);
    }
    if (from instanceof VMLeg) {
      return TransitionPicker.fromVM(from, to);
    }

    return null;
  }

  private static fromCA(from: CALeg, to: Leg): Transition | null {
    if (to instanceof CALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof DFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DirectToFixTransition(from, to);
    }
    if (to instanceof FALeg || to instanceof FDLeg || to instanceof FMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof CILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CRLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof TFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof VMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }

    // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
    if (DEBUG) {
      console.error(`Illegal sequence CALeg -> ${to.constructor.name}`);
    }

    return null;
  }

  private static fromCD(from: CDLeg, to: Leg): Transition | null {
    if (to instanceof AFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DmeArcTransition(from, to);
    }
    if (to instanceof CALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof CILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CRLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof DFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DirectToFixTransition(from, to);
    }
    if (to instanceof FALeg || to instanceof FDLeg || to instanceof FMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof VMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }

    return null;
  }

  private static fromAF(from: AFLeg, to: Leg): Transition | null {
    if (to instanceof CALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CFLeg) {
      // FIXME fixed radius / revert to path capture
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof CILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CRLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof FDLeg) {
      // FIXME here we might wanna do a DmeArcTransition; need to check ARINC 424 and IRL FMS to see if this would actually happen
      // (waypoint would need to lie on DME arc)
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof FALeg || to instanceof FMLeg) {
      // FIXME proper DME arc transition
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof HALeg || to instanceof HFLeg || to instanceof HMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new HoldEntryTransition(from, to);
    }
    if (to instanceof TFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DmeArcTransition(from, to);
    }
    if (to instanceof VMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }

    // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
    if (DEBUG) {
      console.error(`Illegal sequence AFLEg -> ${to.constructor.name}`);
    }

    return null;
  }

  private static fromCF(from: CFLeg, to: Leg): Transition | null {
    if (to instanceof AFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DmeArcTransition(from, to);
    }
    if (to instanceof CALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CFLeg) {
      // FIXME fixed radius / revert to path capture
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof DFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DirectToFixTransition(from, to);
    }
    if (to instanceof FALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof FDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof FMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof HALeg || to instanceof HFLeg || to instanceof HMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new HoldEntryTransition(from, to);
    }
    if (to instanceof PILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof TFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof CILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CRLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof VMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }

    // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
    if (DEBUG) {
      console.error(`Illegal sequence CFLeg -> ${to.constructor.name}`);
    }

    return null;
  }

  private static fromCI(from: CILeg, to: Leg): Transition | null {
    if (to instanceof AFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DmeArcTransition(from, to);
    }
    if (to instanceof CFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof FDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof FALeg || to instanceof FMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }

    // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
    if (DEBUG) {
      console.error(`Illegal sequence CILeg -> ${to.constructor.name}`);
    }

    return null;
  }

  private static fromDF(from: DFLeg, to: Leg): Transition | null {
    if (to instanceof AFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DmeArcTransition(from, to);
    }
    if (to instanceof CALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof DFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DirectToFixTransition(from, to);
    }
    if (to instanceof FALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof FDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof FMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof HALeg || to instanceof HFLeg || to instanceof HMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new HoldEntryTransition(from, to);
    }
    if (to instanceof PILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof CILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CRLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof TFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof VMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }

    // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
    if (DEBUG && !(to instanceof RFLeg)) {
      console.error(`Illegal sequence DFLeg -> ${to.constructor.name}`);
    }

    return null;
  }

  private static fromHX(from: HALeg | HFLeg | HMLeg, to: Leg): Transition | null {
    if (to instanceof AFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof CALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof DFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DirectToFixTransition(from, to);
    }
    if (to instanceof FALeg || to instanceof FDLeg || to instanceof FMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof TFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof CILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CRLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof VMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }

    // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
    if (DEBUG && !(to instanceof RFLeg)) {
      console.error(`Illegal sequence DFLeg -> ${to.constructor.name}`);
    }

    return null;
  }

  private static fromPI(from: PILeg, to: Leg): Transition | null {
    if (!(to instanceof CFLeg)) {
      console.error('PI -> !CF', from, to);
    }

    return null;
  }

  private static fromRF(from: RFLeg, to: Leg): Transition | null {
    if (to instanceof CALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof FALeg || to instanceof FDLeg || to instanceof FMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof HALeg || to instanceof HFLeg || to instanceof HMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new HoldEntryTransition(from, to);
    }

    // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
    if (DEBUG && !(to instanceof RFLeg) && !(to instanceof TFLeg)) {
      console.error(`Illegal sequence RFLeg -> ${to.constructor.name}`);
    }

    return null;
  }

  private static fromTF(from: TFLeg, to: Leg): Transition | null {
    if (to instanceof AFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DmeArcTransition(from, to);
    }
    if (to instanceof CALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CFLeg) {
      // FIXME / revert to fixed radius
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof DFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DirectToFixTransition(from, to);
    }
    if (to instanceof FDLeg) {
      // @ts-expect-error TS18048 -- TODO fix this manually (strict mode migration)
      const fromLegWaypointID = from.metadata.flightPlanLegDefinition.waypoint.databaseId;
      // @ts-expect-error TS18048 -- TODO fix this manually (strict mode migration)
      const toLegWaypointID = to.metadata.flightPlanLegDefinition.waypoint.databaseId;

      // If the FD leg starts at the same fix as the one on which the TF leg ends, we can use a fixed radius transition
      // instead to get a cleaner turn
      if (fromLegWaypointID === toLegWaypointID) {
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        return new FixedRadiusTransition(from, to);
      }

      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof FALeg || to instanceof FMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof HALeg || to instanceof HFLeg || to instanceof HMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new HoldEntryTransition(from, to);
    }
    if (to instanceof PILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof TFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new FixedRadiusTransition(from, to);
    }
    if (to instanceof CILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CRLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof VMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }

    // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
    if (DEBUG && !(to instanceof RFLeg)) {
      console.error(`Illegal sequence TFLeg -> ${to.constructor.name}`);
    }

    return null;
  }

  private static fromCR(from: CRLeg, to: Leg): Transition | null {
    if (to instanceof CALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CFLeg) {
      // FIXME / revert to fixed radius
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof DFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DirectToFixTransition(from, to);
    }
    if (to instanceof FALeg || to instanceof FDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof FMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof CILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CRLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof VMLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }

    // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
    if (DEBUG) {
      console.error(`Illegal sequence CRLeg -> ${to.constructor.name}`);
    }

    return null;
  }

  private static fromFA(from: FALeg, to: Leg): Transition | null {
    switch (true) {
      case to instanceof CALeg:
      case to instanceof CDLeg:
      case to instanceof CILeg:
      case to instanceof CRLeg:
      case to instanceof VMLeg:
        // case to instanceof VALeg:
        // case to instanceof VDLeg:
        // case to instanceof VILeg:
        // case to instanceof VRLeg:
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        return new CourseCaptureTransition(from, to);
      case to instanceof CFLeg:
      case to instanceof FALeg:
      case to instanceof FMLeg:
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        return new PathCaptureTransition(from, to);
      case to instanceof DFLeg:
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        return new DirectToFixTransition(from, to);
      default:
        // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
        if (DEBUG) {
          console.error(`Illegal sequence FMLeg -> ${to.constructor.name}`);
        }
        return null;
    }
  }

  private static fromFD(from: FDLeg, to: Leg) {
    if (to instanceof AFLeg) {
      return new DmeArcTransition(from, to);
    }
    if (to instanceof CALeg) {
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CDLeg) {
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CFLeg) {
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof CILeg) {
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CRLeg) {
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof DFLeg) {
      return new DirectToFixTransition(from, to);
    }
    if (to instanceof FMLeg) {
      return new PathCaptureTransition(from, to);
    }
    if (to instanceof VMLeg) {
      return new CourseCaptureTransition(from, to);
    }

    // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
    if (DEBUG) {
      console.error(`Illegal sequence FDLEg -> ${to.constructor.name}`);
    }

    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static fromFM(from: FMLeg, to: Leg): Transition | null {
    switch (true) {
      case to instanceof CALeg:
      case to instanceof CDLeg:
      case to instanceof CILeg:
      case to instanceof CRLeg:
      case to instanceof VMLeg:
        // case to instanceof VALeg:
        // case to instanceof VDLeg:
        // case to instanceof VILeg:
        // case to instanceof VRLeg:
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        return new CourseCaptureTransition(from, to);
      case to instanceof CFLeg:
      case to instanceof FALeg:
      case to instanceof FMLeg:
        return null;
      case to instanceof DFLeg:
        // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
        return new DirectToFixTransition(from, to);
      default:
        // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
        if (DEBUG) {
          console.error(`Illegal sequence FMLeg -> ${to.constructor.name}`);
        }
        return null;
    }
  }

  private static fromVM(from: VMLeg, to: Leg): Transition | null {
    if (to instanceof CALeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CDLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof CILeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof DFLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new DirectToFixTransition(from, to);
    }
    if (to instanceof CRLeg) {
      // @ts-expect-error TS2322 -- TODO fix this manually (strict mode migration)
      return new CourseCaptureTransition(from, to);
    }
    if (to instanceof FALeg || to instanceof FMLeg) {
      return null;
    }

    // @ts-expect-error TS2774 -- TODO fix this manually (strict mode migration)
    if (DEBUG) {
      console.error(`Illegal sequence VMLeg -> ${to.constructor.name}`);
    }

    return null;
  }
}
