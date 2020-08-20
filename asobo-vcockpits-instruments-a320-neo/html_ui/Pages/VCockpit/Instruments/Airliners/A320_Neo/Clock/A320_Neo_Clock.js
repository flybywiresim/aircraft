class A320_Neo_Clock extends BaseAirliners {
    constructor() {
        super();
        this.chronoStarted = false;
        this.chronoValue = 0;
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
        if (_args[0] == "oclock_chrono") {
            if (this.chronoStarted) {
                this.chronoStarted = false;
            }
            else if (this.chronoValue > 0) {
                this.chronoValue = 0;
            }
            else {
                this.chronoStarted = true;
            }
        }
    }
    Update() {
        super.Update();
        if (this.CanUpdate()) {
            if (this.chronoStarted) {
                this.chronoValue += this.deltaTime / 1000;
            }
            if (this.topSelectorElem) {
                this.topSelectorElem.textContent = this.getChronoTime();
            }
            if (this.middleSelectorElem) {
                this.middleSelectorElem.textContent = this.getUTCTime();
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