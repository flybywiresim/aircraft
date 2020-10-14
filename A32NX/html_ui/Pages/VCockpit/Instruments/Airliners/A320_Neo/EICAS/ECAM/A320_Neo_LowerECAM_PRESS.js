/** @type A320_Neo_LowerECAM_PRESS */
var A320_Neo_LowerECAM_PRESS;
(function (A320_Neo_LowerECAM_PRESS) {
    class Definitions {
    }
    A320_Neo_LowerECAM_PRESS.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() {
            return "LowerECAMPRESSTemplate";
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.isInitialised = true;

            this.htmlPsiInt = this.querySelector("#psi-gauge-int");
            this.htmlPsiDecimal = this.querySelector("#psi-gauge-decimal");
            this.htmlPsiIndicator = this.querySelector("#delta-psi-indicator");

            this.htmlCabinVSValue = this.querySelector("#v-s-value");
            this.htmlCabinVSIndicator = this.querySelector("#v-s-indicator");

            this.htmlCabinAltValue = this.querySelector("#cabin-altitude-value");
            this.htmlCabinAltIndicator = this.querySelector("#cabin-alt-indicator");
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            //psi delta gauge
            const pressureDelta = SimVar.GetSimVarValue("PRESSURIZATION PRESSURE DIFFERENTIAL", "Pounds per square foot") / 144;
            const pressureDeltaInt = parseInt(pressureDelta);
            const pressureDeltaDecimal = parseInt((pressureDelta - pressureDeltaInt) * 10);

            this.htmlPsiInt.textContent = pressureDeltaInt + ".";
            this.htmlPsiDecimal.textContent = pressureDeltaDecimal;
            this.htmlPsiIndicator.setAttribute("style", "transform-origin: 100px 152.5px; transform: rotate("+ (pressureDelta * 19.375) +"deg); stroke-width: 3px; stroke-linecap: round;");
            
            //cabin v/s gauge
            const cabinVSValue = SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE RATE", "feet per second") * 60;

            this.htmlCabinVSValue.textContent = parseInt(cabinVSValue);
            this.htmlCabinVSIndicator.setAttribute("style", "transform-origin: 100px 152.5px; transform: rotate("+ (cabinVSValue * 0.045) +"deg); stroke-width: 3px; stroke-linecap: round;");

            //cabin alt gauge
            const cabinAltitude = SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet");

            this.htmlCabinAltValue.textContent = parseInt(cabinAltitude);
            this.htmlCabinAltIndicator.setAttribute("style", "transform-origin: 100px 152.5px; transform: rotate("+ (cabinAltitude * 0.0164) +"deg); stroke-width: 3px; stroke-linecap: round;");

        }
    }
    A320_Neo_LowerECAM_PRESS.Page = Page;

})(A320_Neo_LowerECAM_PRESS || (A320_Neo_LowerECAM_PRESS = {}));
customElements.define("a320-neo-lower-ecam-press", A320_Neo_LowerECAM_PRESS.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_PRESS.js.map