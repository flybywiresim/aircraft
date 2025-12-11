import {
  FSComponent,
  HEventPublisher,
  InstrumentBackplane,
  FsInstrument,
  FsBaseInstrument,
  ClockPublisher,
} from '@microsoft/msfs-sdk';
import { ArincEventBus, FailuresConsumer, FmsDataPublisher } from '@flybywiresim/fbw-sdk';
import { SD } from './SD';
import { SDSimvarPublisher } from './SDSimvarPublisher';
import { AdirsValueProvider } from 'instruments/src/MsfsAvionicsCommon/AdirsValueProvider';
import { SimplaneValueProvider } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { A380XFcuBusPublisher } from '@shared/publishers/A380XFcuBusPublisher';

class SdInstrument implements FsInstrument {
  private readonly bus = new ArincEventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly clockPublisher = new ClockPublisher(this.bus);

  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly simVarPublisher = new SDSimvarPublisher(this.bus);

  private readonly adirsValueProvider = new AdirsValueProvider(this.bus, this.simVarPublisher, 'L');

  private readonly simplaneValueProvider = new SimplaneValueProvider(this.bus);

  private readonly fmsDataPublisher = new FmsDataPublisher(this.bus);

  private readonly fcuBusPublisher = new A380XFcuBusPublisher(this.bus);

  private readonly failuresConsumer = new FailuresConsumer();

  constructor(public readonly instrument: BaseInstrument) {
    this.hEventPublisher = new HEventPublisher(this.bus);

    this.backplane.addPublisher('hEvent', this.hEventPublisher);
    this.backplane.addPublisher('clock', this.clockPublisher);
    this.backplane.addPublisher('sdSimVars', this.simVarPublisher);
    this.backplane.addPublisher('fmsData', this.fmsDataPublisher);
    this.backplane.addPublisher('fcuBus', this.fcuBusPublisher);
    this.backplane.addInstrument('simplane', this.simplaneValueProvider);

    this.doInit();
  }

  public doInit(): void {
    this.backplane.init();

    this.adirsValueProvider.start();

    const sdv2 = document.getElementById('SDv2_CONTENT');

    FSComponent.render(<SD bus={this.bus} />, document.getElementById('SDv2_CONTENT'));

    // Remove "instrument didn't load" text
    sdv2?.querySelector(':scope > h1')?.remove();
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    this.backplane.onUpdate();
    this.failuresConsumer.update();
  }

  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  public onGameStateChanged(_oldState: GameState, _newState: GameState): void {
    // noop
  }

  public onFlightStart(): void {
    // noop
  }

  public onSoundEnd(_soundEventId: Name_Z): void {
    // noop
  }

  public onPowerOn(): void {
    // noop
  }

  public onPowerOff(): void {
    // noop
  }
}

class A380X_SDv2 extends FsBaseInstrument<SdInstrument> {
  public constructInstrument(): SdInstrument {
    return new SdInstrument(this);
  }

  public get isInteractive(): boolean {
    return true;
  }

  public get templateID(): string {
    return 'A380X_SDv2';
  }

  /** @inheritdoc */
  public onPowerOn(): void {
    super.onPowerOn();

    this.fsInstrument.onPowerOn();
  }

  /** @inheritdoc */
  public onShutDown(): void {
    super.onShutDown();

    this.fsInstrument.onPowerOff();
  }
}

registerInstrument('a380x-sdv2', A380X_SDv2);
