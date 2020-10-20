/** @type A320_Neo_LowerECAM_PRESS */
var A320_Neo_LowerECAM_PRESS;
(function (A320_Neo_LowerECAM_PRESS) {
    class Definitions {}
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
            this.htmlPsiIntW = this.querySelector("#psi-gauge-int-w");
            this.htmlPsiDecimalW = this.querySelector("#psi-gauge-decimal-w");
            this.htmlPsiIndicator = this.querySelector("#delta-psi-indicator");
            this.cabinPsiStatus = 0;

            this.htmlCabinVSValue = this.querySelector("#v-s-value");
            this.htmlCabinVSValueW = this.querySelector("#v-s-value-w");
            this.htmlCabinVSIndicator = this.querySelector("#v-s-indicator");
            this.cabinVSStatus = 0;

            this.htmlCabinAltValue = this.querySelector("#cabin-altitude-value");
            this.htmlCabinAltValueW = this.querySelector("#cabin-altitude-value-w");
            this.htmlCabinAltIndicator = this.querySelector("#cabin-alt-indicator");
            this.cabinAltStatus = 0;

            this.htmlValveInlet = this.querySelector("#valve-inlet");
            this.htmlValveOutlet = this.querySelector("#valve-outlet");
            this.htmlValveSafety = this.querySelector("#valve-safety");
            this.htmlValveFlow = this.querySelector("#valve-indicator");

            this.htmlTextSafety = this.querySelector("#safety-text");
            this.htmlTextSafetyW = this.querySelector("#safety-text-w");
            this.cabinSafetyTextStatus = 0;
            this.htmlPackIndicatorLeft = this.querySelector("#pack-indicator-left");
            this.htmlPackIndicatorRight = this.querySelector("#pack-indicator-right");

            this.htmlLdgElevText = this.querySelector("#ldg-elev-text");
            this.htmlLdgElevValue = this.querySelector("#ldg-elev-value");
            this.htmlMANtext = this.querySelector("#lower-man-text");
            this.htmlSYS1text = this.querySelector("#sys1-text");
            this.htmlSYS2text = this.querySelector("#sys2-text");

            this.psiDelta = SimVar.GetSimVarValue("L:A32NX_CABIN_PSI_DELTA", "psi");
            this.cabinVSRate = SimVar.GetSimVarValue("L:A32NX_CABIN_VS_RATE", "ft/min");
            this.cabinAltitude = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet");

            this.mSecondsBlinkLast = 0;
            this.blinkState = 0;
            this.blinkingObjs = [];

            this.safetyValveStatus = 0;
            this.inletValveStatus = 0;
            this.outletValveStatus = 0;
            this.valveFlowStatus = 0;
            this.manModeStatus = 0;
            this.activeSystem = 1;

            this.htmlSYS1text.setAttribute("visibility", "visible");
            this.htmlSYS2text.setAttribute("visibility", "hidden");
            this.htmlMANtext.setAttribute("visibility", "hidden");
            this.htmlTextSafetyW.setAttribute("visibility", "hidden");
            this.htmlCabinAltValueW.setAttribute("visibility", "hidden");
            this.htmlCabinVSValueW.setAttribute("visibility", "hidden");
            this.htmlPsiDecimalW.setAttribute("visibility", "hidden");
            this.htmlPsiIntW.setAttribute("visibility", "hidden");

            this.lastVSIndicatorRotValue = 0;
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

        setValue(htmlObj, newValue) {
            htmlObj.textContent = newValue;
        }

        updateValue(htmlObj, value) {
            if (value !== parseInt(htmlObj.textContent)) {
                this.setValue(htmlObj, value);
            }
        }

        updateValueTol(htmlObj, value, tolerance) {
            if (Math.abs(value - parseInt(htmlObj.textContent)) > tolerance) {
                this.setValue(htmlObj, value);
            }
        }

        updateIndicator(htmlObj, htmlObjVal, value, objStyle) {
            if (value != parseInt(htmlObjVal.textContent)) {
                htmlObj.setAttribute("style", objStyle);
            }
        }

        updateIndicatorOnOldValue(htmlObj, oldValue, value, objStyle) {
            if (value != oldValue) {
                htmlObj.setAttribute("style", objStyle);
                oldValue = value;
            }
        }

        systemSwitch() {
            const pressMode = SimVar.GetSimVarValue("L:A32NX_CAB_PRESS_MODE_MAN", "bool");

            if (pressMode && !this.manModeStatus) {
                this.manModeStatus = 1;
                this.htmlMANtext.setAttribute("visibility", "visible");
                this.manModeActiveTime = (new Date()).getTime();
            } else if (!pressMode && this.manModeStatus) {
                this.manModeStatus = 0;
                this.htmlMANtext.setAttribute("visibility", "hidden");
                if ((new Date()).getTime() - this.manModeActiveTime > 10000) {
                    if (this.activeSystem == 1) {
                        this.activeSystem = 2;
                        this.htmlSYS2text.setAttribute("visibility", "visible");
                        this.htmlSYS1text.setAttribute("visibility", "hidden");
                    } else {
                        this.activeSystem = 1;
                        this.htmlSYS2text.setAttribute("visibility", "hidden");
                        this.htmlSYS1text.setAttribute("visibility", "visible");
                    }
                }
            }
        }

        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            let inletValveOpen = false;
            let outletValveOpen = false;
            let safetyValveOpen = false;
            let cabinVSValue = SimVar.GetSimVarValue("L:A32NX_CABIN_VS_RATE", "ft/min");
            let pressureDelta = SimVar.GetSimVarValue("L:A32NX_CABIN_PSI_DELTA", "psi");

            const decimalSplit = pressureDelta.toFixed(1).split(".", 2);
            const cabinAltitude = SimVar.GetSimVarValue("L:A32NX_CABIN_PRESS_ALTITUDE", "feet");
            const leftPackState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "bool");
            const rightPackState = SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK2_TOGGLE", "bool");
            const flightPhase = SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "value");
            const landingElev = SimVar.GetSimVarValue("L:A32NX_LANDING_ELEVATION", "feet");
            const ditchingOn = SimVar.GetSimVarValue("L:A32NX_DITCHING", "bool");

            let cabinOutletIndicatorRot = 10 + cabinVSValue * 0.04;
            let cabinVSIndicatorRot = cabinVSValue * 0.045;
            let cabinAltitudeIndicatorRot = cabinAltitude * 0.0164;
            let cabinPsiDeltaIndicatorRot = pressureDelta * 19.375;

            this.psiDelta = pressureDelta;
            this.cabinVSRate = cabinVSValue;
            this.cabinAltitude = cabinAltitude;

            //set active system visibility
            this.systemSwitch();

            if (cabinPsiDeltaIndicatorRot > 175) {
                cabinPsiDeltaIndicatorRot = 175;
            } else if (cabinPsiDeltaIndicatorRot < -15) {
                cabinPsiDeltaIndicatorRot = -15;
            }

            if (cabinOutletIndicatorRot > 90) {
                cabinOutletIndicatorRot = 90;
            } else if (cabinOutletIndicatorRot < 0) {
                cabinOutletIndicatorRot = 0;
            }

            if (cabinVSIndicatorRot > 108) {
                cabinVSIndicatorRot = 108;
            } else if (cabinVSIndicatorRot < -108) {
                cabinVSIndicatorRot = -108;
            }

            if (cabinAltitudeIndicatorRot > 172) {
                cabinAltitudeIndicatorRot = 172;
            } else if (cabinAltitudeIndicatorRot < -17) {
                cabinAltitudeIndicatorRot = -17;
            }

            //psi delta gauge
            if (landingElev != -2000) {
                this.updateValue(this.htmlLdgElevText, "MAN");
                this.updateValue(this.htmlLdgElevValue, parseInt(landingElev));
            } else {
                this.updateValue(this.htmlLdgElevText, "AUTO");
                this.updateValue(this.htmlLdgElevValue, "50");
            }

            if (Math.abs(pressureDelta) < 0.05) {
                pressureDelta = 0;
            }

            if (pressureDelta >= 0) {
                this.updateValue(this.htmlPsiInt, Math.abs(decimalSplit[0]) + ".");
                this.updateValue(this.htmlPsiDecimal, decimalSplit[1]);
                this.updateValue(this.htmlPsiIntW, Math.abs(decimalSplit[0]) + ".");
                this.updateValue(this.htmlPsiDecimalW, decimalSplit[1]);
            } else {
                this.updateValue(this.htmlPsiInt, "-" + Math.abs(decimalSplit[0]) + ".");
                this.updateValue(this.htmlPsiDecimal, Math.abs(decimalSplit[1]));
                this.updateValue(this.htmlPsiIntW, "-" + Math.abs(decimalSplit[0]) + ".");
                this.updateValue(this.htmlPsiDecimalW, Math.abs(decimalSplit[1]));
            }

            this.updateIndicatorOnOldValue(this.htmlPsiIndicator, this.htmlCabinPsiValue, parseInt(pressureDelta), "transform-origin: 100px 152.5px; transform: rotate(" + cabinPsiDeltaIndicatorRot + "deg); stroke-width: 3px; stroke-linecap: round;");

            //cabin v/s gauge
            if (Math.abs(cabinVSValue) < 15) {
                cabinVSValue = 0;
            } else if (cabinVSValue > 2400) {
                cabinVSValue = 2400;
            } else if (cabinVSValue < -2400) {
                cabinVSValue = -2400;
            }

            this.updateIndicator(this.htmlCabinVSIndicator, this.htmlCabinVSValue, parseInt(cabinVSValue), "transform-origin: 100px 152.5px; transform: rotate(" + cabinVSIndicatorRot + "deg); stroke-width: 3px; stroke-linecap: round;");
            this.updateValueTol(this.htmlCabinVSValue, parseInt(cabinVSValue), 4);
            this.updateValueTol(this.htmlCabinVSValueW, parseInt(cabinVSValue), 4);

            //cabin alt gauge
            this.updateIndicator(this.htmlCabinAltIndicator, this.htmlCabinAltValue, parseInt(cabinAltitude), "transform-origin: 100px 152.5px; transform: rotate(" + cabinAltitudeIndicatorRot + "deg); stroke-width: 3px; stroke-linecap: round;");
            this.updateValueTol(this.htmlCabinAltValue, parseInt(cabinAltitude), 2);
            this.updateValueTol(this.htmlCabinAltValueW, parseInt(cabinAltitude), 2);

            //valve control
            if (cabinVSValue > 15 && !ditchingOn) {
                this.updateIndicatorOnOldValue(this.htmlValveFlow, this.lastVSIndicatorRotValue, cabinVSIndicatorRot, "transform-origin: 450px 450px; transform: rotate(" + cabinOutletIndicatorRot + "deg); stroke-width: 3px; stroke-linecap: round;");
                outletValveOpen = true;
                inletValveOpen = false;
                if (!this.valveFlowStatus) {
                    this.valveFlowStatus = 1;
                }
            } else if (cabinVSValue < -15 && !ditchingOn) {
                this.htmlValveFlow.setAttribute("style", "transform-origin: 450px 450px; transform: rotate(10deg); stroke-width: 3px; stroke-linecap: round;");
                outletValveOpen = false;
                inletValveOpen = true;
                this.valveFlowStatus = 0;
            } else if (this.valveFlowStatus) {
                this.htmlValveFlow.setAttribute("style", "transform-origin: 450px 450px; transform: rotate(10deg); stroke-width: 3px; stroke-linecap: round;");
                outletValveOpen = false;
                inletValveOpen = false;
                this.valveFlowStatus = 0;
            }

            if (pressureDelta > 1 && !ditchingOn) {
                safetyValveOpen = true;
            } else {
                safetyValveOpen = false;
            }

            //control valves
            if (inletValveOpen && !this.inletValveStatus && !ditchingOn) {
                this.htmlValveInlet.setAttribute("style", "fill:none; transform-origin: 180px 460px; transform: rotate(-90deg)");
                this.inletValveStatus = 1;
            } else if (!inletValveOpen && this.inletValveStatus) {
                this.htmlValveInlet.setAttribute("style", "fill:none; transform-origin: 180px 460px; transform: rotate(0deg)");
                this.inletValveStatus = 0;
            }

            if (outletValveOpen && !this.outletValveStatus && !ditchingOn) {
                this.htmlValveOutlet.setAttribute("style", "fill:none; transform-origin: 265px 460px; transform: rotate(90deg)");
                this.outletValveStatus = 1;
            } else if (!outletValveOpen && this.outletValveStatus) {
                this.htmlValveOutlet.setAttribute("style", "fill:none; transform-origin: 265px 460px; transform: rotate(0deg)");
                this.outletValveStatus = 0;
            }

            if (safetyValveOpen && !this.safetyValveStatus && !ditchingOn) {
                this.htmlValveSafety.setAttribute("style", "fill:none; transform-origin: 550px 340px; transform: rotate(-90deg)");
                this.safetyValveStatus = 1;
            } else if (!safetyValveOpen && this.safetyValveStatus) {
                this.htmlValveSafety.setAttribute("style", "fill:none; transform-origin: 550px 340px; transform: rotate(0deg)");
                this.safetyValveStatus = 0;
            }

            //set warnings
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

            if (this.cabinAltitude >= 9550) {
                this.htmlCabinAltValue.setAttribute("visibility", "hidden");
                this.htmlCabinAltValueW.setAttribute("visibility", "visible");
                this.cabinAltStatus = 1;
            } else if (this.cabinAltStatus && this.cabinAltitude < 9550) {
                this.htmlCabinAltValue.setAttribute("visibility", "visible");
                this.htmlCabinAltValueW.setAttribute("visibility", "hidden");
                this.cabinAltStatus = 0;
            }

            if (this.cabinVSRate >= 2000 || this.cabinVSRate <= -2000) {
                this.htmlCabinVSValueW.setAttribute("visibility", "visible");
                this.htmlCabinVSValue.setAttribute("visibility", "hidden");
                this.cabinVSStatus = 1;
            } else if (this.cabinVSRate < 2000 && this.cabinVSRate > -2000 && this.cabinVSStatus) {
                this.htmlCabinVSValue.setAttribute("visibility", "visible");
                this.htmlCabinVSValueW.setAttribute("visibility", "hidden");
                this.cabinVSStatus = 0;
            }

            if ((this.psiDelta >= 8.5 || this.psiDelta <= -0.4) && !this.cabinPsiStatus) {
                this.htmlPsiDecimal.setAttribute("visibility", "hidden");
                this.htmlPsiDecimalW.setAttribute("visibility", "visible");
                this.htmlPsiInt.setAttribute("visibility", "hidden");
                this.htmlPsiIntW.setAttribute("visibility", "visible");
                this.cabinPsiStatus = 1;
            } else if (this.psiDelta < 8.5 && this.psiDelta > -0.4 && this.cabinPsiStatus) {
                this.htmlPsiDecimalW.setAttribute("visibility", "hidden");
                this.htmlPsiDecimal.setAttribute("visibility", "visible");
                this.htmlPsiIntW.setAttribute("visibility", "hidden");
                this.htmlPsiInt.setAttribute("visibility", "visible");
                this.cabinPsiStatus = 0;
            }

            if (this.psiDelta >= 8.2 && !this.cabinSafetyTextStatus) {
                this.htmlTextSafetyW.setAttribute("visibility", "visible");
                this.htmlTextSafety.setAttribute("visibility", "hidden");
                this.cabinSafetyTextStatus = 1;
            } else if (this.psiDelta < 8.2 && this.cabinSafetyTextStatus){
                this.htmlTextSafety.setAttribute("visibility", "visible");
                this.htmlTextSafetyW.setAttribute("visibility", "hidden");
                this.cabinSafetyTextStatus = 0;
            }
        }
    }
    A320_Neo_LowerECAM_PRESS.Page = Page;
})(A320_Neo_LowerECAM_PRESS || (A320_Neo_LowerECAM_PRESS = {}));
customElements.define("a320-neo-lower-ecam-press", A320_Neo_LowerECAM_PRESS.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_PRESS.js.map