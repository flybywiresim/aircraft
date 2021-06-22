class DisplayUnit {
    constructor(rootElement, isPoweredFn, getSelfTestTimeInSecondsFn, potentiometerId, selfTestElement) {
        this.rootElement = rootElement;
        this.selfTest = new DisplayUnitSelfTest(selfTestElement, getSelfTestTimeInSecondsFn);
        this.isPowered = isPoweredFn;
        this.potentiometerId = potentiometerId;

        this.systemsInit = Boolean(SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool') && SimVar.GetSimVarValue('L:A32NX_FMGC_FLIGHT_PHASE', 'Enum') === (FmgcFlightPhases.PREFLIGHT));
        this.previouslyOff = false;
        // Start with a state where turning on the display unit within 10 seconds after starting the flight
        // will trigger the self test.
        this.offDurationInMilliseconds = DisplayUnitSelfTest.RequiredAfterBeingOffForMilliseconds;
    }

    isJustNowTurnedOn() {
        return this.previouslyOff && this.isOn();
    }

    isOn() {
        const brightness = SimVar.GetSimVarValue(`LIGHT POTENTIOMETER:${this.potentiometerId}`, "number");
        return brightness >= 0.1 && this.isPowered();
    }

    update(deltaTime) {
        if (this.isJustNowTurnedOn()) {
            this.selfTest.execute(this.offDurationInMilliseconds);
        }

        this.selfTest.update(deltaTime);

        const isOn = this.isOn();
        if (this.systemsInit) {
            if (isOn) {
                this.offDurationInMilliseconds = 0;
            } else {
                this.offDurationInMilliseconds += deltaTime;
            }
        } else {
            // on non c&d spawn in
            this.offDurationInMilliseconds = 0;
            if (isOn) {
                this.systemsInit = true; // normal ops
            }
        }

        this.rootElement.style.display = isOn ? "block" : "none";

        this.previouslyOff = !isOn;
    }
}

class DisplayUnitSelfTest {
    constructor(element, getSelfTestTimeInSecondsFn) {
        this.element = element;
        this.getSelfTestTimeInSeconds = getSelfTestTimeInSecondsFn;

        this.remainingTestDurationInMilliseconds = 0;
    }

    static get RequiredAfterBeingOffForMilliseconds() {
        return 10000;
    }

    isRequired(offDurationInMilliseconds) {
        return offDurationInMilliseconds >= DisplayUnitSelfTest.RequiredAfterBeingOffForMilliseconds;
    }

    execute(offDurationInMilliseconds) {
        if (this.isRequired(offDurationInMilliseconds)) {
            this.remainingTestDurationInMilliseconds = this.getSelfTestTimeInSeconds() * 1000;
        }
    }

    update(deltaTime) {
        this.remainingTestDurationInMilliseconds -= deltaTime;
        this.element.style.visibility = this.remainingTestDurationInMilliseconds > 0 ? "visible" : "hidden";
    }
}
