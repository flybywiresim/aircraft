import { Leg } from '@fmgc/guidance/lnav/legs/Leg';

export abstract class XFLeg extends Leg {
    public fix: WayPoint;

    get ident(): string {
        return this.fix.ident;
    }
}
