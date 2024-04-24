import { FSComponent } from '@microsoft/msfs-sdk';
import { ArincEventBus } from 'instruments/src/MsfsAvionicsCommon/ArincEventBus';
import { BATSimvarPublisher } from './BATSimvarPublisher';
import { BATComponent } from './BAT';

class A32NX_BAT extends BaseInstrument {
    private bus: ArincEventBus;

    private simVarPublisher: BATSimvarPublisher;

    constructor() {
        super();
        this.bus = new ArincEventBus();
        this.simVarPublisher = new BATSimvarPublisher(this.bus);
    }

    get templateID(): string {
        return 'A32NX_BAT';
    }

    public connectedCallback(): void {
        super.connectedCallback();

        FSComponent.render(<BATComponent bus={this.bus} />, document.getElementById('BAT_CONTENT'));

        // Remove "instrument didn't load" text
        document.getElementById('BAT_CONTENT').querySelector(':scope > h1').remove();

        this.simVarPublisher.startPublish();
    }

    /**
   * A callback called when the instrument gets a frame update.
   */
    public Update(): void {
        super.Update();
        this.simVarPublisher.onUpdate();
    }
}

registerInstrument('a32nx-bat', A32NX_BAT);
