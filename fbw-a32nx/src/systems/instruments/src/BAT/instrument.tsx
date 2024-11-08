import {
  ClockPublisher,
  ConsumerSubject,
  EventBus,
  FsBaseInstrument,
  FSComponent,
  FsInstrument,
  InstrumentBackplane,
  Subject,
} from '@microsoft/msfs-sdk';
import { BatSelectorPositions, BatteryDisplay } from '@shared/battery/BatDisplay';
import { BatSimVarPublisher, BatSimVars } from '@shared/battery/BatDisplaySimVarPublisher';

import './style.scss';

class BatInstrument implements FsInstrument {
  private readonly bus = new EventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher = new BatSimVarPublisher(this.bus);

  private readonly clockPublisher = new ClockPublisher(this.bus);

  private readonly sub = this.bus.getSubscriber<BatSimVars>();

  private readonly ovhdAnnLtSwitchPositionConsumer = ConsumerSubject.create<number>(
    this.sub.on('A32NX_ovhdAnnLtSwitchPos'),
    1,
  );

  constructor(public readonly instrument: BaseInstrument) {
    this.backplane.addPublisher('SimVars', this.simVarPublisher);
    this.backplane.addPublisher('Clock', this.clockPublisher);

    this.doInit();
  }

  private doInit(): void {
    this.backplane.init();

    FSComponent.render(
      <svg className="bat-svg" viewBox="0 0 200 100">
        <BatteryDisplay
          bus={this.bus}
          selectedBattery={Subject.create<number>(BatSelectorPositions.BAT1)}
          annLtTestPosition={this.ovhdAnnLtSwitchPositionConsumer}
          textX={184}
          textY={45}
        />
        <BatteryDisplay
          bus={this.bus}
          selectedBattery={Subject.create<number>(BatSelectorPositions.BAT2)}
          annLtTestPosition={this.ovhdAnnLtSwitchPositionConsumer}
          textX={184}
          textY={95}
        />
      </svg>,
      document.getElementById('BAT_CONTENT'),
    );

    document.getElementById('BAT_CONTENT')!.querySelector(':scope > h1')!.remove();
  }

  Update(): void {
    this.backplane.onUpdate();
  }

  onInteractionEvent(_args: Array<string>): void {
    // noop
  }

  onFlightStart(): void {
    // noop
  }

  onGameStateChanged(_oldState: GameState, _newState: GameState): void {
    // noop
  }

  onSoundEnd(_soundEventId: Name_Z): void {
    // noop
  }

  public onPowerOn(): void {
    // noop
  }

  public onPowerOff(): void {
    // noop
  }
}

export class A32NX_BAT extends FsBaseInstrument<BatInstrument> {
  public constructInstrument(): BatInstrument {
    return new BatInstrument(this);
  }

  get isInteractive(): boolean {
    return false;
  }

  get templateID(): string {
    return 'A32NX_BAT';
  }
}

registerInstrument('a32nx-bat', A32NX_BAT);
