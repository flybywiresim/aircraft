// @ts-strict-ignore
import { Clock, FSComponent, HEventPublisher, InstrumentBackplane, Subject } from '@microsoft/msfs-sdk';
import { ArincEventBus, EfisSide } from '@flybywiresim/fbw-sdk';
import { getDisplayIndex } from 'instruments/src/MsfsAvionicsCommon/CdsDisplayUnit';
import { DmcPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { FmsDataPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { HUDComponent } from './HUD';
import { AdirsValueProvider } from './shared/AdirsValueProvider';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { HUDSimvarPublisher, HUDSymbolsPublisher } from './shared/HUDSimvarPublisher';
import { HudValueProvider } from './shared/HudValueProvider';
import { SimplaneValueProvider } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { A380XFcuBusPublisher } from '../../../shared/src/publishers/A380XFcuBusPublisher';
import './style.scss';
import { FwcPublisher, RopRowOansPublisher, SecPublisher, TawsPublisher } from '@flybywiresim/msfs-avionics-common';
import { FwsPfdSimvarPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FwsPfdPublisher';
import { VorBusPublisher } from '../MsfsAvionicsCommon/providers/VorBusPublisher';
import { FcdcSimvarPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FcdcPublisher';
import { SfccSimVarPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/SfccPublisher';
import { FGDataPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FGDataPublisher';

class A380X_HUD extends BaseInstrument {
  private readonly bus = new ArincEventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly clock = new Clock(this.bus);

  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly simVarPublisher = new HUDSimvarPublisher(this.bus);

  private readonly arincProvider = new ArincValueProvider(this.bus);

  private readonly simplaneValueProvider = new SimplaneValueProvider(this.bus);

  private readonly adirsValueProvider = new AdirsValueProvider(this.bus, this.simVarPublisher);

  private readonly dmcPublisher = new DmcPublisher(this.bus);

  private readonly fmsDataPublisher: FmsDataPublisher;

  private readonly fwsPublisher = new FwcPublisher(this.bus);

  private readonly ropRowOansPublisher = new RopRowOansPublisher(this.bus);

  private readonly secPublisher = new SecPublisher(this.bus);

  private readonly tawsPublisher = new TawsPublisher(this.bus);

  private readonly fwsPfdPublisher = new FwsPfdSimvarPublisher(this.bus);

  private readonly fcuBusPublisher = new A380XFcuBusPublisher(this.bus);

  private readonly fcdcPublisher = new FcdcSimvarPublisher(this.bus);

  private readonly sfccPublisher = new SfccSimVarPublisher(this.bus);

  private readonly hudProvider = new HudValueProvider(this.bus);

  private readonly symbolPublisher = new HUDSymbolsPublisher(this.bus);

  private readonly vorBusPublisher = new VorBusPublisher(this.bus);

  private readonly fgDataPublisher = new FGDataPublisher(this.bus);

  constructor() {
    super();

    const side: EfisSide = getDisplayIndex() === 1 ? 'L' : 'R';
    const stateSubject = Subject.create<'L' | 'R'>(side);
    this.fmsDataPublisher = new FmsDataPublisher(this.bus, stateSubject);

    this.backplane.addInstrument('Clock', this.clock);
    this.backplane.addPublisher('HEvent', this.hEventPublisher);
    this.backplane.addPublisher('HudSimVars', this.simVarPublisher);
    this.backplane.addInstrument('ArincProvider', this.arincProvider);
    this.backplane.addInstrument('Simplane', this.simplaneValueProvider);
    this.backplane.addInstrument('AdirsProvider', this.adirsValueProvider);
    this.backplane.addPublisher('DmcPublisher', this.dmcPublisher);
    this.backplane.addPublisher('FmsDataPublisher', this.fmsDataPublisher);
    this.backplane.addPublisher('FwsPublisher', this.fwsPublisher);
    this.backplane.addPublisher('RopRowOansPublisher', this.ropRowOansPublisher);
    this.backplane.addPublisher('SecPublisher', this.secPublisher);
    this.backplane.addPublisher('TawsPublisher', this.tawsPublisher);
    this.backplane.addPublisher('FwsPfdPublisher', this.fwsPfdPublisher);
    this.backplane.addPublisher('FcuBusPublisher', this.fcuBusPublisher);
    this.backplane.addPublisher('FcdcPublisher', this.fcdcPublisher);
    this.backplane.addPublisher('SfccPublisher', this.sfccPublisher);
    this.backplane.addInstrument('HudProvider', this.hudProvider);
    this.backplane.addPublisher('HUDSymbolsPublisher', this.symbolPublisher);
    this.backplane.addPublisher('vor', this.vorBusPublisher);
    this.backplane.addPublisher('FgDataPublisher', this.fgDataPublisher);
  }

  get templateID(): string {
    return 'A380X_HUD';
  }

  public getDeltaTime() {
    return this.deltaTime;
  }

  public onInteractionEvent(args: string[]): void {
    this.hEventPublisher.dispatchHEvent(args[0]);
  }

  public connectedCallback(): void {
    super.connectedCallback();

    this.backplane.init();

    FSComponent.render(<HUDComponent bus={this.bus} instrument={this} />, document.getElementById('HUD_CONTENT'));

    // Remove "instrument didn't load" text
    document.getElementById('HUD_CONTENT').querySelector(':scope > h1').remove();
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    super.Update();

    this.backplane.onUpdate();
  }
}

registerInstrument('a380x-hud', A380X_HUD);
