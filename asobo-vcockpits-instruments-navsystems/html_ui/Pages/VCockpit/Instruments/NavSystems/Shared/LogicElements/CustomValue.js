class CustomValue {
    constructor(_gps, _nameID, _valueID, _unitID) {
        this.valueIndex = 0;
        this.nameDisplay = _gps.getChildById(_nameID);
        this.valueDisplay = _gps.getChildById(_valueID);
        this.unitDisplay = _gps.getChildById(_unitID);
    }
    Update() {
        const flightPlanActive = SimVar.GetSimVarValue("GPS IS ACTIVE FLIGHT PLAN", "boolean");
        switch (this.valueIndex) {
            case 0:
                this.nameDisplay.textContent = "BRG";
                this.unitDisplay.innerHTML = "o<br/>M";
                this.valueDisplay.textContent = !flightPlanActive ? "___" : fastToFixed(SimVar.GetSimVarValue("GPS WP BEARING", "degree"), 0);
                break;
            case 1:
                this.nameDisplay.textContent = "CTS";
                this.unitDisplay.innerHTML = "o<br/>M";
                this.valueDisplay.textContent = !flightPlanActive ? "___" : fastToFixed(SimVar.GetSimVarValue("GPS COURSE TO STEER", "degree"), 0);
                break;
            case 2:
                this.nameDisplay.textContent = "XTK";
                this.unitDisplay.innerHTML = "n<br/>m";
                this.valueDisplay.textContent = !flightPlanActive ? "___._" : fastToFixed(SimVar.GetSimVarValue("GPS WP CROSS TRK", "nautical mile"), 1);
                break;
            case 3:
                this.nameDisplay.textContent = "DTK";
                this.unitDisplay.innerHTML = "o<br/>M";
                this.valueDisplay.textContent = !flightPlanActive ? "___" : fastToFixed(SimVar.GetSimVarValue("GPS WP DESIRED TRACK", "degree"), 0);
                break;
            case 4:
                this.nameDisplay.textContent = "DIS";
                this.unitDisplay.innerHTML = "n<br/>m";
                this.valueDisplay.textContent = !flightPlanActive ? "___._" : fastToFixed(SimVar.GetSimVarValue("GPS WP DISTANCE", "nautical mile"), 1);
                break;
            case 5:
                this.nameDisplay.textContent = "ESA";
                this.unitDisplay.innerHTML = "f<br/>t";
                this.valueDisplay.textContent = "___";
                break;
            case 6:
                this.nameDisplay.textContent = "ETA";
                this.unitDisplay.innerHTML = "";
                var ETA = SimVar.GetSimVarValue("GPS ETA", "minutes");
                this.valueDisplay.textContent = !flightPlanActive ? "__:__" : Math.floor(ETA / 60) + ":" + Math.floor(ETA % 60);
                break;
            case 7:
                this.nameDisplay.textContent = "ETE";
                this.unitDisplay.innerHTML = "";
                var ETE = SimVar.GetSimVarValue("GPS ETE", "seconds");
                this.valueDisplay.textContent = !flightPlanActive ? "__:__" : ETE >= 3600 ? Math.floor(ETE / 3600) + "+" + Math.floor((ETE % 3600) / 60).toString().padStart(2, "0") : Math.floor(ETE / 60) + ":" + Math.floor(ETE % 60).toString().padStart(2, "0");
                break;
            case 8:
                this.nameDisplay.textContent = "FLOW";
                this.unitDisplay.innerHTML = "lb<br/>/h";
                this.valueDisplay.textContent = fastToFixed(SimVar.GetSimVarValue("ESTIMATED FUEL FLOW", "pound per hour"), 0);
                break;
            case 9:
                this.nameDisplay.textContent = "GS";
                this.unitDisplay.innerHTML = "k<br/>t";
                this.valueDisplay.textContent = fastToFixed(SimVar.GetSimVarValue("GPS GROUND SPEED", "knots"), 0);
                break;
            case 10:
                this.nameDisplay.textContent = "TRK";
                this.unitDisplay.innerHTML = "o<br/>M";
                this.valueDisplay.textContent = fastToFixed(SimVar.GetSimVarValue("GPS GROUND MAGNETIC TRACK", "degree"), 0);
                break;
            case 11:
                this.nameDisplay.textContent = "MSA";
                this.unitDisplay.innerHTML = "f<br/>t";
                this.valueDisplay.textContent = "___";
                break;
            case 12:
                this.nameDisplay.textContent = "TKE";
                this.unitDisplay.innerHTML = "o<br/>M";
                this.valueDisplay.textContent = !flightPlanActive ? "___" : fastToFixed(SimVar.GetSimVarValue("GPS WP TRACK ANGLE ERROR", "degrees"), 0);
                break;
            case 13:
                this.nameDisplay.textContent = "VSR";
                this.unitDisplay.innerHTML = "ft<br/>/s";
                this.valueDisplay.textContent = !flightPlanActive ? "___" : fastToFixed(SimVar.GetSimVarValue("GPS WP VERTICAL SPEED", "feet per second"), 0);
                break;
            case 14:
                this.nameDisplay.textContent = "ALT";
                this.unitDisplay.innerHTML = "f<br/>t";
                this.valueDisplay.textContent = fastToFixed(SimVar.GetSimVarValue("GPS POSITION ALT", "feet"), 0);
                break;
            case 15:
                this.nameDisplay.textContent = "BARO";
                this.unitDisplay.innerHTML = "m<br/>b";
                this.valueDisplay.textContent = fastToFixed(SimVar.GetSimVarValue("BAROMETER PRESSURE", "Millibars"), 0);
                break;
        }
    }
}
//# sourceMappingURL=CustomValue.js.map