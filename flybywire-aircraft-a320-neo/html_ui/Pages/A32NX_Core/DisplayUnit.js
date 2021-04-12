class DisplayUnit {
    constructor(isPoweredFn, getSelfTestTimeInSecondsFn, potentiometerId, selfTestElement) {
        this.selfTest = new DisplayUnitSelfTest(selfTestElement, getSelfTestTimeInSecondsFn);
        this.isPowered = isPoweredFn;
        this.potentiometerId = potentiometerId;

        this.previouslyOff = false;
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
            this.selfTest.execute();
        }

        const isOn = this.isOn();
        this.selfTest.update(deltaTime, isOn);

        this.previouslyOff = !isOn;
    }
}

class DisplayUnitSelfTest {
    constructor(element, getSelfTestTimeInSecondsFn) {
        this.element = element;
        this.getSelfTestTimeInSeconds = getSelfTestTimeInSecondsFn;

        this.remainingTestDurationInMilliseconds = 0;

        // Start with a state where turning on the display unit within 10 seconds after starting the flight
        // will trigger the self test.
        this.offDurationInMilliseconds = DisplayUnitSelfTest.RequiredAfterBeingOffForMilliseconds;
    }

    static get RequiredAfterBeingOffForMilliseconds() {
        return 10000;
    }

    isRequired() {
        return this.offDurationInMilliseconds >= DisplayUnitSelfTest.RequiredAfterBeingOffForMilliseconds;
    }

    execute() {
        if (this.isRequired()) {
            this.remainingTestDurationInMilliseconds = this.getSelfTestTimeInSeconds() * 1000;
        }
    }

    update(deltaTime, displayUnitIsOn) {
        this.remainingTestDurationInMilliseconds -= deltaTime;
        this.element.style.visibility = this.remainingTestDurationInMilliseconds > 0 ? "visible" : "hidden";

        if (displayUnitIsOn) {
            this.offDurationInMilliseconds = 0;
        } else {
            this.offDurationInMilliseconds += deltaTime;
        }
    }
}
