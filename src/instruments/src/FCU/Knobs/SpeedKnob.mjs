import { useInteractionEvent } from '../../util.mjs';
import { PushPullKnob } from './PushPullKnob.mjs';


export class SpeedKnob extends PushPullKnob {
    constructor() {
        super();
        this.stateSimvar = 'L:A32NX_FCU_SPEED_STATE';
        this.valueSimvar = 'L:A32NX_FCU_SPEED_BUG';
        this.valueUnit = 'Knots';

        this.state = 0;
        this.value = 100;
    }

    registerInteractionHooks() {
        useInteractionEvent('A32NX_FCU_SPEED_PULLED', () => this.pull());
        useInteractionEvent('A32NX_FCU_SPEED_PUSHED', () => this.push());
        useInteractionEvent('A32NX_FCU_SPEED_TURNED_CLOCKWISE', () => this.increase());
        useInteractionEvent('A32NX_FCU_SPEED_TURNED_ANTICLOCKWISE', () => this.decrease());
    }

    getSelectedToManagedValue() {
        const value = SimVar.GetSimVarValue('AIRSPEED INDICATED', 'Knots');
        return this.calculateNextValue(value, 0);
    }

     calculateNextValue(_value, _speed) {
        return Utils.Clamp(Math.round(_value + _speed), 100, 399);
     }
}
