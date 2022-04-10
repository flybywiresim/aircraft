import { EventBus, SimVarPublisher, SimVarValueType } from 'msfssdk';
import { EfisSide } from '@shared/NavigationDisplay';
import { AdirsSimVars, SwitchingPanelVSimVars } from './SimVarTypes';

export class AdirsValueProvider<T extends AdirsSimVars> {
    constructor(
        private readonly bus: EventBus,
        private readonly varProvider: SimVarPublisher<T>,
        private readonly displayIndex: EfisSide,
    ) {
    }

    public start() {
        const sub = this.bus.getSubscriber<SwitchingPanelVSimVars>();

        sub.on('attHdgKnob').whenChanged().handle((knobPosition) => {
            const inertialSource = getSupplier(this.displayIndex, knobPosition);
            this.varProvider.updateSimVarSource('vsInert', { name: `L:A32NX_ADIRS_IR_${inertialSource}_VERTICAL_SPEED`, type: SimVarValueType.Number });
            this.varProvider.updateSimVarSource('pitch', { name: `L:A32NX_ADIRS_IR_${inertialSource}_PITCH`, type: SimVarValueType.Number });
            this.varProvider.updateSimVarSource('roll', { name: `L:A32NX_ADIRS_IR_${inertialSource}_ROLL`, type: SimVarValueType.Number });
            this.varProvider.updateSimVarSource('heading', { name: `L:A32NX_ADIRS_IR_${inertialSource}_HEADING`, type: SimVarValueType.Number });
            this.varProvider.updateSimVarSource('groundTrack', { name: `L:A32NX_ADIRS_IR_${inertialSource}_TRACK`, type: SimVarValueType.Number });
            this.varProvider.updateSimVarSource('fpaRaw', { name: `L:A32NX_ADIRS_IR_${inertialSource}_FLIGHT_PATH_ANGLE`, type: SimVarValueType.Number });
            this.varProvider.updateSimVarSource('daRaw', { name: `L:A32NX_ADIRS_IR_${inertialSource}_DRIFT_ANGLE`, type: SimVarValueType.Number });
        });

        sub.on('airKnob').whenChanged().handle((knobPosition) => {
            const airSource = getSupplier(this.displayIndex, knobPosition);
            this.varProvider.updateSimVarSource('speed', { name: `L:A32NX_ADIRS_ADR_${airSource}_COMPUTED_AIRSPEED`, type: SimVarValueType.Number });
            this.varProvider.updateSimVarSource('vsBaro', { name: `L:A32NX_ADIRS_ADR_${airSource}_BAROMETRIC_VERTICAL_SPEED`, type: SimVarValueType.Number });
            this.varProvider.updateSimVarSource('altitude', { name: `L:A32NX_ADIRS_ADR_${airSource}_ALTITUDE`, type: SimVarValueType.Number });
            this.varProvider.updateSimVarSource('mach', { name: `L:A32NX_ADIRS_ADR_${airSource}_MACH`, type: SimVarValueType.Number });
        });
    }
}

const getSupplier = (displaySide: EfisSide, knobValue: number) => {
    const adirs3ToCaptain = 0;
    const adirs3ToFO = 2;

    if (displaySide === 'L') {
        return knobValue === adirs3ToCaptain ? 3 : 1;
    }
    return knobValue === adirs3ToFO ? 3 : 2;
};
