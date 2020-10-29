class A320_Neo_Com extends BaseAirliners {
    constructor() {
        super();
        this.initDuration = 11000;
    }
    get templateID() {
        return "A320_Neo_Com";
    }
    connectedCallback() {
        super.connectedCallback();
        this.pageGroups = [
            new NavSystemPageGroup("Main", this, [
                new A320_Neo_COM_MainPage()
            ]),
        ];
    }
    disconnectedCallback() {
    }
    onEvent(_event) {
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
    }
}
class A320_Neo_COM_MainElement extends NavSystemElement {
    init(root) {
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class A320_Neo_COM_MainPage extends NavSystemPage {
    constructor() {
        super("Main", "Mainframe", new A320_Neo_COM_MainElement());
    }
    init() {
        super.init();
    }
}
registerInstrument("a320-neo-com-element", A320_Neo_Com);
//# sourceMappingURL=A320_Neo_Com.js.map