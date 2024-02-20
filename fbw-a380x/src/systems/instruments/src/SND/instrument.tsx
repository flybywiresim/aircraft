import './style.scss';

class A380_SND extends BaseInstrument {

    constructor() {
        super();
    }

    get templateID(): string {
        return 'A380X_SND';
    }

    public connectedCallback(): void {
        super.connectedCallback();

        // Remove "instrument didn't load" text
        document.getElementById('SND_CONTENT').querySelector(':scope > h1').remove();
    }

    public Update(): void {
        super.Update();

    }
}

registerInstrument('a380x-snd', A380_SND);
