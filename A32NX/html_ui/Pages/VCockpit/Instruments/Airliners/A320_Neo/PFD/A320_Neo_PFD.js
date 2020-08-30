class A320_Neo_PFD extends BaseAirliners {
    constructor() {
        super();
        this.initDuration = 7000;
    }
    get templateID() { return "A320_Neo_PFD"; }
    get IsGlassCockpit() { return true; }
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
    Update() {
        super.Update();
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
        this.showILS = false;
        this.attitude = new A320_Neo_PFD_Attitude();
        this.vSpeed = new A320_Neo_PFD_VSpeed();
        this.airspeed = new A320_Neo_PFD_Airspeed();
        this.altimeter = new A320_Neo_PFD_Altimeter();
        this.compass = new A320_Neo_PFD_Compass();
        this.navStatus = new A320_Neo_PFD_NavStatus();
        this.ils = new A320_Neo_PFD_ILS();
        this.element = new NavSystemElementGroup([
            this.attitude,
            this.vSpeed,
            this.airspeed,
            this.altimeter,
            this.compass,
            this.navStatus,
            this.ils
        ]);
    }
    init() {
        super.init();
        this.showILS = SimVar.GetSimVarValue("L:BTN_LS_FILTER_ACTIVE", "bool");
        this.ils.showILS(this.showILS);
        this.compass.showILS(this.showILS);

        //ADIRS
        this.flashTimer = 1;
        this.flashState = false;

        this.miscFail = document.querySelector("#MiscFail");

        this.attitudeFail = document.querySelector("#AttitudeFail");
        this.attFlash = document.querySelector("#att_flash");

        this.headingFail = document.querySelector("#HeadingFail");
        this.hdgFlash = document.querySelector("#hdg_flash");

        this.spdFlash = document.querySelector("#spd_flash");
        this.altFlash = document.querySelector("#alt_flash");
        this.vsFlash = document.querySelector("#vs_flash");

        this.hasInitialized = true;

        //SELF TEST
        this.selfTestDiv = this.gps.getChildById("SelfTestDiv");
        this.selfTestTimerStarted = false;
        this.electricity = this.gps.getChildById("Electricity")
    }
    onUpdate(_deltaTime) {
        super.onUpdate();
        if (!this.hasInitialized) return;
        this.flashTimer -= _deltaTime/1000;
        if (this.flashTimer <= 0) {
            this.flashTimer = 1;
            this.flashState = !this.flashState;
        }
        if (this.flashState) {
            this.attFlash.setAttribute("visibility", "visible");
            this.hdgFlash.setAttribute("visibility", "visible");
            this.spdFlash.setAttribute("visibility", "visible");
            this.altFlash.setAttribute("visibility", "visible");
            this.vsFlash.setAttribute("visibility", "visible");
        } else if (this.selfTestTimer > -5) {
            this.attFlash.setAttribute("visibility", "hidden");
            this.hdgFlash.setAttribute("visibility", "hidden");
            this.spdFlash.setAttribute("visibility", "hidden");
            this.altFlash.setAttribute("visibility", "hidden");
            this.vsFlash.setAttribute("visibility", "hidden");
        }

        var ADIRSState = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_STATE", "Enum");

        if (ADIRSState >= 1) {
            this.attitudeFail.setAttribute("style", "display:none");
            this.miscFail.setAttribute("style", "display:none");
            
        } else {
            this.attitudeFail.setAttribute("style", "");
            this.miscFail.setAttribute("style", "");
        }

        if (ADIRSState == 2) {
            this.headingFail.setAttribute("style", "display:none");
        } else {
            this.headingFail.setAttribute("style", "");
        }

        var engineOn = Simplane.getEngineActive(0) || Simplane.getEngineActive(1);
        var externalPower = SimVar.GetSimVarValue("EXTERNAL POWER ON", "bool");
        var apuOn = SimVar.GetSimVarValue("APU SWITCH", "bool");

        var isPowerAvailable = engineOn || apuOn || externalPower;
        this.updateScreenState(isPowerAvailable);

        if (engineOn) {
            this.selfTestDiv.style.display = "none";
            this.selfTestTimerStarted = true;
        }
        // Check if external power is on & timer not already started
        if ((externalPower || apuOn) && !this.selfTestTimerStarted) {
            this.selfTestTimer = 13;
            this.selfTestTimerStarted = true;
        }
        // Timer
        if (this.selfTestTimer != null) {
            this.selfTestTimer -= _deltaTime / 1000;
            if (this.selfTestTimer <= 0) {
                this.selfTestDiv.style.display = "none";
            }
        }
    }
    onEvent(_event) {
        switch (_event) {
            case "BTN_LS":
                this.showILS = !this.showILS;
                SimVar.SetSimVarValue("L:BTN_LS_FILTER_ACTIVE", "number", this.showILS ? 1 : 0);
                this.ils.showILS(this.showILS);
                this.compass.showILS(this.showILS);
                break;
        }
    }

    updateScreenState(isPowerAvailable) {
        if (!isPowerAvailable) {
            this.electricity.style.display = "none";
        } else {
            this.electricity.style.display = "block";
        }
    }
    
}
class A320_Neo_PFD_VSpeed extends NavSystemElement {
    init(root) {
        this.vsi = this.gps.getChildById("VSpeed");
        this.vsi.aircraft = Aircraft.A320_NEO;
        this.vsi.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        var vSpeed = Math.round(Simplane.getVerticalSpeed());
        this.vsi.setAttribute("vspeed", vSpeed.toString());
        if (Simplane.getAutoPilotVerticalSpeedHoldActive()) {
            var selVSpeed = Math.round(Simplane.getAutoPilotVerticalSpeedHoldValue());
            this.vsi.setAttribute("selected_vspeed", selVSpeed.toString());
            this.vsi.setAttribute("selected_vspeed_active", "true");
        }
        else {
            this.vsi.setAttribute("selected_vspeed_active", "false");
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class A320_Neo_PFD_Airspeed extends NavSystemElement {
    constructor() {
        super();
    }
    init(root) {
        this.airspeed = this.gps.getChildById("Airspeed");
        this.airspeed.aircraft = Aircraft.A320_NEO;
        this.airspeed.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.airspeed.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class A320_Neo_PFD_Altimeter extends NavSystemElement {
    constructor() {
        super();
    }
    init(root) {
        this.altimeter = this.gps.getChildById("Altimeter");
        this.altimeter.aircraft = Aircraft.A320_NEO;
        this.altimeter.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.altimeter.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
        switch (_event) {
            case "BARO_INC":
                SimVar.SetSimVarValue("K:KOHLSMAN_INC", "number", 1);
                break;
            case "BARO_DEC":
                SimVar.SetSimVarValue("K:KOHLSMAN_DEC", "number", 1);
                break;
        }
    }
}
class A320_Neo_PFD_Attitude extends NavSystemElement {
    constructor() {
        super(...arguments);
        this.vDir = new Vec2();
    }
    init(root) {
        this.hsi = this.gps.getChildById("Horizon");
        this.hsi.aircraft = Aircraft.A320_NEO;
        this.hsi.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.hsi) {
            this.hsi.update(_deltaTime);
            var xyz = Simplane.getOrientationAxis();
            if (xyz) {
                this.hsi.setAttribute("pitch", (xyz.pitch / Math.PI * 180).toString());
                this.hsi.setAttribute("bank", (xyz.bank / Math.PI * 180).toString());
            }
            this.hsi.setAttribute("slip_skid", Simplane.getInclinometer().toString());
            this.hsi.setAttribute("radio_altitude", Simplane.getAltitudeAboveGround().toString());
            this.hsi.setAttribute("radio_decision_height", this.gps.radioNav.getRadioDecisionHeight().toString());
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class A320_Neo_PFD_Compass extends NavSystemElement {
    init(root) {
        this.hsi = this.gps.getChildById("Compass");
        this.hsi.aircraft = Aircraft.A320_NEO;
        this.hsi.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        this.hsi.update(_deltaTime);
    }
    onExit() {
    }
    onEvent(_event) {
    }
    showILS(_val) {
        if (this.hsi) {
            this.hsi.showILS(_val);
        }
    }
}
class A320_Neo_PFD_NavStatus extends NavSystemElement {
    init(root) {
        this.fma = this.gps.getChildById("FMA");
        this.fma.aircraft = Aircraft.A320_NEO;
        this.fma.gps = this.gps;
        this.isInitialized = true;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.fma != null) {
            this.fma.update(_deltaTime);
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
}
class A320_Neo_PFD_ILS extends NavSystemElement {
    init(root) {
        this.ils = this.gps.getChildById("ILS");
        this.ils.aircraft = Aircraft.A320_NEO;
        this.ils.gps = this.gps;
    }
    onEnter() {
    }
    onUpdate(_deltaTime) {
        if (this.ils) {
            this.ils.update(_deltaTime);
        }
    }
    onExit() {
    }
    onEvent(_event) {
    }
    showILS(_val) {
        if (this.ils) {
            this.ils.showLocalizer(_val);
            this.ils.showGlideslope(_val);
            this.ils.showNavInfo(_val);
        }
    }
}
registerInstrument("a320-neo-pfd-element", A320_Neo_PFD);
//# sourceMappingURL=A320_Neo_PFD.js.map