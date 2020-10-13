class AS1000_ED extends BaseAS1000 {
    constructor() {
        super();
    }
    get templateID() {
        return "AS1000_ED";
    }
    connectedCallback() {
        super.connectedCallback();
        this.addIndependentElementContainer(new Engine("Engine", "Engines"));
    }
    disconnectedCallback() {
    }
    onEvent(_event) {
    }
}
registerInstrument("as1000-ed-element", AS1000_ED);
//# sourceMappingURL=AS1000_ED.js.map