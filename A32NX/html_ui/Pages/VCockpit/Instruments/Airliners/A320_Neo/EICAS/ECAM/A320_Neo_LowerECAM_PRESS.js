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

            this.htmlValveInlet = this.querySelector("#valve-inlet");
            this.htmlValveOutlet = this.querySelector("#valve-outlet");
            this.htmlValveSafety = this.querySelector("#valve-safety");
            this.htmlValveFlow = this.querySelector("#valve-indicator");

            this.htmlTextSafety = this.querySelector("#safety-text");
            this.htmlPackIndicatorLeft = this.querySelector("#pack-indicator-left");
            this.htmlPackIndicatorRight = this.querySelector("#pack-indicator-right");

            this.htmlLdgElevText = this.querySelector("#ldg-elev-text");
            this.htmlLdgElevText2 = this.querySelector("#lower-man-text");
            this.htmlLdgElevValue = this.querySelector("#ldg-elev-value");

            this.htmlSystems = [this.querySelector("#sys1-text"), this.querySelector("#sys2-text")]

            this.mseconds = 0;
            this.mseconds_2 = 10;
            this.justSwitched = false;
            this.activeSystem = 2;

            this.htmlSystems[1].setAttribute("visibility", "visible");
            this.htmlSystems[0].setAttribute("visibility", "hidden");
        }

        setValueWarning(htmlObj, upperLimit, lowerLimit, tolerance, originalClass, warningClass){
            if (htmlObj.textContent - tolerance > upperLimit || htmlObj.textContent + tolerance < lowerLimit) {
                htmlObj.setAttribute("class", warningClass);
            } else {  
                htmlObj.setAttribute("class", originalClass);
            }
        }
        setValueWarningVal(value, htmlObj, upperLimit, lowerLimit, tolerance, originalClass, warningClass){
            if (value - tolerance > upperLimit || value + tolerance < lowerLimit) {
                htmlObj.setAttribute("class", warningClass);
            } else {  
                htmlObj.setAttribute("class", originalClass);
            }
        }
        setPackWarning(value, htmlObj){
            if(value){
                htmlObj.setAttribute("class", "st0p st13p");
            } else {
                htmlObj.setAttribute("class", "warning st13p");
            }
        }

        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }


            let inletValveOpen = false;
            let outletValveOpen = false;
            let safetyValveOpen = false;

            //set active system visibility
            

            //psi delta gauge
            let pressureDelta = SimVar.GetSimVarValue("PRESSURIZATION PRESSURE DIFFERENTIAL", "Pounds per square foot") / 144;
            const pressureDeltaInt = parseInt(pressureDelta);
            const pressureDeltaDecimal = parseInt((pressureDelta - pressureDeltaInt) * 10);
            
            if(Math.abs(pressureDelta) < 0.05){
                pressureDelta = 0
            }
            
            if(pressureDelta >= 0) {
                this.htmlPsiInt.textContent = pressureDeltaInt + ".";
                this.htmlPsiDecimal.textContent = pressureDeltaDecimal;
            } else {
                this.htmlPsiInt.textContent = "-0.";
                this.htmlPsiDecimal.textContent = Math.abs(pressureDeltaDecimal);
            }
            
            this.htmlPsiIndicator.setAttribute("style", "transform-origin: 100px 152.5px; transform: rotate(" + (pressureDelta * 19.375) + "deg); stroke-width: 3px; stroke-linecap: round;");

            //cabin v/s gauge
            let cabinVSValue = SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE RATE", "feet per second") * 60;

            if(Math.abs(cabinVSValue) < 15){
                cabinVSValue = 0;
            }
            
            this.htmlCabinVSValue.textContent = parseInt(cabinVSValue);
            this.htmlCabinVSIndicator.setAttribute("style", "transform-origin: 100px 152.5px; transform: rotate(" + (cabinVSValue * 0.045) + "deg); stroke-width: 3px; stroke-linecap: round;");

            //cabin alt gauge
            const cabinAltitude = SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet");

            this.htmlCabinAltValue.textContent = parseInt(cabinAltitude);
            this.htmlCabinAltIndicator.setAttribute("style", "transform-origin: 100px 152.5px; transform: rotate(" + (cabinAltitude * 0.0164) + "deg); stroke-width: 3px; stroke-linecap: round;");
            
            //ldg elev
            const ldgElevMode = SimVar.GetSimVarValue("L:A32NX_OVHD_CABINPRESS_MODESEL", "bool");
            const ldgElevValue = SimVar.GetSimVarValue("L:A32NX_OVHD_CABINPRESS_LDGELEV", "percent");
            let time;
            
            //pressing switch to MAN, waiting 10 seconds and then switching back to AUTO will change active system
            if (ldgElevMode) {
                time = new Date();
                this.mseconds_2 = time.getTime();
                if (this.mseconds_2 - this.mseconds > 10000 && !this.justSwitched) {
                    this.justSwitched = true;
                }
                this.htmlLdgElevText.textContent = "MAN";
                this.htmlLdgElevText2.setAttribute("visibility", "visible");
                this.htmlLdgElevValue.textContent = parseInt(-2000 + (ldgElevValue * 190.5));     
            } else {
                time = new Date();
                this.mseconds = time.getTime();
                if (this.justSwitched) {
                    if (this.activeSystem == 1) {
                        this.htmlSystems[1].setAttribute("visibility", "visible");
                        this.htmlSystems[0].setAttribute("visibility", "hidden");
                        this.activeSystem = 2;
                    } else {
                        this.htmlSystems[0].setAttribute("visibility", "visible");
                        this.htmlSystems[1].setAttribute("visibility", "hidden");
                        this.activeSystem = 1;
                    }
                    this.justSwitched = false;
                }
                this.htmlLdgElevText.textContent = "AUTO";
                this.htmlLdgElevText2.setAttribute("visibility", "hidden");
                this.htmlLdgElevValue.textContent = "50";
            }

            

            //valve control
            const cabinVSIndicatorRot = 10 + (cabinVSValue * 0.04) 
            if(cabinVSValue > 60){
                this.htmlValveFlow.setAttribute("style", "transform-origin: 450px 450px; transform: rotate(" + cabinVSIndicatorRot + "deg); stroke-width: 3px; stroke-linecap: round;");
                outletValveOpen = true;
                inletValveOpen = false;
            } else if(cabinVSValue < -60) {
                this.htmlValveFlow.setAttribute("style", "transform-origin: 450px 450px; transform: rotate(10deg); stroke-width: 3px; stroke-linecap: round;");
                outletValveOpen = false;
                inletValveOpen = true;
            } else {
                this.htmlValveFlow.setAttribute("style", "transform-origin: 450px 450px; transform: rotate(10deg); stroke-width: 3px; stroke-linecap: round;");
                outletValveOpen = false;
                inletValveOpen = false;
            }

            if(pressureDelta > 8.2){
                safetyValveOpen = true;
            } else {
                safetyValveOpen = false;
            }

            //control valves
            if(inletValveOpen){
                this.htmlValveInlet.setAttribute("style", "fill:none; transform-origin: 180px 460px; transform: rotate(-90deg)");
            }else{
                this.htmlValveInlet.setAttribute("style", "fill:none; transform-origin: 180px 460px; transform: rotate(0deg)");
            }

            if(outletValveOpen){
                this.htmlValveOutlet.setAttribute("style", "fill:none; transform-origin: 265px 460px; transform: rotate(90deg)");
            }else{
                this.htmlValveOutlet.setAttribute("style", "fill:none; transform-origin: 265px 460px; transform: rotate(0deg)");
            }

            if(safetyValveOpen){
                this.htmlValveSafety.setAttribute("style", "fill:none; transform-origin: 550px 340px; transform: rotate(-90deg)");
            }else{
                this.htmlValveSafety.setAttribute("style", "fill:none; transform-origin: 550px 340px; transform: rotate(0deg)");
            }


            //set warnings
            const leftPackState = (SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_FAULT", "bool") == 0 && SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "bool") == 1)
            const rightPackState = (SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK2_FAULT", "bool") == 0 && SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK2_TOGGLE", "bool") == 1) 

            this.setPackWarning(leftPackState, this.htmlPackIndicatorLeft);
            this.setPackWarning(rightPackState, this.htmlPackIndicatorRight);
            
            this.setValueWarning(this.htmlCabinAltValue, 9550, 0, 0, "st0p st9p", "warning_redp st9p");
            this.setValueWarning(this.htmlCabinVSValue, 2000, -2000, 0, "st0p st9p", "warningp st9p");

            this.setValueWarningVal(pressureDelta, this.htmlPsiInt, 8.5, -0.4, 0, "st0p st9p", "warningp st9p");
            this.setValueWarningVal(pressureDelta, this.htmlPsiDecimal, 8.5, -0.4, 0, "st0p st16p", "warningp st16p");
            this.setValueWarningVal(pressureDelta, this.htmlTextSafety, 8.2, -10, 0, "st3p st9p", "warningp st9p");
        }
    }
    A320_Neo_LowerECAM_PRESS.Page = Page;

})(A320_Neo_LowerECAM_PRESS || (A320_Neo_LowerECAM_PRESS = {}));
customElements.define("a320-neo-lower-ecam-press", A320_Neo_LowerECAM_PRESS.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_PRESS.js.map