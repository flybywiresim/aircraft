class AS3000_PistonEngine extends TemplateElement {
    constructor() {
        super();
    }
    get templateID() {
        return "PistonEngineTemplate";
    }
    connectedCallback() {
        super.connectedCallback();
    }
}
customElements.define("as3000-piston-engine", AS3000_PistonEngine);
class AS3000_TurboEngine extends TemplateElement {
    constructor() {
        super();
    }
    get templateID() {
        return "TurboEngineTemplate";
    }
    connectedCallback() {
        super.connectedCallback();
    }
}
customElements.define("as3000-turbo-engine", AS3000_TurboEngine);
class AS3000_EngineDisplay extends TemplateElement {
    constructor() {
        super();
    }
    get templateID() {
        return "EngineDisplayTemplate";
    }
    connectedCallback() {
        super.connectedCallback();
    }
}
customElements.define("as3000-engine-display", AS3000_EngineDisplay);
//# sourceMappingURL=EngineDisplay.js.map