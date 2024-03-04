import { Clock, FSComponent, EventBus, HEventPublisher, InstrumentBackplane } from '@microsoft/msfs-sdk';
import { ArincEventBus } from "@flybywiresim/fbw-sdk";

import { PFDComponent } from './PFD';
import { AdirsValueProvider } from './shared/AdirsValueProvider';
import { ArincValueProvider } from './shared/ArincValueProvider';
import { PFDSimvarPublisher } from './shared/PFDSimvarPublisher';
import { SimplaneValueProvider } from './shared/SimplaneValueProvider';
import { DmcEvents, DmcPublisher } from 'instruments/src/MsfsAvionicsCommon/providers/DmcPublisher';

import './style.scss';

class A380X_PFD extends BaseInstrument {
    private readonly bus = new ArincEventBus();

    private readonly backplane = new InstrumentBackplane();

    private readonly clock = new Clock(this.bus);

    private readonly hEventPublisher= new HEventPublisher(this.bus);

    private readonly simVarPublisher = new PFDSimvarPublisher(this.bus);

    private readonly arincProvider = new ArincValueProvider(this.bus);

    private readonly simplaneValueProvider = new SimplaneValueProvider(this.bus);

    private readonly adirsValueProvider = new AdirsValueProvider(this.bus, this.simVarPublisher);

    private readonly dmcPublisher = new DmcPublisher(this.bus);

    constructor() {
        super();

        this.backplane.addInstrument('Clock', this.clock);
        this.backplane.addPublisher('HEvent', this.hEventPublisher);
        this.backplane.addPublisher('PfdSimVars', this.simVarPublisher);
        this.backplane.addInstrument('ArincProvider', this.arincProvider);
        this.backplane.addInstrument('Simplane', this.simplaneValueProvider);
        this.backplane.addInstrument('AdirsProvider', this.adirsValueProvider);
        this.backplane.addPublisher('DmcPublisher', this.dmcPublisher);

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

        this.bus.getSubscriber<DmcEvents>().on('trueRefActive').handle(console.log);

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

    // FIXME remove. This does not belong in the PFD, and in any case we should use GameStateProvider as it has workarounds for issues with onFlightStart
    protected onFlightStart() {
        super.onFlightStart();
        if (SimVar.GetSimVarValue('L:A32NX_IS_READY', 'number') !== 1) {
            // set ready signal that JS code is initialized and flight is actually started
            // -> user pressed 'READY TO FLY' button
            SimVar.SetSimVarValue('L:A32NX_IS_READY', 'number', 1);
        }
    }
}

registerInstrument('a380x-pfd', A380X_PFD);
