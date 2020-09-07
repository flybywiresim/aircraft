class A320_Neo_Clock extends BaseAirliners {
    constructor() {
        super();
        this.chronoValue = 0;
        this.lastResetVal = 0
    }
    get templateID() { return "A320_Neo_Clock"; }
    connectedCallback() {
        super.connectedCallback();
        this.topSelectorElem = this.getChildById("TopSelectorValue");
        this.middleSelectorElem = this.getChildById("MiddleSelectorValue");
        this.bottomselectorElem = this.getChildById("BottomSelectorValue");
    }
    disconnectedCallback() {
        super.disconnectedCallback();
    }
    onInteractionEvent(_args) {
    }
    Update() {
        super.Update();
        if (this.CanUpdate()) {
            if (SimVar.GetSimVarValue("L:PUSH_CHRONO_CHR", "Bool") == 1) {
                this.chronoValue += this.deltaTime / 1000;
            }

            if (SimVar.GetSimVarValue("L:PUSH_CHRONO_RST", "Bool") != this.lastResetVal) {
                this.chronoValue = 0
                this.lastResetVal = SimVar.GetSimVarValue("L:PUSH_CHRONO_RST", "Bool")
            }

            if (this.topSelectorElem) {
                let ChronoTime = this.getChronoTime();
                if (SimVar.GetSimVarValue("L:PUSH_CHRONO_CHR", "Bool") == 0 && ChronoTime == "00:00") {
                    this.topSelectorElem.textContent = ""
                } else {
                    this.topSelectorElem.textContent = ChronoTime
                }
            }

            if (this.middleSelectorElem) {
                if (SimVar.GetSimVarValue("L:PUSH_CHRONO_SET", "Bool") == 0) {
                    this.middleSelectorElem.textContent = this.getUTCTime();
                } else {
                    this.middleSelectorElem.textContent = this.getUTCDate();
                }
            }

            if (this.bottomselectorElem) {
                this.bottomselectorElem.textContent = this.getFlightTime();
            }
        }
    }
    getUTCTime() {
        var value = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
        if (value) {
            var seconds = Number.parseInt(value);
            var time = Utils.SecondsToDisplayTime(seconds, true, true, false);
            return time.toString();
        }
        return "";
    }

    getUTCDate() {
        let Day = SimVar.GetGlobalVarValue("ZULU DAY OF MONTH", "number")
        let Month = SimVar.GetGlobalVarValue("ZULU MONTH OF YEAR", "number")
        let Year = `${SimVar.GetGlobalVarValue("ZULU YEAR", "number")}`.substr(2,4)

        return `${Day}.${Month}.${Year}`
    }

    getLocalTime() {
        var value = SimVar.GetGlobalVarValue("LOCAL TIME", "seconds");
        if (value) {
            var seconds = Number.parseInt(value);
            var time = Utils.SecondsToDisplayTime(seconds, true, false, false);
            return time.toString();
        }
        return "";
    }
    getFlightTime() {
        var value = SimVar.GetGameVarValue("FLIGHT DURATION", "seconds");
        if (value) {
            var time = Utils.SecondsToDisplayTime(value, true, false, false);
            return time.toString();
        }
        return "";
    }
    getChronoTime() {
        var totalSeconds = this.chronoValue;
        var hours = Math.floor(totalSeconds / 3600);
        var minutes = Math.floor((totalSeconds - (hours * 3600)) / 60);
        var seconds = Math.floor(totalSeconds - (minutes * 60) - (hours * 3600));
        var time = "";
        if (hours == 0) {
            if (minutes < 10)
                time += "0";
            time += minutes;
            time += ":";
            if (seconds < 10)
                time += "0";
            time += seconds;
        }
        else {
            if (hours < 10)
                time += "0";
            time += hours;
            time += ":";
            if (minutes < 10)
                time += "0";
            time += minutes;
        }
        return time.toString();
    }
}
registerInstrument("a320-neo-clock-element", A320_Neo_Clock);
//# sourceMappingURL=A320_Neo_Clock.js.map