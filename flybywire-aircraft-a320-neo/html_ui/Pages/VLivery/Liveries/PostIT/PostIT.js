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
        this.postit = this.querySelector("#postit");

        if (this.postit) {

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

        this.postsit.innerHTML = NXDataStore.get("POSTIT_CONTENT", "\nCLICK TO ADD!");

    }
}

registerLivery("livery-postit-element", PostIT);
