import { EventBus, SimVarValueType } from 'msfssdk';
import { getDisplayIndex } from '../PFD';
import { PFDSimvarPublisher, PFDSimvars } from './PFDSimvarPublisher';

export class AdirsValueProvider {
    constructor(private readonly bus: EventBus, private readonly pfdSimvar: PFDSimvarPublisher) {

    }

    public start() {
        const sub = this.bus.getSubscriber<PFDSimvars>();
        const displayIndex = getDisplayIndex();

        sub.on('attHdgKnob').whenChanged().handle((k) => {
            const inertialSource = getSupplier(displayIndex, k);
            this.pfdSimvar.updateSimVarSource('vsInert', { name: `L:A32NX_ADIRS_IR_${inertialSource}_VERTICAL_SPEED`, type: SimVarValueType.Number });
            this.pfdSimvar.updateSimVarSource('pitch', { name: `L:A32NX_ADIRS_IR_${inertialSource}_PITCH`, type: SimVarValueType.Number });
            this.pfdSimvar.updateSimVarSource('roll', { name: `L:A32NX_ADIRS_IR_${inertialSource}_ROLL`, type: SimVarValueType.Number });
            this.pfdSimvar.updateSimVarSource('heading', { name: `L:A32NX_ADIRS_IR_${inertialSource}_HEADING`, type: SimVarValueType.Number });
            this.pfdSimvar.updateSimVarSource('groundTrack', { name: `L:A32NX_ADIRS_IR_${inertialSource}_TRACK`, type: SimVarValueType.Number });
            this.pfdSimvar.updateSimVarSource('fpaRaw', { name: `L:A32NX_ADIRS_IR_${inertialSource}_FLIGHT_PATH_ANGLE`, type: SimVarValueType.Number });
            this.pfdSimvar.updateSimVarSource('daRaw', { name: `L:A32NX_ADIRS_IR_${inertialSource}_DRIFT_ANGLE`, type: SimVarValueType.Number });
        });

        sub.on('airKnob').whenChanged().handle((a) => {
            const airSource = getSupplier(displayIndex, a);
            this.pfdSimvar.updateSimVarSource('speed', { name: `L:A32NX_ADIRS_ADR_${airSource}_COMPUTED_AIRSPEED`, type: SimVarValueType.Number });
            this.pfdSimvar.updateSimVarSource('vsBaro', { name: `L:A32NX_ADIRS_ADR_${airSource}_BAROMETRIC_VERTICAL_SPEED`, type: SimVarValueType.Number });
            this.pfdSimvar.updateSimVarSource('altitude', { name: `L:A32NX_ADIRS_ADR_${airSource}_ALTITUDE`, type: SimVarValueType.Number });
            this.pfdSimvar.updateSimVarSource('mach', { name: `L:A32NX_ADIRS_ADR_${airSource}_MACH`, type: SimVarValueType.Number });
        });
    }
}

const isCaptainSide = (displayIndex: number | undefined) => displayIndex === 1;

const getSupplier = (displayIndex: number | undefined, knobValue: number) => {
    const adirs3ToCaptain = 0;
    const adirs3ToFO = 2;

    if (isCaptainSide(displayIndex)) {
        return knobValue === adirs3ToCaptain ? 3 : 1;
    }
    return knobValue === adirs3ToFO ? 3 : 2;
};
