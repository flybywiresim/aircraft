class PostIT extends TemplateElement {
    constructor() {
        super();
        this.curTime = 0.0;
        this.needUpdate = false;
        this.frameCount = 0;
        this._isConnected = false;
    }

    get templateID() {
        return "postit";
    }

    connectedCallback() {
        super.connectedCallback();
        this.text = this.querySelector("#text");

        if (this.text) {
            this.initMainLoop();
        }
    }

    initMainLoop() {
        const updateLoop = () => {
            if (!this._isConnected) {
                return;
            }
            this.Update();
            requestAnimationFrame(updateLoop);
        };
        this._isConnected = true;
        requestAnimationFrame(updateLoop);
    }

    disconnectedCallback() {}

    Update() {

        this.text.innerHTML = "FLT SK2064<br/> EKCH -> EBBR<br/>INFO. BRAVO<br/>QNH 1018. / FL380<br/>FBWRE4B DEP.<br/>163 PAX<br/>9 CATS ONBOARD<br/><br/>// JB";

    }
}

registerLivery("livery-postit-element", PostIT);
