class DisplayUnit {
    constructor(rootElement, isPoweredFn, getSelfTestTimeInSecondsFn, potentiometerId, selfTestElement) {
        this.rootElement = rootElement;
        this.selfTest = new DisplayUnitSelfTest(selfTestElement, getSelfTestTimeInSecondsFn);
        this.isPowered = isPoweredFn;
        this.potentiometerId = potentiometerId;
        this.offDurationTimerActive = SimVar.GetSimVarValue('L:A32NX_COLD_AND_DARK_SPAWN', 'Bool');
        this.previouslyOff = false;
        // Start with a state where turning on the display unit within 10 seconds after starting the flight
        // will trigger the self test.
        this.offDurationInMilliseconds = this.offDurationTimerActive ? DisplayUnitSelfTest.RequiredAfterBeingOffForMilliseconds : 0;
        if (this.offDurationTimerActive) {
            this.selfTest.execute(this.offDurationInMilliseconds);
        }
    }

    isJustNowTurnedOn() {
        return this.previouslyOff && this.isOn();
    }

    isOn() {
        const brightness = SimVar.GetSimVarValue(`LIGHT POTENTIOMETER:${this.potentiometerId}`, "number");
        return brightness >= 0.01 && this.isPowered();
    }

    update(deltaTime) {
        const isOn = this.isOn();

        if (this.isJustNowTurnedOn()) {
            this.selfTest.execute(this.offDurationInMilliseconds);
        }

        if (!isOn) {
            this.selfTest.interrupt();
        } else {
            this.selfTest.update(deltaTime);
        }

        if (this.offDurationTimerActive) {
            if (isOn) {
                this.offDurationInMilliseconds = 0;
            } else {
                this.offDurationInMilliseconds += deltaTime;
            }
        } else {
            // on non c&d spawn in
            if (isOn) {
                this.offDurationTimerActive = true; // normal ops
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
        this.maxTimer = this.getSelfTestTimeInSeconds() * 1000;
        this.init = false;

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
            this.remainingTestDurationInMilliseconds = this.maxTimer;
        }
    }

    interrupt() {
        if (this.remainingTestDurationInMilliseconds > 0 && this.remainingTestDurationInMilliseconds < this.maxTimer) {
            this.remainingTestDurationInMilliseconds = this.maxTimer;
        }
    }

    update(deltaTime) {
        if (this.remainingTestDurationInMilliseconds > 0) {
            if (this.init) {
                this.remainingTestDurationInMilliseconds -= deltaTime;
            } else {
                this.init = true;
            }
            this.element.style.visibility = "visible";
        } else {

            this.element.style.visibility = "hidden";
        }
    }
}
