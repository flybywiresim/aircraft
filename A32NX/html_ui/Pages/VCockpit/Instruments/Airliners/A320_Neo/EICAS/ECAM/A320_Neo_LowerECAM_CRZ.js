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
        get templateID() { return "LowerECAMCRZTemplate"; }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }
        init() {
            this.pressureDiff = 0;
            this.cumulatedPressure = 0;
            this.numberOfPressureReadings = 0;
            this.cumulatedTime = 1000;
           
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

            this.LandingElevationMode = this.querySelector("#LandingElevationMode");
            this.LandingElevation = this.querySelector("#LandingElevation");

            this.DeltaPressure = this.querySelector("#DeltaPressure");
            this.DeltaPressureDecimal = this.querySelector("#DeltaPressureDecimal");

            this.CabinVerticalSpeed = this.querySelector("#CabinVerticalSpeed");
            this.CabinAltitude = this.querySelector("#CabinAltitude");

            this.CockpitTemp = this.querySelector("#CockpitTemp");
            this.ForwardTemp = this.querySelector("#ForwardTemp");
            this.AftTemp = this.querySelector("#AftTemp");

            this.isInitialised = true;
        }
        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }
            
            // Fuel
            var unitFactor = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "lbs");
            if (BaseAirliners.unitIsMetric(Aircraft.A320_NEO)) {
                unitFactor = SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilogram");
            }
            let leftConsumption = SimVar.GetSimVarValue("GENERAL ENG FUEL USED SINCE START:1", "gallon") * unitFactor * 0.001;
            let rightConsumption = SimVar.GetSimVarValue("GENERAL ENG FUEL USED SINCE START:2", "gallon") * unitFactor * 0.001;

            this.FuelUsedTotal.textContent = Math.floor(leftConsumption)+Math.floor(rightConsumption);
            this.FuelUsedLeft.textContent = Math.floor(leftConsumption);
            this.FuelUsedRight.textContent = Math.floor(rightConsumption);

            // Oil
            let value = SimVar.GetSimVarValue("ENG OIL QUANTITY:1", "percent") * 0.01 * 25;
            this.OilQuantityLeft.textContent = Math.floor(value) + ".";
            this.OilQuantityLeftDecimal.textContent = value.toFixed(1).split(".", 2)[1];

            value = SimVar.GetSimVarValue("ENG OIL QUANTITY:2", "percent") * 0.01 * 25;
            this.OilQuantityRight.textContent = Math.floor(value) + ".";
            this.OilQuantityRightDecimal.textContent = value.toFixed(1).split(".", 2)[1];

            // Engines
            value = SimVar.GetSimVarValue("TURB ENG VIBRATION:1", "Number");
            if (value < 0) value = 0.0;
            this.VibN1Left.textContent = Math.floor(value) + ".";
            this.VibN1LeftDecimal.textContent = value.toFixed(1).split(".", 2)[1];

            value = SimVar.GetSimVarValue("TURB ENG VIBRATION:2", "Number");
            if (value < 0) value = 0.0;
            this.VibN1Right.textContent = Math.floor(value) + ".";
            this.VibN1RightDecimal.textContent = value.toFixed(1).split(".", 2)[1];

            value = SimVar.GetSimVarValue("TURB ENG VIBRATION:1", "Number");
            if (value < 0) value = 0.0;
            this.VibN2Left.textContent = Math.floor(value) + ".";
            this.VibN2LeftDecimal.textContent = value.toFixed(1).split(".", 2)[1];

            value = SimVar.GetSimVarValue("TURB ENG VIBRATION:2", "Number");
            if (value < 0) value = 0.0;
            this.VibN2Right.textContent = Math.floor(value) + ".";
            this.VibN2RightDecimal.textContent = value.toFixed(1).split(".", 2)[1];

            // Cabin pressure
            value = SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE RATE", "feet per second");
            this.CabinVerticalSpeed.textContent = fastToFixed(value, 0);
            
            value = SimVar.GetSimVarValue("PRESSURIZATION CABIN ALTITUDE", "feet");
            this.CabinAltitude.textContent = fastToFixed(value, 0);

            let cabinAltMeters = value * Definitions.feetToMeters;
            let cabinPressurePascal = Definitions.seaLevelPressurePascal * Math.exp(Definitions.barometricPressureFactor * cabinAltMeters); // Barometric formula
            let cabinPressurePSI = cabinPressurePascal * Definitions.pascalToPSI;
            let outsidePressureINHG = SimVar.GetSimVarValue("AMBIENT PRESSURE", "inHg");
            let outsidePressurePSI = outsidePressureINHG * Definitions.inHgToPSI;
            let pressureDiff = cabinPressurePSI - outsidePressurePSI;

            // Only update pressure every second and with mean to prevent it flickering
            this.cumulatedPressure += pressureDiff;
            this.numberOfPressureReadings += 1;

            if (this.cumulatedTime < 1000) {
                this.cumulatedTime += _deltaTime;
            } else {
                let shownPressure = this.cumulatedPressure/this.numberOfPressureReadings;
                this.DeltaPressure.textContent = Math.floor(shownPressure) + ".";
                this.DeltaPressureDecimal.textContent = shownPressure.toFixed(1).split(".", 2)[1];
                this.cumulatedTime = 0;
                this.cumulatedPressure = 0;
                this.numberOfPressureReadings = 0;
            }
        }
    }
    A320_Neo_LowerECAM_CRZ.Page = Page;

})(A320_Neo_LowerECAM_CRZ || (A320_Neo_LowerECAM_CRZ = {}));
customElements.define("a320-neo-lower-ecam-crz", A320_Neo_LowerECAM_CRZ.Page);
//# sourceMappingURL=A320_Neo_LowerECAM_CRZ.js.map