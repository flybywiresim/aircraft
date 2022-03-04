import { ControlEvents, EventBus, PublishPacer, SimVarDefinition, SimVarValueType } from '../data';
import { EventSubscriber } from '../data/EventSubscriber';
import { SimVarPublisher } from './BasePublishers';

/** Simvar definitions related to a transponder. */
export interface XPDRSimVars {
  /** Transponder1 code */
  xpdrCode1: number,
  /** Transponder1 Mode */
  xpdrMode1: XPDRMode,
  /** Sending Ident */
  xpdrIdent: boolean
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
class XPDRSimVarPublisher extends SimVarPublisher<XPDRSimVars> {
  private static simvars = new Map<keyof XPDRSimVars, SimVarDefinition>([
    ['xpdrMode1', { name: 'TRANSPONDER STATE:1', type: SimVarValueType.Number }],
    ['xpdrCode1', { name: 'TRANSPONDER CODE:1', type: SimVarValueType.Number }],
    ['xpdrIdent', { name: 'TRANSPONDER IDENT:1', type: SimVarValueType.Bool }]
  ])

  /**
   * Create an XPDRSimVarPublisher
   * @param bus The EventBus to publish to
   * @param pacer An optional pacer to use to control the pace of publishing
   */
  public constructor(bus: EventBus, pacer: PublishPacer<XPDRSimVars> | undefined = undefined) {
    super(XPDRSimVarPublisher.simvars, bus, pacer);
  }
}

/** A transponder. */
export class XPDRInstrument {
  private simVarPublisher: XPDRSimVarPublisher;
  private controlSubscriber: EventSubscriber<ControlEvents>;
  private isSendingIdent = false;

  /**
   * Create an XPDRInstrument.
   * @param bus The event bus to publish to.
   */
  public constructor(private readonly bus: EventBus) {
    this.bus = bus;
    this.simVarPublisher = new XPDRSimVarPublisher(bus);
    this.controlSubscriber = bus.getSubscriber<ControlEvents>();

    this.simVarPublisher.subscribe('xpdrCode1');
    this.simVarPublisher.subscribe('xpdrMode1');
    this.simVarPublisher.subscribe('xpdrIdent');
  }

  /** Initialize the instrument. */
  public init(): void {
    this.simVarPublisher.startPublish();

    this.controlSubscriber.on('publish_xpdr_code').handle(this.setXpdrCode.bind(this));
    this.controlSubscriber.on('publish_xpdr_mode').handle(this.setXpdrMode.bind(this));
    this.controlSubscriber.on('xpdr_send_ident').handle(this.sendIdent.bind(this));

    // force standby on plane load when off
    if (this.getXpdrMode() === XPDRMode.OFF) {
      this.setXpdrMode(XPDRMode.STBY);
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
   * Set the XPDR code in the sim.
   * @param code The xpdr code.
   */
  private setXpdrCode(code: number): void {
    const bcdCode = Avionics.Utils.make_xpndr_bcd16(code);
    SimVar.SetSimVarValue('K:XPNDR_SET', 'Frequency BCD16', bcdCode);
  }

  /**
   * Set the xpdr mode in the sim.
   * @param mode The xpdr mode..
   */
  private setXpdrMode(mode: XPDRMode): void {
    SimVar.SetSimVarValue('TRANSPONDER STATE:1', 'number', mode);
  }

  /**
   * Gets xpdr mode from the sim.
   * @returns the xpdr mode 
   */
  private getXpdrMode(): XPDRMode {
    return SimVar.GetSimVarValue('TRANSPONDER STATE:1', 'number');
  }

  /**
   * Sends ident to ATC for 18 seconds.
   */
  private sendIdent(): void {
    if (this.getXpdrMode() > XPDRMode.STBY) {
      this.isSendingIdent = true;
      SimVar.SetSimVarValue('K:XPNDR_IDENT_ON', 'number', 1);
      setTimeout(() => {
        this.isSendingIdent = false;
        SimVar.SetSimVarValue('K:XPNDR_IDENT_OFF', 'number', 0);
      }, 18000);
    }
  }
}