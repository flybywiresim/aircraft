import { EventBus, Publisher } from '@microsoft/msfs-sdk';

export interface SimplaneValues {
    units: string;
    pressure: number;
    machActive: boolean;
    holdValue: number;
    airSpeedHoldValue: number;
    isSelectedSpeed: boolean;
    selectedHeading: number;
    selectedAltitude: number;
    baroMode: 'QNH' | 'QFE' | 'STD';

}
export class SimplaneValueProvider {
    private publisher: Publisher<SimplaneValues>;

    constructor(private readonly bus: EventBus) {
        this.publisher = this.bus.getPublisher<SimplaneValues>();
    }

    public onUpdate() {
       // const units = Simplane.getPressureSelectedUnits(); "L:XMLVAR_Baro_Selector_HPA_1" -> 0 -> "inches of mercury"-> 1 -> "millibar":
       // const pressure = Simplane.getPressureValue(units); -> SimVar.GetSimVarValue("KOHLSMAN SETTING HG", _units);
        //const isSelected = Simplane.getAutoPilotAirspeedSelected(); "AUTOPILOT SPEED SLOT INDEX" === 1
      //  const isMach = Simplane.getAutoPilotMachModeActive(); "L:XMLVAR_AirSpeedIsInMach" bool
       // const selectedHeading = Simplane.getAutoPilotSelectedHeadingLockValue(false) || 0; SimVarGetter("AUTOPILOT HEADING LOCK DIR:1", "degrees", SlowSimVarTimer);
       // const selectedAltitude = Simplane.getAutoPilotDisplayedAltitudeLockValue(); SimVarGetter("AUTOPILOT ALTITUDE LOCK VAR:3", "feet", MedSimVarTimer);
       // const holdValue = isMach ? Simplane.getAutoPilotMachHoldValue() : Simplane.getAutoPilotAirspeedHoldValue(); "AUTOPILOT MACH HOLD VAR", "number" || "AUTOPILOT AIRSPEED HOLD VAR", "knots"
      //  const baroMode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO) as 'QNH' | 'QFE' | 'STD'; L:XMLVAR_Baro1_Mode -> 0 -> QFE -> 1 -> QNH -> 2 -> "STD"

      /*   this.publisher.pub('units', units);
        this.publisher.pub('pressure', pressure);
        this.publisher.pub('isSelectedSpeed', isSelected);
        this.publisher.pub('machActive', isMach);
        this.publisher.pub('holdValue', holdValue);
        this.publisher.pub('selectedHeading', selectedHeading);
        this.publisher.pub('selectedAltitude', selectedAltitude);
        this.publisher.pub('baroMode', baroMode); */
    }
}
