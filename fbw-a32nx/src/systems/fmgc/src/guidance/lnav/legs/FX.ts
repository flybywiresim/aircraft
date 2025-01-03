import { Fix } from '@flybywiresim/fbw-sdk';
import { Leg } from '@fmgc/guidance/lnav/legs/Leg';

export abstract class FXLeg extends Leg {
  readonly fix: Fix;
}
