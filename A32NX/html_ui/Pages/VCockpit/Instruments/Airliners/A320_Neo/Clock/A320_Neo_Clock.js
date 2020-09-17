class A320_Neo_Clock extends BaseAirliners {
    constructor() {
        super();
        this.chronoAcc = 0; // Accumulated time since he chrono was first started. This is to retain time after a pause.
        this.chronoStart = 0;
        this.lastChronoState = null;
        this.lastChronoTime = null;
        this.lastDisplayTime = null;
        this.lastDisplayTime2 = null;
        this.lastFlightTime = null;
        this.lastLocalTime = 0;
        this.lastResetVal = null;
    }
    get templateID() { return "A320_Neo_Clock"; }
    connectedCallback() {
        super.connectedCallback();
        this.topSelectorElem = this.getChildById("TopSelectorValue");
        this.middleSelectorElem = this.getChildById("MiddleSelectorValue");
        this.middleSelectorElem2 = this.getChildById("MiddleSelectorValue2");
        this.bottomSelectorElem = this.getChildById("BottomSelectorValue");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
    }
    Update() {
        super.Update();
        if (this.CanUpdate()) {
            const absTime = SimVar.GetGlobalVarValue("ABSOLUTE TIME", "Seconds")

            const chronoState = SimVar.GetSimVarValue("L:PUSH_CHRONO_CHR", "Bool");
            if (chronoState !== this.lastChronoState) {
                this.lastChronoState = chronoState
                if (chronoState === 1) {
                    this.chronoStart = absTime
                } else {
                    this.chronoAcc = this.chronoSeconds
                    this.chronoStart = 0
                }
            }

            const currentResetVal = SimVar.GetSimVarValue("L:PUSH_CHRONO_RST", "Bool")
            if (currentResetVal !== this.lastResetVal) {
                this.lastResetVal = currentResetVal
                // Intentionally performed on every press.
                if (chronoState === 0) {
                    this.chronoStart = 0
                    this.chronoAcc = 0
                }
            }

            if (this.topSelectorElem) {
                const chronoTime = this.getChronoTime();
                if (chronoTime !== this.lastChronoTime) {
                    this.lastChronoTime = chronoTime
                    this.topSelectorElem.textContent = chronoTime
                }
            }

            if (this.middleSelectorElem) {
                let currentDisplayTime = "";
                let currentDisplayTime2 = "";
                if (SimVar.GetSimVarValue("L:PUSH_CHRONO_SET", "Bool") === 1) {
                    currentDisplayTime = this.getUTCDate(); 
                    currentDisplayTime2 = this.getUTCYear();                  
                } else {
                    let UTCTime = this.getUTCTime();
                    currentDisplayTime = UTCTime.substr(0,5); 
                    currentDisplayTime2 = UTCTime.substr(6,2);
                } 
                if (currentDisplayTime !== this.lastDisplayTime) {
                    this.lastDisplayTime = currentDisplayTime;
                    this.middleSelectorElem.textContent = currentDisplayTime;                   
                }
                if (currentDisplayTime2 !== this.lastDisplayTime2) {
                    this.lastDisplayTime2 = currentDisplayTime2;
                    this.middleSelectorElem2.textContent = currentDisplayTime2;
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
        const day = SimVar.GetGlobalVarValue("ZULU DAY OF MONTH", "number");
        const month = `${SimVar.GetGlobalVarValue("ZULU MONTH OF YEAR", "number")}`.padStart(2,'0');
        return `${month}:${day}`;
    }

    getUTCYear() {
        return SimVar.GetGlobalVarValue("ZULU YEAR", "number").toString().substr(2,4);
    }
    getLocalTime() {
        const value = SimVar.GetGlobalVarValue("LOCAL TIME", "seconds");
        if (value) {
            const seconds = Number.parseInt(value);
            const time = Utils.SecondsToDisplayTime(seconds, true, false, false);
            return time.toString().substr(0,5);
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
        const totalSeconds = this.chronoSeconds

        if (this.chronoStart || totalSeconds > 0) {
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
    get chronoSeconds () {
        let totalSeconds = this.chronoAcc

        if (this.chronoStart) {
            totalSeconds += SimVar.GetGlobalVarValue("ABSOLUTE TIME", "Seconds") - this.chronoStart
        }

        return Math.max(totalSeconds, 0)
    }
}
registerInstrument("a320-neo-clock-element", A320_Neo_Clock);
//# sourceMappingURL=A320_Neo_Clock.js.map
