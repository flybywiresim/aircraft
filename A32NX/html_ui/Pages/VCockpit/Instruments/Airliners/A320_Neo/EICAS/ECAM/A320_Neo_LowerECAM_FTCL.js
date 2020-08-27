var A320_Neo_LowerECAM_FTCL;
(function (A320_Neo_LowerECAM_FTCL) {
    class Definitions {
    }
    A320_Neo_LowerECAM_FTCL.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() { return "LowerECAMFTCLTemplate"; }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            // ELAC
            this.elac1Shape = this.querySelector("#elac1");
            this.elac2Shape = this.querySelector("#elac2");
            this.elac1Num = this.querySelector("#elacText_1");
            this.elac2Num = this.querySelector("#elacText_2");

            // SEC
            this.sec1Shape = this.querySelector("#sec1");
            this.sec2Shape = this.querySelector("#sec2");
            this.sec3Shape = this.querySelector("#sec3");
            this.sec1Num = this.querySelector("#secText_1");
            this.sec2Num = this.querySelector("#secText_2");
            this.sec3Num = this.querySelector("#secText_3");

            // PitchTrim
            this.pitchTrimLeadingDecimal = this.querySelector("#pitchTrimLeadingDecimal");
            this.pitchTrimTrailingDecimal = this.querySelector("#pitchTrimTrailingDecimal");
            this.pitchTrimDirection = this.querySelector("#pitchTrimDirection");

            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            // Update pitch trim
            var rawPitchTrim = SimVar.GetSimVarValue("ELEVATOR TRIM INDICATOR", "Position 16k") / 1213.6296;
            // Cap pitch trim at 13.5 up, 4 down
            if (rawPitchTrim > 16384.0) {
                rawPitchTrim = 16384.0;
            } else if (rawPitchTrim < -4854) {
                rawPitchTrim = -4854;
            }
            var pitchTrimPctLeading = fastToFixed(Math.floor(Math.abs(rawPitchTrim)), 0);
            var pitchTrimPctTrailing = fastToFixed(Math.floor((Math.abs(rawPitchTrim) * 10) % 10), 0);
            var pitchTrimSign = Math.sign(rawPitchTrim);

            this.pitchTrimLeadingDecimal.textContent = pitchTrimPctLeading;
            this.pitchTrimTrailingDecimal.textContent = pitchTrimPctTrailing;
            if (pitchTrimSign == -1) {
                this.pitchTrimDirection.textContent = "DN";
            } else {
                this.pitchTrimDirection.textContent = "UP";
            }

            // Update ELAC's and SEC's
            var elac1_On = SimVar.GetSimVarValue("FLY BY WIRE ELAC SWITCH:1", "boolean");
            var elac2_On = SimVar.GetSimVarValue("FLY BY WIRE ELAC SWITCH:2", "boolean");
            var elac1_Failed = SimVar.GetSimVarValue("FLY BY WIRE ELAC FAILED:1", "boolean");
            var elac2_Failed = SimVar.GetSimVarValue("FLY BY WIRE ELAC FAILED:2", "boolean");
            var sec1_On = SimVar.GetSimVarValue("FLY BY WIRE SEC SWITCH:1", "boolean");
            var sec2_On = SimVar.GetSimVarValue("FLY BY WIRE SEC SWITCH:2", "boolean");
            var sec3_On = SimVar.GetSimVarValue("FLY BY WIRE SEC SWITCH:3", "boolean");
            var sec1_Failed = SimVar.GetSimVarValue("FLY BY WIRE SEC FAILED:1", "boolean");
            var sec2_Failed = SimVar.GetSimVarValue("FLY BY WIRE SEC FAILED:2", "boolean");
            var sec3_Failed = SimVar.GetSimVarValue("FLY BY WIRE SEC FAILED:3", "boolean");

            if (elac1_On && !elac1_Failed) {
                this.elac1Shape.setAttribute("class", "MainShape");
                this.elac1Num.setAttribute("class", "Value15");
            } else {
                this.elac1Shape.setAttribute("class", "MainShapeWarning");
                this.elac1Num.setAttribute("class", "Value15Warning");
            }
            if (elac2_On && !elac2_Failed) {
                this.elac2Shape.setAttribute("class", "MainShape");
                this.elac2Num.setAttribute("class", "Value15");
            } else {
                this.elac2Shape.setAttribute("class", "MainShapeWarning");
                this.elac2Num.setAttribute("class", "Value15Warning");
            }
            if (sec1_On && !sec1_Failed) {
                this.sec1Shape.setAttribute("class", "MainShape");
                this.sec1Num.setAttribute("class", "Value15");
            } else {
                this.sec1Shape.setAttribute("class", "MainShapeWarning");
                this.sec1Num.setAttribute("class", "Value15Warning");
            }
            if (sec2_On && !sec2_Failed) {
                this.sec2Shape.setAttribute("class", "MainShape");
                this.sec2Num.setAttribute("class", "Value15");
            } else {
                this.sec2Shape.setAttribute("class", "MainShapeWarning");
                this.sec2Num.setAttribute("class", "Value15Warning");
            }
            if (sec3_On && !sec3_Failed) {
                this.sec3Shape.setAttribute("class", "MainShape");
                this.sec3Num.setAttribute("class", "Value15");
            } else {
                this.sec3Shape.setAttribute("class", "MainShapeWarning");
                this.sec3Num.setAttribute("class", "Value15Warning");
            }
        }
    }
    A320_Neo_LowerECAM_FTCL.Page = Page;
})(A320_Neo_LowerECAM_FTCL || (A320_Neo_LowerECAM_FTCL = {}));
customElements.define("a320-neo-lower-ecam-ftcl", A320_Neo_LowerECAM_FTCL.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_FTCL.js.map