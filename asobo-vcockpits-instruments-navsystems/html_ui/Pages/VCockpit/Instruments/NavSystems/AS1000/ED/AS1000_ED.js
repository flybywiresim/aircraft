class AS1000_ED extends BaseAS1000 {
    constructor() {
        super();
    }
    get templateID() { return "AS1000_ED"; }
    connectedCallback() {
        super.connectedCallback();
        this.engines = new Engine("Engine", "Engines");
        this.addIndependentElementContainer(this.engines);
    }
    disconnectedCallback() {
    }
    onEvent(_event) {
    }
    reboot() {
        super.reboot();
        if (this.engines)
            this.engines.reset();
    }
}
registerInstrument("as1000-ed-element", AS1000_ED);
//# sourceMappingURL=AS1000_ED.js.map