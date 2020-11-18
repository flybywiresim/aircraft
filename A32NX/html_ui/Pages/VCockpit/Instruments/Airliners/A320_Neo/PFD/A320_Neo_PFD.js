class A320_Neo_PFD extends BaseAirliners {
    constructor() {
        super();
        this.initDuration = 7000;
    }
    get templateID() {
        return "A320_Neo_PFD";
    }
    get IsGlassCockpit() {
        return true;
    }
    connectedCallback() {
        super.connectedCallback();
        this.pageGroups = [
            new NavSystemPageGroup("Main", this, [
                new A320_Neo_PFD_MainPage()
            ]),
        ];
        this.maxUpdateBudget = 12;
    }
    disconnectedCallback() {
        window.console.log("A320 Neo PFD - destroyed");
        super.disconnectedCallback();
    }
    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
    }
}
class A320_Neo_PFD_MainElement extends NavSystemElement {
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
class A320_Neo_PFD_MainPage extends NavSystemPage {
    constructor() {
        super("Main", "Mainframe", new A320_Neo_PFD_MainElement());
        this.navStatus = new A320_Neo_PFD_NavStatus();

        this.element = new NavSystemElementGroup([
            this.navStatus
        ]);
    }
    init() {
        super.init();

        const url = document.getElementsByTagName("a320-neo-pfd-element")[0].getAttribute("url");
        this.disp_index = parseInt(url.substring(url.length - 1));
        this.pot_index = this.disp_index == 1 ? 88 : 90;

        this.getDeltaTime = A32NX_Util.createDeltaTimeCalculator(this._lastTime);
        this.showILS = SimVar.GetSimVarValue(`L:BTN_LS_${this.disp_index}_FILTER_ACTIVE`, "bool");

        this.hasInitialized = true;

        //SELF TEST
        this.selfTestDiv = document.querySelector('#SelfTestDiv');
        this.selfTestTimerStarted = false;
        this.selfTestTimer = -1;
        this.selfTestLastKnobValueFO = 1;
        this.selfTestLastKnobValueCAP = 1;

        //ENGINEERING TEST
        this.engTestDiv = document.querySelector('#PfdEngTest');
        this.engMaintDiv = document.querySelector('#PfdMaintMode');

        this.electricity = document.querySelector('#Electricity');
    }
    onUpdate() {
        const _deltaTime = this.getDeltaTime();
        const currentKnobValue = SimVar.GetSimVarValue("LIGHT POTENTIOMETER:" + this.pot_index, "number");
        if (currentKnobValue <= 0.0) {
            this.selfTestLastKnobValue = currentKnobValue;
            return;
        }
        super.onUpdate(_deltaTime);
        if (!this.hasInitialized) {
            return;
        }

        const ACPowerStateChange = SimVar.GetSimVarValue("L:ACPowerStateChange","Bool");
        const ACPowerAvailable = SimVar.GetSimVarValue("L:ACPowerAvailable","Bool");

        const KnobChanged = (currentKnobValue >= 0.1 && this.selfTestLastKnobValue < 0.1);

        if ((KnobChanged || ACPowerStateChange) && ACPowerAvailable && !this.selfTestTimerStarted) {
            this.selfTestDiv.style.display = "block";
            this.selfTestTimer = parseInt(NXDataStore.get("CONFIG_SELF_TEST_TIME", "15"));
            this.selfTestTimerStarted = true;
        }

        if (this.selfTestTimer >= 0) {
            this.selfTestTimer -= _deltaTime / 1000;
            if (this.selfTestTimer <= 0) {
                this.selfTestDiv.style.display = "none";
                this.selfTestTimerStarted = false;
            }
        }

        if (this.disp_index == 1) {
            updateDisplayDMC("PFD1", this.engTestDiv, this.engMaintDiv);
        } else {
            updateDisplayDMC("PFD2", this.engTestDiv, this.engMaintDiv);
        }

        this.selfTestLastKnobValue = currentKnobValue;
        this.updateScreenState();
    }
    onEvent(_event) {
        switch (_event) {
            case `BTN_LS_${this.disp_index}`:

                this.showILS = !this.showILS;
                SimVar.SetSimVarValue(`L:BTN_LS_${this.disp_index}_FILTER_ACTIVE`, "number", this.showILS ? 1 : 0);
                this.ils.showILS(this.showILS);
                this.compass.showILS(this.showILS);
                break;
        }
    }

    updateScreenState() {
        if (SimVar.GetSimVarValue("L:ACPowerAvailable","bool")) {
            this.electricity.style.display = "block";
        } else {
            this.electricity.style.display = "none";
        }
    }

}
class A320_Neo_PFD_NavStatus extends NavSystemElement {
    init(root) {
        this.fma = this.gps.getChildById("FMA");
        this.fma.aircraft = Aircraft.A320_NEO;
        this.fma.gps = this.gps;
        this.isInitialized = true;
        this.getDeltaTime = A32NX_Util.createDeltaTimeCalculator(this._lastTime);
        const url = document.getElementsByTagName("a320-neo-pfd-element")[0].getAttribute("url");
        this.disp_index = parseInt(url.substring(url.length - 1));
        this.pot_index = this.disp_index == 1 ? 88 : 90;
    }
    onEnter() {
    }
    onUpdate() {
        const _deltaTime = this.getDeltaTime();
        const currentKnobValue = SimVar.GetSimVarValue("LIGHT POTENTIOMETER:" + this.pot_index, "number");
        if (currentKnobValue <= 0.0) {
            return;
        }
        if (this.fma != null) {
            this.fma.update(_deltaTime);
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
registerInstrument("a320-neo-pfd-element", A320_Neo_PFD);
