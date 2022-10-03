import { ControlEvents, EventBus, IndexedEventType, PublishPacer, SimVarDefinition, SimVarValueType } from '../data';
import { EventSubscriber } from '../data/EventSubscriber';
import { DebounceTimer } from '../utils/time/DebounceTimer';
import { SimVarPublisher } from './BasePublishers';

/** Simvar definitions related to a transponder. */
export interface XPDRSimVarEvents {
  /** Transponder code. */
  [xpdr_code: IndexedEventType<'xpdr_code'>]: number;

  /** Transponder mode. */
  [xpdr_mode: IndexedEventType<'xpdr_mode'>]: XPDRMode;

  /** Whether the transponder is sending ident. */
  [xpdr_ident: IndexedEventType<'xpdr_ident'>]: boolean;
}

/** Transponder modes. */
export enum XPDRMode {
  OFF = 0,
  STBY = 1,
  TEST = 2,
  ON = 3,
  ALT = 4,
  GROUND = 5
}

/** A publiher to poll transponder simvars. */
export class XPDRSimVarPublisher extends SimVarPublisher<XPDRSimVarEvents> {
  /**
   * Create an XPDRSimVarPublisher.
   * @param bus The EventBus to publish to.
   * @param pacer An optional pacer to use to control the pace of publishing.
   * @param transponderCount The number of transponders supported by this publisher.
   */
  public constructor(bus: EventBus, pacer: PublishPacer<XPDRSimVarEvents> | undefined = undefined, transponderCount = 1) {
    const vars: [keyof XPDRSimVarEvents, SimVarDefinition][] = [];
    for (let i = 0; i < transponderCount; i++) {
      vars.push([`xpdr_mode_${i + 1}`, { name: `TRANSPONDER STATE:${i + 1}`, type: SimVarValueType.Number }]);
      vars.push([`xpdr_code_${i + 1}`, { name: `TRANSPONDER CODE:${i + 1}`, type: SimVarValueType.Number }]);
      vars.push([`xpdr_ident_${i + 1}`, { name: `TRANSPONDER IDENT:${i + 1}`, type: SimVarValueType.Bool }]);
    }

    super(new Map<keyof XPDRSimVarEvents, SimVarDefinition>(vars), bus, pacer);
  }
}

/** A transponder. */
export class XPDRInstrument {
  private simVarPublisher: XPDRSimVarPublisher;
  private controlSubscriber: EventSubscriber<ControlEvents>;

  private readonly identDebounceTimers: DebounceTimer[] = Array.from({ length: this.transponderCount }, () => new DebounceTimer());

  /**
   * Create an XPDRInstrument.
   * @param bus The event bus to publish to.
   * @param transponderCount The number of transponders supported by this instrument. Defaults to `1`.
   */
  public constructor(private readonly bus: EventBus, private readonly transponderCount = 1) {
    this.bus = bus;
    this.simVarPublisher = new XPDRSimVarPublisher(bus);
    this.controlSubscriber = bus.getSubscriber<ControlEvents>();
  }

  /** Initialize the instrument. */
  public init(): void {
    this.simVarPublisher.startPublish();

    for (let i = 0; i < this.transponderCount; i++) {
      this.controlSubscriber.on(`publish_xpdr_code_${i + 1}`).handle(this.setXpdrCode.bind(this, i + 1));
      this.controlSubscriber.on(`publish_xpdr_mode_${i + 1}`).handle(this.setXpdrMode.bind(this, i + 1));
      this.controlSubscriber.on(`xpdr_send_ident_${i + 1}`).handle(this.sendIdent.bind(this, i + 1));

      // force standby on plane load when off
      if (this.getXpdrMode(i + 1) === XPDRMode.OFF) {
        this.setXpdrMode(i + 1, XPDRMode.STBY);
      }
    }
  }

  /**
   * Perform events for the update loop.
   */
  public onUpdate(): void {
    // Currently, we just need to update our simvar publisher so it polls.
    this.simVarPublisher.onUpdate();
  }

  /**
   * Set the transponder code in the sim.
   * @param index The index of the transponder.
   * @param code The xpdr code.
   */
  private setXpdrCode(index: number, code: number): void {
    const bcdCode = Avionics.Utils.make_xpndr_bcd16(code);
    SimVar.SetSimVarValue(`K:${index}:XPNDR_SET`, 'Frequency BCD16', bcdCode);
  }

  /**
   * Set the transponder mode in the sim.
   * @param index The index of the transponder.
   * @param mode The transponder mode.
   */
  private setXpdrMode(index: number, mode: XPDRMode): void {
    SimVar.SetSimVarValue(`TRANSPONDER STATE:${index}`, 'number', mode);
  }

  /**
   * Gets xpdr mode from the sim.
   * @param index The index of the transponder.
   * @returns The xpdr mode.
   */
  private getXpdrMode(index: number): XPDRMode {
    return SimVar.GetSimVarValue(`TRANSPONDER STATE:${index}`, 'number');
  }

  /**
   * Sends ident to ATC for 18 seconds.
   * @param index The index of the transponder.
   */
  private sendIdent(index: number): void {
    if (this.getXpdrMode(index) > XPDRMode.STBY) {
      SimVar.SetSimVarValue(`K:${index}:XPNDR_IDENT_ON`, 'number', 1);

      this.identDebounceTimers[index - 1].schedule(() => {
        SimVar.SetSimVarValue(`K:${index}:XPNDR_IDENT_OFF`, 'number', 0);
      }, 18000);
    }
  }
}