'use strict';

/* global BaseInstrument */
/* global registerInstrument */

// eslint-disable-next-line camelcase
class A32NX_INSTRUMENT_NAME_Logic extends BaseInstrument {
    constructor() {
        super();
        // eslint-disable-next-line no-underscore-dangle
        let lastTime = this._lastTime;
        this.getDeltaTime = () => {
            const nowTime = Date.now();
            const deltaTime = nowTime - lastTime;
            lastTime = nowTime;

            return deltaTime;
        };
    }

    get templateID() {
        return 'A32NX_INSTRUMENT_NAME_TEMPLATE';
    }

    get isInteractive() {
        // eslint-disable-next-line
        return INSTRUMENT_IS_INTERACTIVE;
    }

    get IsGlassCockpit() {
        return true;
    }

    connectedCallback() {
        super.connectedCallback();

        // This is big hack, see `template.html`.
        {
            const code = document.getElementById('A32NX_BUNDLED_STYLE').innerHTML;
            const style = document.createElement('style');
            style.innerHTML = code;
            document.head.appendChild(style);
        }
        {
            const code = document.getElementById('A32NX_BUNDLED_LOGIC').innerHTML;
            const script = document.createElement('script');
            script.innerHTML = code;
            document.body.appendChild(script);
        }
    }

    Update() {
        super.Update();
        if (this.CanUpdate()) {
            this.dispatchEvent(new CustomEvent('update', { detail: this.getDeltaTime() }));
        }
    }

    onInteractionEvent(event) {
        const eventName = String(event);
        this.dispatchEvent(new CustomEvent(eventName));
        this.dispatchEvent(new CustomEvent('*', { detail: eventName }));
    }
}

registerInstrument('a32nx-INSTRUMENT_NAME_LOWER-element', A32NX_INSTRUMENT_NAME_Logic);
