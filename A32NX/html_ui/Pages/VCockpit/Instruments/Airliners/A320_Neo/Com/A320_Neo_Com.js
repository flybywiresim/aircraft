/**
 * Duration of the DU self-test, in milliseconds
 */
const SELF_TEST_DURATION = 8000;

class A320_Neo_Com extends BaseAirliners {

    constructor() {
        super();
    }

    get templateID() {
        return "A320_Neo_Com";
    }

    connectedCallback() {
        super.connectedCallback();

        this.view = {
            selfTestWrapper: this.querySelector("#self-test-wrapper")
        };

        this.lastAcPowerState = SimVar.GetSimVarValue("L:A32NX_COLD_AND_DARK_SPAWN", "Bool") !== 1;

        this.selfTestComplete = false;
    }

    disconnectedCallback() {
        super.disconnectedCallback();
    }

    onInteractionEvent(_args) {
    }

    Update() {
        super.Update();

        this.updatePowerState();

        this.setShowSelfTest();
    }

    updatePowerState() {
        // TODO Move anything dependent on ac power change to A32NX_Core
        const engineOn = Simplane.getEngineActive(0) === 1 || Simplane.getEngineActive(1) === 1;
        const externalPowerOn = SimVar.GetSimVarValue("EXTERNAL POWER AVAILABLE:1", "Bool") === 1 && SimVar.GetSimVarValue("EXTERNAL POWER ON", "Bool") === 1;
        const apuOn = SimVar.GetSimVarValue("L:APU_GEN_ONLINE", "Bool") === 1;

        const isAcPowerAvailable = engineOn || apuOn || externalPowerOn;

        this.acPowerStateChange = isAcPowerAvailable !== this.lastAcPowerState;

        this.lastAcPowerState = isAcPowerAvailable;
    }

    setShowSelfTest() {
        this.needsSelfTest = this.acPowerStateChange;

        if (this.needsSelfTest) {
            this.view.selfTestWrapper.style.visibility = "visible";
            this.needsSelfTest = false;

            setTimeout(() => this.view.selfTestWrapper.style.visibility = "hidden", SELF_TEST_DURATION);
        }
    }

}

registerInstrument("a320-neo-com-element", A320_Neo_Com);