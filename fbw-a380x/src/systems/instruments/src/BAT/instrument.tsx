import {
  ClockPublisher,
  EventBus,
  FsBaseInstrument,
  FSComponent,
  FsInstrument,
  InstrumentBackplane,
} from '@microsoft/msfs-sdk';
import { BatteryDisplay } from './BatDisplay';
import { BatSimVarPublisher } from 'instruments/src/BAT/BatSimVarPublisher';

class BatInstrument implements FsInstrument {
  private readonly bus = new EventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly simVarPublisher = new BatSimVarPublisher(this.bus);

  private readonly clockPublisher = new ClockPublisher(this.bus);

  constructor(public readonly instrument: BaseInstrument) {
    this.backplane.addPublisher('SimVars', this.simVarPublisher);
    this.backplane.addPublisher('Clock', this.clockPublisher);

    this.doInit();
  }

  private doInit(): void {
    this.backplane.init();

    FSComponent.render(<BatteryDisplay bus={this.bus} />, document.getElementById('BAT_CONTENT'));

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

  public onPowerOn() {
    super.onPowerOn();

    this.fsInstrument.onPowerOn();
  }

  public onShutDown() {
    super.onShutDown();

    this.fsInstrument.onPowerOff();
  }
}

registerInstrument('a380x-bat', A380X_BAT);
