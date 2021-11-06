import { Feet, Knots } from '../../../../../typings';

export interface SpeedLimit {
    speed: Knots,
    underAltitude: Feet,
}
