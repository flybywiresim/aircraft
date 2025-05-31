import { Clock, FSComponent, HEventPublisher, InstrumentBackplane, Subject } from '@microsoft/msfs-sdk';
import { ArincEventBus, EfisSide } from '@flybywiresim/fbw-sdk';
import { getDisplayIndex } from 'instruments/src/MsfsAvionicsCommon/CdsDisplayUnit';
import { DmcPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';
import { FmsDataPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FmsDataPublisher';
import { PFDComponent } from './PFD';
import { AdirsValueProvider } from './shared/AdirsValueProvider';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { PFDSimvarPublisher } from './shared/PFDSimvarPublisher';
import { SimplaneValueProvider } from 'instruments/src/MsfsAvionicsCommon/providers/SimplaneValueProvider';
import { A380XFcuBusPublisher } from '../../../shared/src/publishers/A380XFcuBusPublisher';
import { FwcPublisher, RopRowOansPublisher, SecPublisher, TawsPublisher } from '@flybywiresim/msfs-avionics-common';
import { FwsPfdSimvarPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/FwsPfdPublisher';

import './style.scss';

class A380X_PFD extends BaseInstrument {
  private readonly bus = new ArincEventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly clock = new Clock(this.bus);

  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly simVarPublisher = new PFDSimvarPublisher(this.bus);

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

  constructor() {
    super();

    const side: EfisSide = getDisplayIndex() === 1 ? 'L' : 'R';
    const stateSubject = Subject.create<'L' | 'R'>(side);
    this.fmsDataPublisher = new FmsDataPublisher(this.bus, stateSubject);

    this.backplane.addInstrument('Clock', this.clock);
    this.backplane.addPublisher('HEvent', this.hEventPublisher);
    this.backplane.addPublisher('PfdSimVars', this.simVarPublisher);
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
  }

  get templateID(): string {
    return 'A380X_PFD';
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

    FSComponent.render(<PFDComponent bus={this.bus} instrument={this} />, document.getElementById('PFD_CONTENT'));

    // Remove "instrument didn't load" text
    document.getElementById('PFD_CONTENT').querySelector(':scope > h1').remove();
  }

  /**
   * A callback called when the instrument gets a frame update.
   */
  public Update(): void {
    super.Update();

    this.backplane.onUpdate();
  }
}

registerInstrument('a380x-pfd', A380X_PFD);
