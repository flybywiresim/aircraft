import { Leg } from '@fmgc/guidance/lnav/legs/Leg';
import { CALeg } from '@fmgc/guidance/lnav/legs/CA';
import { DFLeg } from '@fmgc/guidance/lnav/legs/DF';
import { HALeg, HFLeg, HMLeg } from '@fmgc/guidance/lnav/legs/HX';
import { RFLeg } from '@fmgc/guidance/lnav/legs/RF';
import { TFLeg } from '@fmgc/guidance/lnav/legs/TF';
import { VMLeg } from '@fmgc/guidance/lnav/legs/VM';
import { Transition } from '@fmgc/guidance/lnav/transition';
import { FixedRadiusTransition } from '@fmgc/guidance/lnav/transitions/FixedRadiusTransition';
import { PathCaptureTransition } from '@fmgc/guidance/lnav/transitions/PathCaptureTransition';
import { CourseCaptureTransition } from '@fmgc/guidance/lnav/transitions/CourseCaptureTransition';
import { DirectToFixTransition } from '@fmgc/guidance/lnav/transitions/DirectToFixTransition';
import { HoldEntryTransition } from '@fmgc/guidance/lnav/transitions/HoldEntryTransition';
import { CFLeg } from '@fmgc/guidance/lnav/legs/CF';
import { CRLeg } from '@fmgc/guidance/lnav/legs/CR';
import { CILeg } from '@fmgc/guidance/lnav/legs/CI';

export class TransitionPicker {
    static forLegs(from: Leg, to: Leg): Transition | null {
        if (from instanceof CALeg) {
            return TransitionPicker.fromCA(from, to);
        }
        if (from instanceof CFLeg) {
            return TransitionPicker.fromCF(from, to);
        }
        if (from instanceof DFLeg) {
            return TransitionPicker.fromDF(from, to);
        }
        if (from instanceof HALeg || from instanceof HFLeg || from instanceof HMLeg) {
            return TransitionPicker.fromHX(from, to);
        }
        if (from instanceof RFLeg) {
            return TransitionPicker.fromRF(from, to);
        }
        if (from instanceof TFLeg) {
            return TransitionPicker.fromTF(from, to);
        }
        if (from instanceof CILeg) {
            return TransitionPicker.fromCI(from, to);
        }
        if (from instanceof CRLeg) {
            return TransitionPicker.fromCR(from, to);
        }
        if (from instanceof VMLeg) {
            return TransitionPicker.fromVM(from, to);
        }

        if (DEBUG) {
            console.error(`[FMS/Geometry] Could not pick transition between '${from.repr}' and '${to.repr}'.`);
        }

        return null;
    }

    private static fromCA(from: CALeg, to: Leg): Transition | null {
        if (to instanceof CALeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CFLeg) {
            return new PathCaptureTransition(from, to);
        }
        if (to instanceof DFLeg) {
            return new DirectToFixTransition(from, to);
        }
        if (to instanceof CILeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CRLeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof TFLeg) {
            return new PathCaptureTransition(from, to);
        }
        if (to instanceof VMLeg) {
            return new CourseCaptureTransition(from, to);
        }

        if (DEBUG) {
            console.error(`Illegal sequence CALeg -> ${to.constructor.name}`);
        }

        return null;
    }

    private static fromCF(from: CFLeg, to: Leg): Transition | null {
        if (to instanceof CALeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CFLeg) {
            // FIXME fixed radius / revert to path capture
            return new PathCaptureTransition(from, to);
        }
        if (to instanceof DFLeg) {
            return new DirectToFixTransition(from, to);
        }
        if (to instanceof HALeg || to instanceof HFLeg || to instanceof HMLeg) {
            return new HoldEntryTransition(from, to);
        }
        if (to instanceof TFLeg) {
            return new FixedRadiusTransition(from, to);
        }
        if (to instanceof CILeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CRLeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof VMLeg) {
            return new CourseCaptureTransition(from, to);
        }

        if (DEBUG) {
            console.error(`Illegal sequence CFLeg -> ${to.constructor.name}`);
        }

        return null;
    }

    private static fromCI(from: CILeg, to: Leg): Transition | null {
        if (to instanceof CFLeg) {
            return new FixedRadiusTransition(from, to);
        }

        if (DEBUG) {
            console.error(`Illegal sequence CILeg -> ${to.constructor.name}`);
        }

        return null;
    }

    private static fromDF(from: DFLeg, to: Leg): Transition | null {
        if (to instanceof CALeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CFLeg) {
            return new FixedRadiusTransition(from, to);
        }
        if (to instanceof DFLeg) {
            return new DirectToFixTransition(from, to);
        }
        if (to instanceof HALeg || to instanceof HFLeg || to instanceof HMLeg) {
            return new HoldEntryTransition(from, to);
        }
        if (to instanceof CILeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CRLeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof TFLeg) {
            return new FixedRadiusTransition(from, to);
        }
        if (to instanceof VMLeg) {
            return new CourseCaptureTransition(from, to);
        }

        if (DEBUG && !(to instanceof RFLeg)) {
            console.error(`Illegal sequence DFLeg -> ${to.constructor.name}`);
        }

        return null;
    }

    private static fromHX(from: HALeg | HFLeg |HMLeg, to: Leg): Transition | null {
        if (to instanceof CALeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CFLeg) {
            return new PathCaptureTransition(from, to);
        }
        if (to instanceof DFLeg) {
            return new DirectToFixTransition(from, to);
        }
        if (to instanceof TFLeg) {
            return new PathCaptureTransition(from, to);
        }
        if (to instanceof CILeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CRLeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof VMLeg) {
            return new CourseCaptureTransition(from, to);
        }

        if (DEBUG && !(to instanceof RFLeg)) {
            console.error(`Illegal sequence DFLeg -> ${to.constructor.name}`);
        }

        return null;
    }

    private static fromRF(from: RFLeg, to: Leg): Transition | null {
        if (to instanceof CALeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CILeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof HALeg || to instanceof HFLeg || to instanceof HMLeg) {
            return new HoldEntryTransition(from, to);
        }

        if (DEBUG && !(to instanceof RFLeg) && !(to instanceof TFLeg)) {
            console.error(`Illegal sequence RFLeg -> ${to.constructor.name}`);
        }

        return null;
    }

    private static fromTF(from: TFLeg, to: Leg): Transition | null {
        if (to instanceof CALeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CFLeg) {
            // FIXME / revert to fixed radius
            return new FixedRadiusTransition(from, to);
        }
        if (to instanceof DFLeg) {
            return new DirectToFixTransition(from, to);
        }
        if (to instanceof HALeg || to instanceof HFLeg || to instanceof HMLeg) {
            return new HoldEntryTransition(from, to);
        }
        if (to instanceof TFLeg) {
            if (from.fix.additionalData.overfly) {
                return new PathCaptureTransition(from, to);
            }

            return new FixedRadiusTransition(from, to);
        }
        if (to instanceof CILeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CRLeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof VMLeg) {
            return new CourseCaptureTransition(from, to);
        }

        if (DEBUG && !(to instanceof RFLeg)) {
            console.error(`Illegal sequence TFLeg -> ${to.constructor.name}`);
        }

        return null;
    }

    private static fromCR(from: CRLeg, to: Leg): Transition | null {
        if (to instanceof CALeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CFLeg) {
            // FIXME / revert to fixed radius
            return new PathCaptureTransition(from, to);
        }
        if (to instanceof DFLeg) {
            return new DirectToFixTransition(from, to);
        }
        if (to instanceof CILeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CRLeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof VMLeg) {
            return new CourseCaptureTransition(from, to);
        }

        if (DEBUG) {
            console.error(`Illegal sequence CRLeg -> ${to.constructor.name}`);
        }

        return null;
    }

    private static fromVM(from: VMLeg, to: Leg): Transition | null {
        if (to instanceof CALeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof DFLeg) {
            return new DirectToFixTransition(from, to);
        }
        if (to instanceof CILeg) {
            return new CourseCaptureTransition(from, to);
        }
        if (to instanceof CRLeg) {
            return new CourseCaptureTransition(from, to);
        }

        if (DEBUG) {
            console.error(`Illegal sequence VMLeg -> ${to.constructor.name}`);
        }

        return null;
    }
}
