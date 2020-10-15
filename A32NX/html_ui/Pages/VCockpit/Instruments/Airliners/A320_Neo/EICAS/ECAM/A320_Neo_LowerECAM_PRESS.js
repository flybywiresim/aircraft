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

            this.mSecondsBlinkLast = 0;
            this.blinkState = 0;
            this.blinkingObjs = [];
        }

        setValueWarning(htmlObj, upperLimit, lowerLimit, tolerance, originalClass, warningClass) {
            if (htmlObj.textContent - tolerance > upperLimit || htmlObj.textContent + tolerance < lowerLimit) {
                htmlObj.setAttribute("class", warningClass);
            } else {
                htmlObj.setAttribute("class", originalClass);
            }
        }
        setValueWarningVal(value, htmlObj, upperLimit, lowerLimit, tolerance, originalClass, warningClass) {
            if (value - tolerance > upperLimit || value + tolerance < lowerLimit) {
                htmlObj.setAttribute("class", warningClass);
            } else {
                htmlObj.setAttribute("class", originalClass);
            }
        }
        setPackWarning(value, htmlObj) {
            if (value) {
                htmlObj.setAttribute("class", "st0p st13p");
            } else {
                htmlObj.setAttribute("class", "warning st13p");
            }
        }

        valueBlinker(htmlObjs, blinkInterval) {
            if (htmlObjs.length > 0) {
                const time = new Date();
                const timeCurr = time.getTime();
                if (timeCurr - this.mSecondsBlinkLast > blinkInterval) {
                    if (this.blinkState == 0) {
                        for (i = 0; i < htmlObjs.length; i++) {
                            if (htmlObjs[i]) {
                                htmlObjs[i].setAttribute("visibility", "visible");
                            }
                        }
                        this.blinkState = 1;
                    } else {
                        for (i = 0; i < htmlObjs.length; i++) {
                            if (htmlObjs[i]) {
                                htmlObjs[i].setAttribute("visibility", "hidden");
                            }
                        }
                        this.blinkState = 0;
                    }
                    this.mSecondsBlinkLast = timeCurr;
                }
            }
        }

        addHtmlObjToBlinker(htmlObj) {
            this.blinkingObjs.push(htmlObj);
        }

        removeHtmlObjFromBlinker(htmlObj) {
            const index = this.blinkingObjs.indexOf(htmlObj);
            this.blinkingObjs.splice(index, 1);
            htmlObj.setAttribute("visibility", "visible");
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

            if (Math.abs(pressureDelta) < 0.05) {
                pressureDelta = 0;
            }

            if (pressureDelta >= 0) {
                this.htmlPsiInt.textContent = pressureDeltaInt + ".";
                this.htmlPsiDecimal.textContent = pressureDeltaDecimal;
            } else {
                this.htmlPsiInt.textContent = "-0.";
                this.htmlPsiDecimal.textContent = Math.abs(pressureDeltaDecimal);
            }

            this.htmlPsiIndicator.setAttribute("style", "transform-origin: 100px 152.5px; transform: rotate(" + (pressureDelta * 19.375) + "deg); stroke-width: 3px; stroke-linecap: round;");

            //cabin v/s gauge
            let cabinVSValue = SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE RATE", "feet per second") * 60;

            if (Math.abs(cabinVSValue) < 15) {
                cabinVSValue = 0;
            }

            this.htmlCabinVSValue.textContent = parseInt(cabinVSValue);
            this.htmlCabinVSIndicator.setAttribute("style", "transform-origin: 100px 152.5px; transform: rotate(" + (cabinVSValue * 0.045) + "deg); stroke-width: 3px; stroke-linecap: round;");

            //cabin alt gauge
            const cabinAltitude = SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet");

            this.htmlCabinAltValue.textContent = parseInt(cabinAltitude);
            this.htmlCabinAltIndicator.setAttribute("style", "transform-origin: 100px 152.5px; transform: rotate(" + (cabinAltitude * 0.0164) + "deg); stroke-width: 3px; stroke-linecap: round;");

            //valve control
            const cabinVSIndicatorRot = 10 + (cabinVSValue * 0.04);
            if (cabinVSValue > 60) {
                this.htmlValveFlow.setAttribute("style", "transform-origin: 450px 450px; transform: rotate(" + cabinVSIndicatorRot + "deg); stroke-width: 3px; stroke-linecap: round;");
                outletValveOpen = true;
                inletValveOpen = false;
            } else if (cabinVSValue < -60) {
                this.htmlValveFlow.setAttribute("style", "transform-origin: 450px 450px; transform: rotate(10deg); stroke-width: 3px; stroke-linecap: round;");
                outletValveOpen = false;
                inletValveOpen = true;
            } else {
                this.htmlValveFlow.setAttribute("style", "transform-origin: 450px 450px; transform: rotate(10deg); stroke-width: 3px; stroke-linecap: round;");
                outletValveOpen = false;
                inletValveOpen = false;
            }

            if (pressureDelta > 8.2) {
                safetyValveOpen = true;
            } else {
                safetyValveOpen = false;
            }

            //control valves
            if (inletValveOpen) {
                this.htmlValveInlet.setAttribute("style", "fill:none; transform-origin: 180px 460px; transform: rotate(-90deg)");
            } else {
                this.htmlValveInlet.setAttribute("style", "fill:none; transform-origin: 180px 460px; transform: rotate(0deg)");
            }

            if (outletValveOpen) {
                this.htmlValveOutlet.setAttribute("style", "fill:none; transform-origin: 265px 460px; transform: rotate(90deg)");
            } else {
                this.htmlValveOutlet.setAttribute("style", "fill:none; transform-origin: 265px 460px; transform: rotate(0deg)");
            }

            if (safetyValveOpen) {
                this.htmlValveSafety.setAttribute("style", "fill:none; transform-origin: 550px 340px; transform: rotate(-90deg)");
            } else {
                this.htmlValveSafety.setAttribute("style", "fill:none; transform-origin: 550px 340px; transform: rotate(0deg)");
            }

            //set warnings
            const leftPackState = (SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_FAULT", "bool") == 0 && SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "bool") == 1);
            const rightPackState = (SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK2_FAULT", "bool") == 0 && SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK2_TOGGLE", "bool") == 1);
            const flightPhase = SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "value");

            if (parseInt(this.htmlCabinAltValue.textContent) >= 8800 && this.blinkingObjs.indexOf(this.htmlCabinAltValue) == -1) {
                this.addHtmlObjToBlinker(this.htmlCabinAltValue);
            } else if (parseInt(this.htmlCabinAltValue.textContent) <= 8600 && this.blinkingObjs.indexOf(this.htmlCabinAltValue) != -1) {
                this.removeHtmlObjFromBlinker(this.htmlCabinAltValue);
            }
            if (parseInt(this.htmlCabinVSValue.textContent) >= 1800 && this.blinkingObjs.indexOf(this.htmlCabinVSValue) == -1) {
                this.addHtmlObjToBlinker(this.htmlCabinVSValue);
            } else if (parseInt(this.htmlCabinVSValue.textContent) <= 1600 && this.blinkingObjs.indexOf(this.htmlCabinVSValue) != -1) {
                this.removeHtmlObjFromBlinker(this.htmlCabinVSValue);
            }
            if (flightPhase == 5 && pressureDelta >= 1.5 && this.blinkingObjs.indexOf(this.htmlPsiDecimal) == -1) {
                this.addHtmlObjToBlinker(this.htmlPsiDecimal);
                this.addHtmlObjToBlinker(this.htmlPsiInt);
            } else if (pressureDelta < 1 && this.blinkingObjs.indexOf(this.htmlPsiDecimal) != -1) {
                this.removeHtmlObjFromBlinker(this.htmlPsiDecimal);
                this.removeHtmlObjFromBlinker(this.htmlPsiInt);
            }

            this.valueBlinker(this.blinkingObjs, 500);

            this.setPackWarning(leftPackState, this.htmlPackIndicatorLeft);
            this.setPackWarning(rightPackState, this.htmlPackIndicatorRight);

            this.setValueWarning(this.htmlCabinAltValue, 9550, 0, 0, "st0p st9p", "red_warningp st9p");
            this.setValueWarning(this.htmlCabinVSValue, 2000, -20000, 0, "st0p st9p", "warningp st9p");

            this.setValueWarningVal(pressureDelta, this.htmlPsiInt, 8.5, -0.4, 0, "st0p st9p", "warningp st9p");
            this.setValueWarningVal(pressureDelta, this.htmlPsiDecimal, 8.5, -0.4, 0, "st0p st16p", "warningp st16p");
            this.setValueWarningVal(pressureDelta, this.htmlTextSafety, 8.2, -10, 0, "st3p st9p", "warningp st9p");
        }
    }
    A320_Neo_LowerECAM_PRESS.Page = Page;

})(A320_Neo_LowerECAM_PRESS || (A320_Neo_LowerECAM_PRESS = {}));
customElements.define("a320-neo-lower-ecam-press", A320_Neo_LowerECAM_PRESS.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_PRESS.js.map
