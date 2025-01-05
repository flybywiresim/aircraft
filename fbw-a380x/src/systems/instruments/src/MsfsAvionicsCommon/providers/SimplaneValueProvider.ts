import { EventBus, Instrument, Publisher } from '@microsoft/msfs-sdk';

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
export class SimplaneValueProvider implements Instrument {
  private publisher: Publisher<SimplaneValues>;

  constructor(private readonly bus: EventBus) {
    this.publisher = this.bus.getPublisher<SimplaneValues>();
  }

  /** @inheritdoc */
  public init(): void {
    // noop
  }

  /** @inheritdoc */
  public onUpdate(): void {
    const units = Simplane.getPressureSelectedUnits();
    const pressure = Simplane.getPressureValue(units);
    const isSelected = Simplane.getAutoPilotAirspeedSelected();
    const isMach = Simplane.getAutoPilotMachModeActive();
    const selectedHeading = Simplane.getAutoPilotSelectedHeadingLockValue(false) || 0;
    const selectedAltitude = Simplane.getAutoPilotDisplayedAltitudeLockValue();
    const holdValue = isMach ? Simplane.getAutoPilotMachHoldValue() : Simplane.getAutoPilotAirspeedHoldValue();
    const baroMode = Simplane.getPressureSelectedMode(Aircraft.A320_NEO) as 'QNH' | 'QFE' | 'STD';

    this.publisher.pub('units', units);
    this.publisher.pub('pressure', pressure);
    this.publisher.pub('isSelectedSpeed', isSelected);
    this.publisher.pub('machActive', isMach);
    this.publisher.pub('holdValue', holdValue);
    this.publisher.pub('selectedHeading', selectedHeading);
    this.publisher.pub('selectedAltitude', selectedAltitude);
    this.publisher.pub('baroMode', baroMode);
  }
}
