// @ts-strict-ignore
import { Clock, FSComponent, HEventPublisher, InstrumentBackplane, Subject } from '@microsoft/msfs-sdk';
import { ArincEventBus, EfisSide } from '@flybywiresim/fbw-sdk';
import { getDisplayIndex } from '../MsfsAvionicsCommon/CdsDisplayUnit';
import { DmcPublisher } from '../MsfsAvionicsCommon/providers/DmcPublisher';
import { ExtendedClockEventProvider } from '../MsfsAvionicsCommon/providers/ExtendedClockProvider';
import { FmsDataPublisher } from '../MsfsAvionicsCommon/providers/FmsDataPublisher';
import { HUDComponent } from './HUD';
import { AdirsValueProvider } from './shared/AdirsValueProvider';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { HUDSimvarPublisher, HUDSymbolsPublisher } from './shared/HUDSimvarPublisher';
import { FcuEfisCpBusPublisher } from '@shared/publishers/EfisCpBusPublisher';

import { HudValueProvider } from './shared/HudValueProvider';
import { FwcPublisher, RopRowOansPublisher, SecPublisher, TawsPublisher } from '@flybywiresim/msfs-avionics-common';
import { FwsPfdSimvarPublisher } from '../MsfsAvionicsCommon/providers/FwsPfdPublisher';
import { VorBusPublisher } from '../MsfsAvionicsCommon/providers/VorBusPublisher';
import { FcdcBusPublisher } from '@shared/publishers/FcdcPublisher';
import { FcdcChoiceProvider } from './shared/FcdcChoiceProvider';
import { SfccSimVarPublisher } from '../MsfsAvionicsCommon/providers/SfccPublisher';
import { FGDataPublisher } from '../MsfsAvionicsCommon/providers/FGDataPublisher';
import { PrimChoiceProvider } from '../../../shared/src/publishers/PrimChoiceProvider';
import { PrimFeBusPublisher } from '@shared/publishers/PrimFePublisher';
import { PrimFctlBusPublisher } from '@shared/publishers/PrimFctlPublisher';
import { PrimFgBusPublisher } from '@shared/publishers/PrimFgPublisher';
import { FdSelectionProvider } from './shared/FdSelectionProvider';

import './style.scss';

class A380X_HUD extends BaseInstrument {
  private readonly bus = new ArincEventBus();

  private readonly backplane = new InstrumentBackplane();

  private readonly clock = new Clock(this.bus);

  private readonly extendedClockProvider = new ExtendedClockEventProvider(this.bus, Subject.create(true));

  private readonly hEventPublisher = new HEventPublisher(this.bus);

  private readonly simVarPublisher = new HUDSimvarPublisher(this.bus);

  private readonly arincProvider = new ArincValueProvider(this.bus);

  private readonly adirsValueProvider = new AdirsValueProvider(this.bus, this.simVarPublisher);

  private readonly dmcPublisher = new DmcPublisher(this.bus);

  private readonly fmsDataPublisher: FmsDataPublisher;

  private readonly fwsPublisher = new FwcPublisher(this.bus);

  private readonly ropRowOansPublisher = new RopRowOansPublisher(this.bus);

  private readonly secPublisher = new SecPublisher(this.bus);

  private readonly tawsPublisher = new TawsPublisher(this.bus);

  private readonly fwsPfdPublisher = new FwsPfdSimvarPublisher(this.bus);

  private readonly fcdcPublisher = new FcdcBusPublisher(this.bus);

  private readonly sfccPublisher = new SfccSimVarPublisher(this.bus);

  private readonly hudProvider = new HudValueProvider(this.bus);

  private readonly symbolPublisher = new HUDSymbolsPublisher(this.bus);

  private readonly vorBusPublisher = new VorBusPublisher(this.bus);

  private readonly fgDataPublisher = new FGDataPublisher(this.bus);

  private readonly fcdcChoiceProvider = new FcdcChoiceProvider(this.bus);

  private readonly primChoiceProvider = new PrimChoiceProvider(this.bus);

  private readonly fdSelectionProvider = new FdSelectionProvider(this.bus);

  private readonly primFePublisher = new PrimFeBusPublisher(this.bus);

  private readonly primFctlPublisher = new PrimFctlBusPublisher(this.bus);

  private readonly primFgPublisher = new PrimFgBusPublisher(this.bus);

  private readonly efisCpBusPublisher = new FcuEfisCpBusPublisher(this.bus);

  constructor() {
    super();

    const side: EfisSide = getDisplayIndex() === 1 ? 'L' : 'R';
    const stateSubject = Subject.create<'L' | 'R'>(side);
    this.fmsDataPublisher = new FmsDataPublisher(this.bus, stateSubject);

    this.backplane.addInstrument('Clock', this.clock);
    this.backplane.addInstrument('ExtendedClock', this.extendedClockProvider);
    this.backplane.addPublisher('HEvent', this.hEventPublisher);
    this.backplane.addPublisher('HudSimVars', this.simVarPublisher);
    this.backplane.addInstrument('ArincProvider', this.arincProvider);
    this.backplane.addInstrument('AdirsProvider', this.adirsValueProvider);
    this.backplane.addPublisher('DmcPublisher', this.dmcPublisher);
    this.backplane.addPublisher('FmsDataPublisher', this.fmsDataPublisher);
    this.backplane.addPublisher('FwsPublisher', this.fwsPublisher);
    this.backplane.addPublisher('RopRowOansPublisher', this.ropRowOansPublisher);
    this.backplane.addPublisher('SecPublisher', this.secPublisher);
    this.backplane.addPublisher('TawsPublisher', this.tawsPublisher);
    this.backplane.addPublisher('FwsPfdPublisher', this.fwsPfdPublisher);
    this.backplane.addPublisher('FcdcPublisher', this.fcdcPublisher);
    this.backplane.addInstrument('FcdcChoiceProvider', this.fcdcChoiceProvider);
    this.backplane.addPublisher('SfccPublisher', this.sfccPublisher);
    this.backplane.addInstrument('HudProvider', this.hudProvider);
    this.backplane.addPublisher('HUDSymbolsPublisher', this.symbolPublisher);
    this.backplane.addPublisher('vor', this.vorBusPublisher);
    this.backplane.addPublisher('FgDataPublisher', this.fgDataPublisher);
    this.backplane.addInstrument('FdSelectionProvider', this.fdSelectionProvider);
    this.backplane.addPublisher('PrimFePublisher', this.primFePublisher);
    this.backplane.addPublisher('PrimFctlPublisher', this.primFctlPublisher);
    this.backplane.addPublisher('PrimFgPublisher', this.primFgPublisher);
    this.backplane.addPublisher('EfisCpPublisher', this.efisCpBusPublisher);
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
    this.primChoiceProvider.init();

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
