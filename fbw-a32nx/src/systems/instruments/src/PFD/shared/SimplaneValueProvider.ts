import { Publisher } from '@microsoft/msfs-sdk';

import { ArincEventBus } from 'instruments/src/MsfsAvionicsCommon/ArincEventBus';

export interface SimplaneValues {
    units: string;
    pressure: number;
    machActive: boolean;
    holdValue: number;
    airSpeedHoldValue: number;
    isSelectedSpeed: boolean;
    selectedAltitude: number;
    baroMode: 'QNH' | 'QFE' | 'STD';

}
export class SimplaneValueProvider {
    private publisher: Publisher<SimplaneValues>;

    constructor(private readonly bus: ArincEventBus) {
        this.publisher = this.bus.getPublisher<SimplaneValues>();
    }

    public onUpdate() {
        const units = Simplane.getPressureSelectedUnits();
        const pressure = Simplane.getPressureValue(units);
        const isSelected = Simplane.getAutoPilotAirspeedSelected();
        const isMach = Simplane.getAutoPilotMachModeActive();
        const selectedAltitude = Simplane.getAutoPilotDisplayedAltitudeLockValue();
        const holdValue = isMach ? Simplane.getAutoPilotMachHoldValue() : Simplane.getAutoPilotAirspeedHoldValue();
        const baroMode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO) as 'QNH' | 'QFE' | 'STD';

        this.publisher.pub('units', units);
        this.publisher.pub('pressure', pressure);
        this.publisher.pub('isSelectedSpeed', isSelected);
        this.publisher.pub('machActive', isMach);
        this.publisher.pub('holdValue', holdValue);
        this.publisher.pub('selectedAltitude', selectedAltitude);
        this.publisher.pub('baroMode', baroMode);
    }
}
