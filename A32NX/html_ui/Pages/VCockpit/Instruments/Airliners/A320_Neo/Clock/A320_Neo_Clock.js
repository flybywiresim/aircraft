class A320_Neo_Clock extends BaseAirliners {
    constructor() {
        super();
        this.chronoValue = 0;
        this.localDeltaTime = 0;
        this.lastChronoTime = null;
        this.lastDisplayTime = null;
        this.lastFlightTime = null;
        this.lastLocalTime = 0;
        this.lastResetVal = null;
    }
    get templateID() { return "A320_Neo_Clock"; }
    connectedCallback() {
        super.connectedCallback();
        this.topSelectorElem = this.getChildById("TopSelectorValue");
        this.middleSelectorElem = this.getChildById("MiddleSelectorValue");
        this.bottomSelectorElem = this.getChildById("BottomSelectorValue");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
    }
    updateLocalDelta() {
        const nowTime = Date.now()
        this.localDeltaTime = nowTime - this.lastLocalTime
        this.lastLocalTime = nowTime
    }
    Update() {
        super.Update();
        if (this.CanUpdate()) {
            this.updateLocalDelta()
            const chronoActive = SimVar.GetSimVarValue("L:PUSH_CHRONO_CHR", "Bool");
            if (chronoActive === 1) {
                this.chronoValue += this.localDeltaTime / 1000;
            }

            const currentResetVal = SimVar.GetSimVarValue("L:PUSH_CHRONO_RST", "Bool")
            if (currentResetVal != this.lastResetVal) {
                this.lastResetVal = currentResetVal
                this.chronoValue = 0
            }

            if (this.topSelectorElem) {
                const chronoTime = this.getChronoTime();
                if (chronoTime !== this.lastChronoTime) {
                    this.lastChronoTime = chronoTime
                    this.topSelectorElem.textContent = chronoTime
                }
            }

            if (this.middleSelectorElem) {
                const currentDisplayTime = SimVar.GetSimVarValue("L:PUSH_CHRONO_SET", "Bool") ? this.getUTCDate() : this.getUTCTime()
                if (currentDisplayTime !== this.lastDisplayTime) {
                    this.lastDisplayTime = currentDisplayTime;
                    this.middleSelectorElem.textContent = currentDisplayTime;
                }
            }

            if (this.bottomSelectorElem) {
                const currentFlightTime = this.getFlightTime();
                if (currentFlightTime !== this.lastFlightTime) {
                    this.lastFlightTime = currentFlightTime;
                    this.bottomSelectorElem.textContent = currentFlightTime;
                }
            }
        }
    }
    getUTCTime() {
        const value = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
        if (value) {
            const seconds = Number.parseInt(value);
            const time = Utils.SecondsToDisplayTime(seconds, true, true, false);
            return time.toString();
        }
        return "";
    }

    getUTCDate() {
        const Day = SimVar.GetGlobalVarValue("ZULU DAY OF MONTH", "number")
        const Month = SimVar.GetGlobalVarValue("ZULU MONTH OF YEAR", "number")
        const Year = `${SimVar.GetGlobalVarValue("ZULU YEAR", "number")}`.substr(2,4)

        return `${Day}.${Month}.${Year}`
    }

    getLocalTime() {
        const value = SimVar.GetGlobalVarValue("LOCAL TIME", "seconds");
        if (value) {
            const seconds = Number.parseInt(value);
            const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
            return time.toString();
        }
        return "";
    }
    getFlightTime() {
        const value = SimVar.GetGameVarValue("FLIGHT DURATION", "seconds");
        if (value) {
            const time = Utils.SecondsToDisplayTime(value, true, false, false);
            return time.toString();
        }
        return "";
    }
    getChronoTime() {
        const chronoActive = SimVar.GetSimVarValue("L:PUSH_CHRONO_CHR", "Bool");
        const totalSeconds = this.chronoValue;

        if (chronoActive || totalSeconds > 0) {
            const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
            const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');

            if (hours === "00") {
                const seconds = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
                return `${minutes}:${seconds}`;
            } else {
                return `${hours}:${minutes}`;
            }
        }
        return "";
    }
}
registerInstrument("a320-neo-clock-element", A320_Neo_Clock);
//# sourceMappingURL=A320_Neo_Clock.js.map
