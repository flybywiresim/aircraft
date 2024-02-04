import { EventBus, SimVarValueType } from '@microsoft/msfs-sdk';
import { PFDSimvarPublisher, PFDSimvars } from './PFDSimvarPublisher';

export class SimplaneValueProvider {
    constructor(private readonly bus: EventBus, private readonly pfdSimvar: PFDSimvarPublisher) {}

    public start() {
        const sub = this.bus.getSubscriber<PFDSimvars>();

        sub.on('baroUnit').whenChanged().handle((bu) => {
            this.pfdSimvar.updateSimVarSource('baroPressure', { name: 'KOHLSMAN SETTING HG', type: bu === 0 ? SimVarValueType.InHG : SimVarValueType.MB });
        });

        sub.on('isAirspeedMach').whenChanged().handle((am) => {
            this.pfdSimvar.updateSimVarSource('airspeedHoldValue', {
                name: am ? 'AUTOPILOT MACH HOLD VAR' : 'AUTOPILOT AIRSPEED HOLD VAR',
                type: am ? SimVarValueType.Number : SimVarValueType.Knots,
            });
        });
    }
}
