import {
  ClockPublisher,
  ConsumerSubject,
  EventBus,
  FsBaseInstrument,
  FSComponent,
  FsInstrument,
  InstrumentBackplane,
} from '@microsoft/msfs-sdk';
import { BatteryDisplay } from '@shared/battery/BatDisplay';

import './style.scss';
import { BatSimVarPublisher, BatSimVars } from '@shared/battery/BatDisplaySimVarPublisher';

class BatInstrument implements FsInstrument {
  private readonly bus = new EventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher = new BatSimVarPublisher(this.bus);

  private readonly clockPublisher = new ClockPublisher(this.bus);

  private readonly sub = this.bus.getSubscriber<BatSimVars>();

  private readonly batteryPositionConsumer = ConsumerSubject.create<number>(
    this.sub.on('A380X_ovhdBatSelectorSwitchPos'),
    2,
  );

  private readonly ovhdAnnLtSwitchPositionConsumer = ConsumerSubject.create<number>(
    this.sub.on('A380X_ovhdAnnLtSwitchPos'),
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
      <BatteryDisplay
        bus={this.bus}
        selectedBattery={this.batteryPositionConsumer}
        annLtTestPosition={this.ovhdAnnLtSwitchPositionConsumer}
        textX={196}
        textY={48}
      />,
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

export class A380X_BAT extends FsBaseInstrument<BatInstrument> {
  public constructInstrument(): BatInstrument {
    return new BatInstrument(this);
  }

  get isInteractive(): boolean {
    return false;
  }

  get templateID(): string {
    return 'A380X_BAT';
  }
}

registerInstrument('a380x-bat', A380X_BAT);
