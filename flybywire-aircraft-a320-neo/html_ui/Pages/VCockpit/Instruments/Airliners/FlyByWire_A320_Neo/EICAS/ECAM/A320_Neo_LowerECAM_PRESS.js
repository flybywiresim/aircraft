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
            this.htmlPackIndicatorLeftText = this.querySelector("#pack-indicator-left-text");
            this.htmlPackIndicatorRightText = this.querySelector("#pack-indicator-right-text");

            this.htmlLdgElevText = this.querySelector("#ldg-elev-text");
            this.htmlLdgElevValue = this.querySelector("#ldg-elev-value");
            this.htmlLdgElevTitle = this.querySelector("#ldg-elev-title");
            this.htmlLdgElevValueUnit = this.querySelector("#ldg-elev-value-unit");
            this.htmlMANtext = this.querySelector("#lower-man-text");
            this.htmlSYS1text = this.querySelector("#sys1-text");
            this.htmlSYS2text = this.querySelector("#sys2-text");

            //blinker values
            this.mSecondsBlinkLast = 0;
            this.blinkState = 0;
            this.blinkingObjs = [];

            //old values
            this.oldCabinVSValue = 0;
            this.oldCabinAltitudeValue = 0;
            this.oldCabinPsiDeltaIntValue = 0;
            this.oldCabinPsiDeltaDecValue = 0;

            this.oldVSIndicatorRot = 0;
            this.oldCabinAltitudeIndicatorRot = 0;
            this.oldPsiDeltaIndicatorRot = 0;
            this.oldOutletIndicatorRot = 0;

            this.oldInletValue = 0;
            this.oldOutletValue = 0;
            this.oldSafetyValue = 0;

            this.oldLandingElev = 0;
            this.oldLandingElevText = "AUTO";
            this.oldActiveSystemValue = 0;
            this.oldManModValue = 0;

            //set initial visibility
            this.htmlSYS1text.setAttribute("visibility", "visible");
            this.htmlSYS2text.setAttribute("visibility", "hidden");
            this.htmlMANtext.setAttribute("visibility", "hidden");
            this.htmlTextSafety.setAttribute("visibility", "visible");
            this.htmlCabinAltValue.setAttribute("visibility", "visible");
            this.htmlCabinVSValue.setAttribute("visibility", "visible");
            this.htmlPsiDecimal.setAttribute("visibility", "visible");
            this.htmlPsiInt.setAttribute("visibility", "visible");

            this.updateThrottler = new UpdateThrottler(200);
        }

        //sets the packs to warning color
        setPackWarning(value, htmlObj, htmlObjText) {
            if (value) {
                htmlObj.setAttribute("class", "warningp st13p");
                htmlObjText.setAttribute("class", "warningp st9p");
            } else {
                htmlObj.setAttribute("class", "st0p st13p");
                htmlObjText.setAttribute("class", "st3p st9p");
            }
        }

        valueBlinker(htmlObjs, blinkInterval) {
            if (htmlObjs.length > 0) {
                const time = new Date();
                const timeCurr = time.getTime();
                if (timeCurr - this.mSecondsBlinkLast > blinkInterval) {
                    if (this.blinkState == 0) {
                        for (let i = 0; i < htmlObjs.length; i++) {
                            if (htmlObjs[i]) {
                                htmlObjs[i].setAttribute("visibility", "visible");
                            }
                        }
                        this.blinkState = 1;
                    } else {
                        for (let i = 0; i < htmlObjs.length; i++) {
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

        updateValue(htmlObj, oldValue, newValue) {
            if (newValue !== oldValue) {
                this.setValue(htmlObj, newValue);
                return newValue;
            }
            return oldValue;
        }

        updateIndicator(htmlObj, oldValue, newValue) {
            if (newValue !== oldValue) {
                htmlObj.setAttribute("style", "transform-origin: 100px 150px; transform: rotate(" + newValue + "deg); stroke-width: 3px; stroke-linecap: round;");
                return newValue;
            }
            return oldValue;
        }

        updateFlowIndicator(htmlObj, oldValue, newValue) {
            if (newValue !== oldValue) {
                htmlObj.setAttribute("style", "transform-origin:450px 450px; transform: rotate(" + newValue + "deg); stroke-width: 3px; stroke-linecap: round;");
                return newValue;
            }
            return oldValue;
        }

        updateValve(htmlObj, oldValue, newValue, center, openRot) {
            if (newValue !== oldValue) {
                if (newValue == 1) {
                    htmlObj.setAttribute("style", "transform-origin: " + center + "; transform: rotate(" + openRot + "deg);");
                } else if (newValue == 0.5) {
                    htmlObj.setAttribute("style", "transform-origin: " + center + "; transform: rotate(" + fastToFixed(openRot / 2, 0) + "deg);");
                } else {
                    htmlObj.setAttribute("style", "transform-origin: " + center + "; transform: rotate(0deg);");
                }
                return newValue;
            }
            return oldValue;
        }

        setWarning(condition, htmlObj, warningClass, originalClass) {
            if (condition) {
                htmlObj.setAttribute("class", warningClass);
            } else {
                htmlObj.setAttribute("class", originalClass);
            }
        }

        setMaxIndicatorRotation(indicatorValue, constant, offset, maxRot, minRot) {
            let indicatorRot = offset + indicatorValue * constant;
            if (indicatorRot > maxRot) {
                indicatorRot = maxRot;
            } else if (indicatorRot < minRot) {
                indicatorRot = minRot;
            }
            return indicatorRot;
        }

        update(_deltaTime) {
            if (!this.isInitialised || !A320_Neo_EICAS.isOnBottomScreen()) {
                return;
            }
            if (this.updateThrottler.canUpdate(_deltaTime) === -1) {
                return;
            }
            const inletValvePosition = SimVar.GetSimVarValue("L:VENT_INLET_VALVE", "Percent");
            const outletValvePosition = SimVar.GetSimVarValue("L:VENT_OUTLET_VALVE", "Percent");
            const safetyValvePosition = (SimVar.GetSimVarValue("L:A32NX_PRESS_SAFETY_VALVE_OPEN_PERCENTAGE", "Percent") / 100).toFixed(0);
            const activeSystem = SimVar.GetSimVarValue("L:A32NX_PRESS_ACTIVE_CPC_SYS", "Number");

            const cabinVSValue = SimVar.GetSimVarValue("L:A32NX_PRESS_CABIN_VS", "Feet per minute");
            const pressureDelta = Math.round(SimVar.GetSimVarValue("L:A32NX_PRESS_CABIN_DELTA_PRESSURE", "PSI") * 10) / 10;
            const cabinAltitude = SimVar.GetSimVarValue("L:A32NX_PRESS_CABIN_ALTITUDE", "feet");
            const pressureDeltaDecimalSplit = pressureDelta.toFixed(1).split(".", 2);
            const outletValveOpenPercent = SimVar.GetSimVarValue("L:A32NX_PRESS_OUTFLOW_VALVE_OPEN_PERCENTAGE", "Percent");

            const leftPackState = ((!SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK1_TOGGLE", "bool") || SimVar.GetSimVarValue("L:A32NX_OVHD_PRESS_DITCHING_PB_IS_ON", "bool")) && SimVar.GetSimVarValue("ENG COMBUSTION:1", "Bool"));
            const rightPackState = ((!SimVar.GetSimVarValue("L:A32NX_AIRCOND_PACK2_TOGGLE", "bool") || SimVar.GetSimVarValue("L:A32NX_OVHD_PRESS_DITCHING_PB_IS_ON", "bool")) && SimVar.GetSimVarValue("ENG COMBUSTION:2", "Bool"));
            let landingElev;
            let landingElevManual;
            if (SimVar.GetSimVarValue("L:XMLVAR_KNOB_OVHD_CABINPRESS_LDGELEV", "number") !== 0) {
                landingElev = SimVar.GetSimVarValue("L:A32NX_OVHD_PRESS_LDG_ELEV_KNOB", "feet");
                landingElevManual = true;
            } else {
                landingElev = SimVar.GetSimVarValue("L:A32NX_PRESS_AUTO_LANDING_ELEVATION", "feet");
                landingElevManual = false;
            }
            const flightPhase = SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "int");
            const manMode = !SimVar.GetSimVarValue("L:A32NX_OVHD_PRESS_MODE_SEL_PB_IS_AUTO", "Bool");

            const cabinOutletIndicatorRot = this.setMaxIndicatorRotation(outletValveOpenPercent, 0.9, 10, 90, 0);
            const cabinVSIndicatorRot = this.setMaxIndicatorRotation(cabinVSValue, 0.045, 0, 108, -108);
            const cabinAltitudeIndicatorRot = this.setMaxIndicatorRotation(cabinAltitude, 0.0164, 0, 172, -17);
            const cabinPsiDeltaIndicatorRot = this.setMaxIndicatorRotation(pressureDelta, 20, 0, 175, -15);

            //update values
            this.oldCabinAltitudeValue = this.updateValue(this.htmlCabinAltValue, this.oldCabinAltitudeValue, Math.round(cabinAltitude / 50) * 50);
            this.oldCabinVSValue = this.updateValue(this.htmlCabinVSValue, this.oldCabinVSValue, Math.round(cabinVSValue / 50) * 50);

            if (pressureDelta < 0) {
                this.oldCabinPsiDeltaIntValue = this.updateValue(this.htmlPsiInt, this.oldCabinPsiDeltaIntValue, "-" + Math.abs(pressureDeltaDecimalSplit[0]) + ".");
            } else {
                this.oldCabinPsiDeltaIntValue = this.updateValue(this.htmlPsiInt, this.oldCabinPsiDeltaIntValue, Math.abs(pressureDeltaDecimalSplit[0]) + ".");
            }

            this.oldCabinPsiDeltaDecValue = this.updateValue(this.htmlPsiDecimal, this.oldCabinPsiDeltaDecValue, Math.abs(pressureDeltaDecimalSplit[1]));

            //update indicators
            this.oldCabinAltitudeIndicatorRot = this.updateIndicator(this.htmlCabinAltIndicator, this.oldCabinAltitudeIndicatorRot, cabinAltitudeIndicatorRot);
            this.oldVSIndicatorRot = this.updateIndicator(this.htmlCabinVSIndicator, this.oldVSIndicatorRot, cabinVSIndicatorRot);
            this.oldOutletIndicatorRot = this.updateFlowIndicator(this.htmlValveFlow, this.oldOutletIndicatorRot, cabinOutletIndicatorRot);
            this.oldPsiDeltaIndicatorRot = this.updateIndicator(this.htmlPsiIndicator, this.oldPsiDeltaIndicatorRot, cabinPsiDeltaIndicatorRot);

            //set warnings
            this.setWarning((pressureDelta >= 8.5 || pressureDelta <= -0.4), this.htmlPsiInt, "warningp st9p", "st0p st9p");
            this.setWarning((pressureDelta >= 8.5 || pressureDelta <= -0.4), this.htmlPsiDecimal, "warningp st9p", "st0p st9p");
            this.setWarning((Math.abs(cabinVSValue) >= 2000), this.htmlCabinVSValue, "warningp st9p", "st0p st9p");
            this.setWarning((cabinAltitude >= 9550), this.htmlCabinAltValue, "red_warningp st9p", "st0p st9p");

            this.setWarning(inletValvePosition === 0.5, this.htmlValveInlet, "warning st14p", "st0p st14p");
            this.setWarning(outletValvePosition === 0.5, this.htmlValveOutlet, "warning st14p", "st0p st14p");
            this.setWarning(safetyValvePosition === 0.5, this.htmlValveSafety, "warning st14p", "st0p st14p");

            this.setPackWarning(leftPackState, this.htmlPackIndicatorLeft, this.htmlPackIndicatorLeftText);
            this.setPackWarning(rightPackState, this.htmlPackIndicatorRight, this.htmlPackIndicatorRightText);

            //open or close valves
            this.oldInletValue = this.updateValve(this.htmlValveInlet, this.oldInletValue, inletValvePosition, "180px 460px", -90);
            this.oldOutletValue = this.updateValve(this.htmlValveOutlet, this.oldOutletValue, outletValvePosition, "265px 460px", 90);
            this.oldSafetyValue = this.updateValve(this.htmlValveSafety, this.oldSafetyValue, safetyValvePosition, "550px 340px", -90);

            //landing elev
            if (landingElevManual) {
                this.oldLandingElev = this.updateValue(this.htmlLdgElevValue, this.oldLandingElev, fastToFixed(landingElev, 0));
                this.oldLandingElevText = this.updateValue(this.htmlLdgElevText, this.oldLandingElevText, "MAN");
            } else {
                this.oldLandingElev = this.updateValue(this.htmlLdgElevValue, this.oldLandingElev, fastToFixed(landingElev, 0));
                this.oldLandingElevText = this.updateValue(this.htmlLdgElevText, this.oldLandingElevText, "AUTO");
            }

            if (activeSystem == 1 && this.oldActiveSystemValue != 1 && !manMode) {
                this.htmlSYS1text.setAttribute("visibility", "visible");
                this.htmlSYS2text.setAttribute("visibility", "hidden");
                this.oldActiveSystemValue = 1;
            } else if (activeSystem == 2 && this.oldActiveSystemValue != 2 && !manMode) {
                this.htmlSYS2text.setAttribute("visibility", "visible");
                this.htmlSYS1text.setAttribute("visibility", "hidden");
                this.oldActiveSystemValue = 2;
            }

            if (manMode && !this.oldManModValue) {
                this.htmlMANtext.setAttribute("visibility", "visible");
                this.htmlLdgElevText.setAttribute("visibility", "hidden");
                this.htmlLdgElevValue.setAttribute("visibility", "hidden");
                this.htmlLdgElevTitle.setAttribute("visibility", "hidden");
                this.htmlLdgElevValueUnit.setAttribute("visibility", "hidden");
                this.htmlSYS1text.setAttribute("visibility", "hidden");
                this.htmlSYS2text.setAttribute("visibility", "hidden");
                this.oldManModValue = 1;
            } else if (!manMode && this.oldManModValue) {
                this.htmlMANtext.setAttribute("visibility", "hidden");
                this.htmlLdgElevText.setAttribute("visibility", "visible");
                this.htmlLdgElevValue.setAttribute("visibility", "visible");
                this.htmlLdgElevTitle.setAttribute("visibility", "visible");
                this.htmlLdgElevValueUnit.setAttribute("visibility", "visible");
                if (activeSystem === 1) {
                    this.htmlSYS1text.setAttribute("visibility", "visible");
                } else {
                    this.htmlSYS2text.setAttribute("visibility", "visible");
                }
                this.oldManModValue = 0;
            }

            //set blink warnings
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
            if (flightPhase == 7 && pressureDelta >= 1.5 && this.blinkingObjs.indexOf(this.htmlPsiDecimal) == -1) {
                this.addHtmlObjToBlinker(this.htmlPsiDecimal);
                this.addHtmlObjToBlinker(this.htmlPsiInt);
            } else if (pressureDelta < 1 && this.blinkingObjs.indexOf(this.htmlPsiDecimal) != -1) {
                this.removeHtmlObjFromBlinker(this.htmlPsiDecimal);
                this.removeHtmlObjFromBlinker(this.htmlPsiInt);
            }

            this.valueBlinker(this.blinkingObjs, 500);
        }
    }
    A320_Neo_LowerECAM_PRESS.Page = Page;
})(A320_Neo_LowerECAM_PRESS || (A320_Neo_LowerECAM_PRESS = {}));
customElements.define("a320-neo-lower-ecam-press", A320_Neo_LowerECAM_PRESS.Page);
