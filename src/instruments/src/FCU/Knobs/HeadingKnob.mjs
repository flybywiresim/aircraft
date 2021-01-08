import { useInteractionEvent } from '../../util.mjs';
import { PushPullKnob } from './PushPullKnob.mjs';


export class HeadingKnob extends PushPullKnob {
    constructor() {
        super();
        this.stateSimvar = 'L:A32NX_FCU_HEADING_STATE';
        this.valueSimvar = 'L:A32NX_FCU_HEADING_BUG';
        this.valueUnit = 'Degrees';

        this.state = 0;
        this.value = 0;
    }

    registerInteractionHooks() {
        useInteractionEvent('A32NX_FCU_HEADING_PULLED', () => this.pull());
        useInteractionEvent('A32NX_FCU_HEADING_PUSHED', () => this.push());
        useInteractionEvent('A32NX_FCU_HEADING_TURNED_CLOCKWISE', () => this.increase());
        useInteractionEvent('A32NX_FCU_HEADING_TURNED_ANTICLOCKWISE', () => this.decrease());
    }

    getSelectedToManagedValue() {
        const value = SimVar.GetSimVarValue('PLANE HEADING DEGREES MAGNETIC', 'Degrees');
        return this.calculateNextValue(value, 0);
    }

     calculateNextValue(_value, _speed) {
        return ((Math.round(_value + _speed) % 360) + 360) % 360;
     }
}
