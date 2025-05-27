import {
  FSComponent,
  EventBus,
  HEventPublisher,
  InstrumentBackplane,
  FsInstrument,
  FsBaseInstrument,
  ClockPublisher,
} from '@microsoft/msfs-sdk';
import { FailuresConsumer } from '@flybywiresim/fbw-sdk';
import { AtcMailbox } from 'instruments/src/AtcMailbox/AtcMailbox';

class AtcMailboxInstrument implements FsInstrument {
  private readonly bus = new EventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly clockPublisher = new ClockPublisher(this.bus);

  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly failuresConsumer = new FailuresConsumer();

  constructor(public readonly instrument: BaseInstrument) {
    this.hEventPublisher = new HEventPublisher(this.bus);

    this.backplane.addPublisher('hEvent', this.hEventPublisher);
    this.backplane.addPublisher('clock', this.clockPublisher);

    this.doInit();
  }

  public doInit(): void {
    this.backplane.init();

    const atcMailbox = document.getElementById('AtcMailbox_CONTENT');

    FSComponent.render(<AtcMailbox bus={this.bus} />, document.getElementById('AtcMailbox_CONTENT'));

    // Remove "instrument didn't load" text
    atcMailbox?.querySelector(':scope > h1')?.remove();
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

class A380X_AtcMailbox extends FsBaseInstrument<AtcMailboxInstrument> {
  public constructInstrument(): AtcMailboxInstrument {
    return new AtcMailboxInstrument(this);
  }

  public get isInteractive(): boolean {
    return true;
  }

  public get templateID(): string {
    return 'A380X_AtcMailbox';
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

registerInstrument('a380x-atc-mailbox', A380X_AtcMailbox);
