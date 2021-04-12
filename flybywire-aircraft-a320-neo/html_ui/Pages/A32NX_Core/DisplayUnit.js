class DisplayUnit {
    constructor(isPoweredFn, getSelfTestTimeInSecondsFn, potentiometerId, selfTestElement) {
        this.isPowered = isPoweredFn;
        this.getSelfTestTimeInSeconds = getSelfTestTimeInSecondsFn;
        this.potentiometerId = potentiometerId;
        this.selfTestElement = selfTestElement;

        this.turnedOnDuringThisUpdate = false;
        this.previousUpdateBrightness = 0;
        this.wasPoweredDuringPreviousUpdate = false;
        this.selfTestTimerMilliseconds = 0;
    }

    updateBeforeThrottle() {
        const brightness = SimVar.GetSimVarValue(`LIGHT POTENTIOMETER:${this.potentiometerId}`, "number");
        this.turnedOnDuringThisUpdate = (brightness >= 0.1 && this.previousUpdateBrightness < 0.1);
        this.previousUpdateBrightness = brightness;
    }

    isTurnedOnDuringThisUpdate() {
        return this.turnedOnDuringThisUpdate;
    }

    update(deltaTime) {
        this.selfTestTimerMilliseconds -= deltaTime / 1000;

        const isPowered = this.isPowered();
        const powerStateChanged = isPowered != this.wasPoweredDuringPreviousUpdate;

        if ((this.isTurnedOnDuringThisUpdate() || powerStateChanged) && isPowered) {
            this.selfTestTimerMilliseconds = this.getSelfTestTimeInSeconds() * 1000;
        }

        this.selfTestTimerMilliseconds -= deltaTime;

        this.selfTestElement.style.visibility = this.selfTestTimerMilliseconds > 0 ? "visible" : "hidden";

        this.wasPoweredDuringPreviousUpdate = isPowered;
    }
}
