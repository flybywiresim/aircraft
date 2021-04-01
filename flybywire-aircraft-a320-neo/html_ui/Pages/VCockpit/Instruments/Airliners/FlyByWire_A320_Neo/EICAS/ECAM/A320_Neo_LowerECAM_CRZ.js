/** @type A320_Neo_LowerECAM_CRZ */
var A320_Neo_LowerECAM_CRZ;
(function (A320_Neo_LowerECAM_CRZ) {
    class Definitions {
    }
    Definitions.feetToMeters = 0.3048;
    Definitions.seaLevelPressurePascal = 101325;
    Definitions.barometricPressureFactor = -0.00011857591;
    Definitions.pascalToPSI = 0.000145038;
    Definitions.inHgToPSI = 0.491154;
    A320_Neo_LowerECAM_CRZ.Definitions = Definitions;
    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() {
            return "LowerECAMCRZTemplate";
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.unitConversion = parseFloat(NXDataStore.get("CONFIG_USING_METRIC_UNIT", "1"));

            // Set units
            this.querySelector("#FuelUsedUnit").textContent = this.unitConversion === 1 ? "KG" : "LBS";

            // Get value fields
            this.FuelUsedTotal = this.querySelector("#FuelUsedTotal");
            this.FuelUsedLeft = this.querySelector("#FuelUsedLeft");
            this.FuelUsedRight = this.querySelector("#FuelUsedRight");

            this.OilQuantityLeft = this.querySelector("#OilQuantityLeft");
            this.OilQuantityLeftDecimal = this.querySelector("#OilQuantityLeftDecimal");
            this.OilQuantityRight = this.querySelector("#OilQuantityRight");
            this.OilQuantityRightDecimal = this.querySelector("#OilQuantityRightDecimal");

            this.VibN1Left = this.querySelector("#VibN1Left");
            this.VibN1LeftDecimal = this.querySelector("#VibN1LeftDecimal");
            this.VibN1Right = this.querySelector("#VibN1Right");
            this.VibN1RightDecimal = this.querySelector("#VibN1RightDecimal");

            this.VibN2Left = this.querySelector("#VibN2Left");
            this.VibN2LeftDecimal = this.querySelector("#VibN2LeftDecimal");
            this.VibN2Right = this.querySelector("#VibN2Right");
            this.VibN2RightDecimal = this.querySelector("#VibN2RightDecimal");

            this.LandingElevationTitle = this.querySelector("#LandingElevationTitle");
            this.LandingElevationMode = this.querySelector("#LandingElevationMode");
            this.LandingElevation = this.querySelector("#LandingElevation");
            this.LandingElevationUnit = this.querySelector("#LandingElevationUnit");

            this.DeltaPressure = this.querySelector("#DeltaPressure");
            this.DeltaPressureDecimal = this.querySelector("#DeltaPressureDecimal");

            this.CabinVerticalSpeed = this.querySelector("#CabinVerticalSpeed");
            this.CabinAltitude = this.querySelector("#CabinAltitude");

            this.CockpitTemp = this.querySelector("#CockpitTemp");
            this.ForwardTemp = this.querySelector("#ForwardTemp");
            this.AftTemp = this.querySelector("#AftTemp");

            this.CockpitTempValue = 0.0;
            this.ForwardTempValue = 0.0;
            this.AftTempValue = 0.0;

            this.condTemp = [
                {
                    varName: "L:A32NX_CKPT_TEMP",
                    type: "celsius",
                    selector: this.CockpitTemp,
                    value: this.CockpitTempValue,
                    index: 1
                },
                {
                    varName: "L:A32NX_FWD_TEMP",
                    type: "celsius",
                    selector: this.ForwardTemp,
                    value: this.ForwardTempValue,
                    index : 2
                },
                {
                    varName: "L:A32NX_AFT_TEMP",
                    type: "celsius",
                    selector: this.AftTemp,
                    value: this.AftTempValue,
                    index: 3
                },
            ];

            this.condTemp.forEach(this._condTempSelector);

            // Initialize displayed values
            this.LeftConsumptionDisplayed = -1;
            this.RightConsumptionDisplayed = -1;
            this.TotalConsumptionDisplayed = -1;

            this.OilQuantityLeftDisplayed = -1;
            this.OilQuantityRightDisplayed = -1;

            this.VibN1LeftDisplayed = -1;
            this.VibN1RightDisplayed = -1;

            this.CabinVerticalSpeedDisplayed = -1;
            this.CabinAltitudeDisplayed = -1;
            this.OutsidePressureDisplayed = -1;

            this.oldManMode = 0;

            this.updateThrottler = new UpdateThrottler(500);

            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised || !A320_Neo_EICAS.isOnBottomScreen()) {
                return;
            }
            if (this.updateThrottler.canUpdate(_deltaTime) === -1) {
                return;
            }
            // Fuel
            const leftConsumption = SimVar.GetSimVarValue("L:A32NX_FUEL_USED:1", "number") * this.unitConversion;
            const rightConsumption = SimVar.GetSimVarValue("L:A32NX_FUEL_USED:2", "number") * this.unitConversion;

            const leftConsumptionShown = fastToFixed(leftConsumption - (leftConsumption % 10), 0);
            const rightConsumptionShown = fastToFixed(rightConsumption - (rightConsumption % 10), 0);

            if ((leftConsumptionShown !== this.LeftConsumptionDisplayed) || (rightConsumptionShown !== this.RightConsumptionDisplayed)) {
                const totalConsumptionShown = parseInt(leftConsumptionShown) + parseInt(rightConsumptionShown);
                this.FuelUsedTotal.textContent = totalConsumptionShown;
                this.FuelUsedLeft.textContent = leftConsumptionShown;
                this.FuelUsedRight.textContent = rightConsumptionShown;

                this.LeftConsumptionDisplayed = leftConsumptionShown;
                this.RightConsumptionDisplayed = rightConsumptionShown;
            }

            // Oil
            let value = SimVar.GetSimVarValue("ENG OIL QUANTITY:1", "percent") * 0.01 * 25;
            let valueShown = fastToFixed(value, 1);
            if (valueShown != this.OilQuantityLeftDisplayed) {
                const decimalSplit = value.toFixed(1).split(".", 2);
                this.OilQuantityLeft.textContent = decimalSplit[0] + ".";
                this.OilQuantityLeftDecimal.textContent = decimalSplit[1];
                this.OilQuantityLeftDisplayed = valueShown;
            }

            value = SimVar.GetSimVarValue("ENG OIL QUANTITY:2", "percent") * 0.01 * 25;
            valueShown = fastToFixed(value, 1);
            if (valueShown != this.OilQuantityRightDisplayed) {
                const decimalSplit = value.toFixed(1).split(".", 2);
                this.OilQuantityRight.textContent = decimalSplit[0] + ".";
                this.OilQuantityRightDecimal.textContent = decimalSplit[1];
                this.OilQuantityRightDisplayed = valueShown;
            }

            // Engines
            value = SimVar.GetSimVarValue("TURB ENG VIBRATION:1", "Number");
            if (value < 0) {
                value = 0.0;
            }
            valueShown = fastToFixed(value, 1);
            if (valueShown != this.VibN1LeftDisplayed) {
                const decimalSplit = value.toFixed(1).split(".", 2);
                this.VibN1Left.textContent = decimalSplit[0] + ".";
                this.VibN1LeftDecimal.textContent = decimalSplit[1];
                this.VibN2Left.textContent = decimalSplit[0] + "."; // There currently exists no SimVar for N2
                this.VibN2LeftDecimal.textContent = decimalSplit[1];
                this.VibN1LeftDisplayed = valueShown;
            }

            value = SimVar.GetSimVarValue("TURB ENG VIBRATION:2", "Number");
            if (value < 0) {
                value = 0.0;
            }
            valueShown = fastToFixed(value, 1);
            if (valueShown != this.VibN1RightDisplayed) {
                const decimalSplit = value.toFixed(1).split(".", 2);
                this.VibN1Right.textContent = decimalSplit[0] + ".";
                this.VibN1RightDecimal.textContent = decimalSplit[1];
                this.VibN2Right.textContent = decimalSplit[0] + "."; // Same here
                this.VibN2RightDecimal.textContent = decimalSplit[1];
                this.VibN1RightDisplayed = valueShown;
            }

            // Landing elevation
            const manMode = SimVar.GetSimVarValue("L:A32NX_CAB_PRESS_MODE_MAN", "Bool");

            if (manMode && !this.oldManMode) {
                this.LandingElevationTitle.setAttribute("visibility", "hidden");
                this.LandingElevationMode.setAttribute("visibility", "hidden");
                this.LandingElevation.setAttribute("visibility", "hidden");
                this.LandingElevationUnit.setAttribute("visibility", "hidden");
                this.oldManMode = 1;
            } else if (!manMode && this.oldManMode) {
                this.LandingElevationTitle.setAttribute("visibility", "visible");
                this.LandingElevationMode.setAttribute("visibility", "visible");
                this.LandingElevation.setAttribute("visibility", "visible");
                this.LandingElevationUnit.setAttribute("visibility", "visible");
                this.oldManMode = 0;
            }

            // Cabin pressure
            value = SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE RATE", "feet per second");
            valueShown = fastToFixed(value, 0);
            if (valueShown != this.CabinVerticalSpeedDisplayed) {
                const feet_per_minute = valueShown * 60;
                this.CabinVerticalSpeed.textContent = feet_per_minute;
                this.CabinVerticalSpeedDisplayed = valueShown;
            }

            value = SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet");
            valueShown = fastToFixed(value, 0);
            if (valueShown != this.CabinAltitudeDisplayed) {
                this.CabinAltitude.textContent = valueShown;
                this.CabinAltitudeDisplayed = valueShown;
            }

            const outsidePressureINHG = SimVar.GetSimVarValue("AMBIENT PRESSURE", "inHg");

            if ((valueShown != this.CabinAltitudeDisplayed) || (outsidePressureINHG != this.OutsidePressureDisplayed)) {
                const cabinAltMeters = value * Definitions.feetToMeters;
                const cabinPressurePascal = Definitions.seaLevelPressurePascal * Math.exp(Definitions.barometricPressureFactor * cabinAltMeters); // Barometric formula
                const cabinPressurePSI = cabinPressurePascal * Definitions.pascalToPSI;
                const outsidePressurePSI = outsidePressureINHG * Definitions.inHgToPSI;
                let pressureDiff = cabinPressurePSI - outsidePressurePSI;

                if ((pressureDiff > -0.05) && (pressureDiff < 0)) {
                    pressureDiff = 0; // Prevent it showing -0.0
                }

                const decimalSplit = pressureDiff.toFixed(1).split(".", 2);

                this.DeltaPressure.textContent = decimalSplit[0] + ".";
                this.DeltaPressureDecimal.textContent = decimalSplit[1];

                this.CabinAltitudeDisplayed = valueShown;
                this.OutsidePressureDisplayed = outsidePressureINHG;
            }

            this.condTemp.forEach(this._condTempSelector);

        }
        _condTempSelector({varName, type, selector, value, index}) {
            const currentValue = SimVar.GetSimVarValue(varName, type);
            if (currentValue != value) {
                selector.textContent = parseInt(currentValue);
            }
        }
    }
    A320_Neo_LowerECAM_CRZ.Page = Page;

})(A320_Neo_LowerECAM_CRZ || (A320_Neo_LowerECAM_CRZ = {}));
customElements.define("a320-neo-lower-ecam-crz", A320_Neo_LowerECAM_CRZ.Page);
