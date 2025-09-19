import { Fix } from '@flybywiresim/fbw-sdk';
import { Leg } from './Leg';

export abstract class FXLeg extends Leg {
  constructor(public readonly fix: Fix) {
    super();
  }
}
