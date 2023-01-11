import { FSComponent } from 'msfssdk';
import { ClockRoot } from './Clock';

// eslint-disable-next-line camelcase
class A32NX_Clock extends BaseInstrument {
    get templateID(): string {
        return 'A32NX_Clock';
    }

    public connectedCallback(): void {
        super.connectedCallback();

        FSComponent.render(<ClockRoot />, document.getElementById('EWD_CONTENT'));
    }
}

registerInstrument('a32nx-clock', A32NX_Clock);
