class PistonEngine extends TemplateElement {
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
customElements.define("piston-engine", PistonEngine);
class TurboEngine extends TemplateElement {
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
customElements.define("turbo-engine", TurboEngine);
class EngineDisplay extends TemplateElement {
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
customElements.define("engine-display", EngineDisplay);
//# sourceMappingURL=EngineDisplay.js.map