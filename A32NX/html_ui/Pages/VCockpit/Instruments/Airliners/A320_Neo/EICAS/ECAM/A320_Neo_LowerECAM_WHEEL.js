/**
 * Minimum temperature at which the brake indicator turns amber
 */
const BRAKE_AMBER_THRESHOLD = 300;

/**
 * Minimum temperature at which the brake indicator shows the hottest brake
 */
const BRAKE_SHOW_HOTTEST_THRESHOLD = 100;

var A320_Neo_LowerECAM_WHEEL;
(function (A320_Neo_LowerECAM_WHEEL) {
    class Definitions {
    }

    A320_Neo_LowerECAM_WHEEL.Definitions = Definitions;

    class Page extends Airliners.EICASTemplateElement {
        constructor() {
            super();
            this.isInitialised = false;
        }
        get templateID() {
            return "LowerECAMWHEELTemplate";
        }
        connectedCallback() {
            super.connectedCallback();
            TemplateElement.call(this, this.init.bind(this));
        }

        init() {
            this.view = {
                // Spoiler arrows
                spoilers: {
                    left: [
                        this.querySelector("#arrow5_left"),
                        this.querySelector("#arrow4_left"),
                        this.querySelector("#arrow3_left"),
                        this.querySelector("#arrow2_left"),
                        this.querySelector("#arrow1_left"),
                    ],
                    right: [
                        this.querySelector("#arrow5_right"),
                        this.querySelector("#arrow4_right"),
                        this.querySelector("#arrow3_right"),
                        this.querySelector("#arrow2_right"),
                        this.querySelector("#arrow1_right"),
                    ],
                    lines: this.querySelectorAll("#speedbrakes path"),
                    numbers: this.querySelectorAll("#speedbrake_text text"),
                },
                // Landing gear indicators
                gears: {
                    left: this.querySelector("#gear-left"),
                    center: this.querySelector("#gear-center"),
                    right: this.querySelector("#gear-right"),
                    doors: {
                        left: this.querySelector("#gear-door-left"),
                        center: this.querySelector("#gear-door-center"),
                        right: this.querySelector("#gear-door-right"),
                        inTransit: {
                            left: this.querySelector("#gear-door-in-transit-left"),
                            center: this.querySelector("#gear-door-in-transit-center"),
                            right: this.querySelector("#gear-door-in-transit-right"),
                        }
                    },
                    lgcius: {
                        all: [
                            this.querySelector("#gear-lgciu-1-left"),
                            this.querySelector("#gear-lgciu-2-left"),
                            this.querySelector("#gear-lgciu-1-center"),
                            this.querySelector("#gear-lgciu-2-center"),
                            this.querySelector("#gear-lgciu-1-right"),
                            this.querySelector("#gear-lgciu-2-right"),
                        ],
                        left: this.querySelector("#gear-lgcius-left"),
                        center: this.querySelector("#gear-lgcius-center"),
                        right: this.querySelector("#gear-lgcius-right"),
                        allOne: {
                            elements: this.querySelectorAll(".gear-lgciu-1"),
                            failedElements: this.querySelectorAll(".gear-failed-lgicu-1"),
                            setSensorFailed(/** boolean */ state) {
                                if (state) {
                                    this.elements.forEach(it => it.classList.add("color-red"));
                                } else {
                                    this.elements.forEach(it => it.classList.remove("color-red"));
                                }
                            },
                            setFailed(/** boolean */ state) {
                                if (state) {
                                    this.elements.forEach(it => it.setAttribute("visibility", "hidden"));
                                    this.failedElements.forEach(it => it.setAttribute("visibility", "visible"));
                                } else {
                                    this.elements.forEach(it => it.setAttribute("visibility", "visible"));
                                    this.failedElements.forEach(it => it.setAttribute("visibility", "hidden"));
                                }
                            }
                        },
                        allTwo: {
                            elements: this.querySelectorAll(".gear-lgciu-2"),
                            failedElements: this.querySelectorAll(".gear-failed-lgicu-2"),
                            setSensorFailed(/** boolean */ state) {
                                if (state) {
                                    this.elements.forEach(it => it.classList.add("color-red"));
                                } else {
                                    this.elements.forEach(it => it.classList.remove("color-red"));
                                }
                            },
                            setFailed(/** boolean */ state) {
                                if (state) {
                                    this.elements.forEach(it => it.setAttribute("visibility", "hidden"));
                                    this.failedElements.forEach(it => it.setAttribute("visibility", "visible"));
                                } else {
                                    this.elements.forEach(it => it.setAttribute("visibility", "visible"));
                                    this.failedElements.forEach(it => it.setAttribute("visibility", "hidden"));
                                }
                            }
                        },
                    }
                },
                // Brake temperature indicators
                brakes: {
                    // Arches
                    indicators: [
                        this.querySelector("#indicator-arch-1"),
                        this.querySelector("#indicator-arch-2"),
                        this.querySelector("#indicator-arch-3"),
                        this.querySelector("#indicator-arch-4"),
                    ],
                    // Temperature
                    temps: [
                        this.querySelector("#wheel-brake-temp-1"),
                        this.querySelector("#wheel-brake-temp-2"),
                        this.querySelector("#wheel-brake-temp-3"),
                        this.querySelector("#wheel-brake-temp-4"),
                    ],
                    autobrake: {
                        element: this.querySelector("#autobrake-element"),
                        title: this.querySelector("#autobrake-title"),
                        quantity: {
                            min: this.querySelector("#autobrake-quantity-min"),
                            med: this.querySelector("#autobrake-quantity-med"),
                            max: this.querySelector("#autobrake-quantity-max"),
                        },
                        setArmed(/** boolean */ state) {
                            this.element.setAttribute("visibility", state ? "visible" : "hidden");
                            this.title.setAttribute("visibility", state ? "visible" : "hidden");
                            this.quantity.min.setAttribute("visibility", state ? "visible" : "hidden");
                            this.quantity.med.setAttribute("visibility", state ? "visible" : "hidden");
                            this.quantity.max.setAttribute("visibility", state ? "visible" : "hidden");
                        },
                        switch(/** "min" | "med" | "max" */ mode) {
                            switch (mode) {
                                case "min":
                                    this.quantity.min.setAttribute("visibility", "visible");
                                    this.quantity.med.setAttribute("visibility", "hidden");
                                    this.quantity.max.setAttribute("visibility", "hidden");
                                    break;
                                case "med":
                                    this.quantity.min.setAttribute("visibility", "hidden");
                                    this.quantity.med.setAttribute("visibility", "visible");
                                    this.quantity.max.setAttribute("visibility", "hidden");
                                    break;
                                case "max":
                                    this.quantity.min.setAttribute("visibility", "hidden");
                                    this.quantity.med.setAttribute("visibility", "hidden");
                                    this.quantity.max.setAttribute("visibility", "visible");
                                    break;
                            }
                        }
                    }
                },
                center: {
                    nwSteering: this.querySelector("#center-nw-steering"),
                    lgCtl: this.querySelector("#center-lg-ctl"),
                    antiSkid: this.querySelector("#center-anti-skid"),
                    normBrk: this.querySelector("#center-norm-brk"),
                    altnBrk: this.querySelector("#center-altn-brk"),
                    accuOnly: this.querySelector("#center-accu-only"),
                }
            };

            this.isInitialised = true;

            /**
             * Currently displayed brake temperature. Initialized to SimVar value.
             */
            this.currentDisplayedBrakeTemps = [
                SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_1", "celsius"),
                SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_2", "celsius"),
                SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_3", "celsius"),
                SimVar.GetSimVarValue("L:A32NX_BRAKE_TEMPERATURE_4", "celsius")
            ];

            this.brakeTemperatureDidChange = [true, true, true, true];

            this.hydraulicsAvailable = false;
            this.setControlsHydraulicsAvailable(this.hydraulicsAvailable);
        }

        /**
         * @param element {Element}
         */
        show(element) {
            element.setAttribute("visibility", "visible");
        }

        /**
         * @param element {Element}
         */
        hide(element) {
            element.setAttribute("visibility", "hidden");
        }

        /**
         * @param element {Element}
         */
        makeGreen(element) {
            element.classList.remove("color-amber");
            element.classList.remove("color-red");
            element.classList.add("color-green");
        }

        /**
         * @param element {Element}
         */
        makeAmber(element) {
            element.classList.remove("color-green");
            element.classList.remove("color-red");
            element.classList.add("color-amber");
        }

        /**
         * @param element {Element}
         */
        makeRed(element) {
            element.classList.remove("color-green");
            element.classList.remove("color-amber");
            element.classList.add("color-red");
        }

        update(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            this.updateHydraulicsAvailable(_deltaTime);

            this.updateBrakeTemp(_deltaTime);
            this.updateTempColor(_deltaTime);
            this.updateAutoBrake(_deltaTime);
            this.updateNwSteeringAntiSkid(_deltaTime);
            this.updateLgCtl(_deltaTime);
            this.updateSpoilerSpeedBrake(_deltaTime);
            this.updateLandingGear(_deltaTime);
        }

        updateHydraulicsAvailable(_deltaTime) {
            const hydraulicsShouldBeAvailable = SimVar.GetSimVarValue("ENG COMBUSTION:1", "Bool") === 1 && SimVar.GetSimVarValue("ENG COMBUSTION:2", "Bool") === 1;

            if (hydraulicsShouldBeAvailable !== this.hydraulicsAvailable) {
                this.hydraulicsAvailable = hydraulicsShouldBeAvailable;

                this.setControlsHydraulicsAvailable(this.hydraulicsAvailable);
            }
        }

        setControlsHydraulicsAvailable(/** boolean */ state) {
            if (state) {
                this.view.spoilers.numbers.forEach(number => this.hide(number));
                this.view.spoilers.lines.forEach(line => this.makeGreen(line));

                this.hide(this.view.center.normBrk);
                this.hide(this.view.center.altnBrk);
                this.hide(this.view.center.accuOnly);

                this.makeGreen(this.view.brakes.autobrake.title);
                this.makeGreen(this.view.brakes.autobrake.quantity.min);
                this.makeGreen(this.view.brakes.autobrake.quantity.med);
                this.makeGreen(this.view.brakes.autobrake.quantity.max);
            } else {
                this.view.spoilers.numbers.forEach(number => this.show(number));
                this.view.spoilers.lines.forEach(line => this.makeAmber(line));

                this.show(this.view.center.normBrk);
                this.show(this.view.center.altnBrk);
                this.show(this.view.center.accuOnly);

                this.makeAmber(this.view.brakes.autobrake.title);
                this.makeAmber(this.view.brakes.autobrake.quantity.min);
                this.makeAmber(this.view.brakes.autobrake.quantity.med);
                this.makeAmber(this.view.brakes.autobrake.quantity.max);
                this.show(this.view.brakes.autobrake.title);
            }
        }

        updateBrakeTemp(_deltaTime) {
            for (let i = 0; i < this.currentDisplayedBrakeTemps.length; i++) {
                const newValue = SimVar.GetSimVarValue(`L:A32NX_BRAKE_TEMPERATURE_${i + 1}`, "celsius");

                if (this.currentDisplayedBrakeTemps[i] !== newValue) {
                    this.currentDisplayedBrakeTemps[i] = newValue;
                    this.brakeTemperatureDidChange[i] = true;

                    // Round to nearest 5 and clamp above 0
                    this.view.brakes.temps[i].textContent = Math.max(0, Math.round(this.currentDisplayedBrakeTemps[i] / 5) * 5);
                } else {
                    this.brakeTemperatureDidChange[i] = false;
                }
            }
        }

        updateTempColor(_deltaTime) {
            let max = this.currentDisplayedBrakeTemps[0];
            let maxIndex = 0;

            for (let i = 1; i < this.currentDisplayedBrakeTemps.length; i++) {
                if (this.currentDisplayedBrakeTemps[i] > max) {
                    maxIndex = i;
                    max = this.currentDisplayedBrakeTemps[i];
                }
            }

            for (let i = 0; i < this.view.brakes.temps.length; i++) {
                if (!this.brakeTemperatureDidChange[i]) {
                    break;
                }

                if (this.currentDisplayedBrakeTemps[i] > BRAKE_AMBER_THRESHOLD) {
                    this.view.brakes.temps[i].setAttribute("class", "wheel-set-brake-temp-amber");
                } else {
                    this.view.brakes.temps[i].setAttribute("class", "wheel-set-brake-temp");
                }

                if (maxIndex === i) {
                    if (this.currentDisplayedBrakeTemps[i] > BRAKE_AMBER_THRESHOLD) {
                        this.view.brakes.indicators[i].classList.add("wheel-set-brake-temp-amber");
                        this.view.brakes.indicators[i].classList.remove("wheel-set-brake-temp");
                    } else if (this.currentDisplayedBrakeTemps[i] > BRAKE_SHOW_HOTTEST_THRESHOLD) {
                        this.view.brakes.indicators[i].classList.add("wheel-set-brake-temp");
                        this.view.brakes.indicators[i].classList.remove("wheel-set-brake-temp-amber");
                    }
                } else {
                    this.view.brakes.indicators[i].classList.remove("wheel-set-brake-temp", "wheel-set-brake-temp-amber");
                }
            }
        }

        // Need to update the ECAM Messages left side when Skid is turned off casue when off AUTO Brake is off too
        updateNwSteeringAntiSkid(_deltaTime) {
            const currentSkidState = SimVar.GetSimVarValue("ANTISKID BRAKES ACTIVE", "Bool");

            if (currentSkidState === 1) {
                this.hide(this.view.center.nwSteering);
                this.hide(this.view.center.antiSkid);
            } else {
                this.show(this.view.center.nwSteering);
                this.show(this.view.center.antiSkid);
            }
        }

        updateLgCtl(_deltaTime) {
            const landingGearLeft = SimVar.GetSimVarValue("GEAR LEFT POSITION", "Percent Over 100");
            const landingGearCenter = SimVar.GetSimVarValue("GEAR CENTER POSITION", "Percent Over 100");
            const landingGearRight = SimVar.GetSimVarValue("GEAR RIGHT POSITION", "Percent Over 100");

            if (landingGearLeft > 0 && landingGearLeft < 1 || landingGearCenter > 0 && landingGearCenter < 1 || landingGearRight > 0 && landingGearRight < 1) {
                this.show(this.view.center.lgCtl);
            } else {
                this.hide(this.view.center.lgCtl);
            }
        }

        updateAutoBrake(_deltaTime) {
            if (!this.isInitialised) {
                return;
            }

            const autoBrakeMode = SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Number");

            if (autoBrakeMode === 0) {
                this.view.brakes.autobrake.setArmed(false);
            } else {
                this.view.brakes.autobrake.setArmed(true);

                // Show appropriate autobrake level
                switch (autoBrakeMode) {
                    case 1:
                        this.view.brakes.autobrake.switch("min");
                        break;
                    case 2:
                        this.view.brakes.autobrake.switch("med");
                        break;
                    case 3:
                        this.view.brakes.autobrake.switch("max");
                        break;
                }
            }
        }

        updateSpoilerSpeedBrake(_deltaTime) {
            if (!this.isInitialised || !SimVar.GetSimVarValue("SPOILER AVAILABLE", "Bool")) {
                return;
            }

            const spoilerLeftPos = SimVar.GetSimVarValue("SPOILERS LEFT POSITION", "percent");
            const spoilerRightPos = SimVar.GetSimVarValue("SPOILERS RIGHT POSITION", "percent");

            if (this.hydraulicsAvailable && spoilerRightPos >= 1) {
                this.view.spoilers.right.forEach(arrow => this.show(arrow));
            } else {
                this.view.spoilers.right.forEach(arrow => this.hide(arrow));
            }

            if (this.hydraulicsAvailable && spoilerLeftPos >= 1) {
                this.view.spoilers.left.forEach(arrow => this.show(arrow));
            } else {
                this.view.spoilers.left.forEach(arrow => this.hide(arrow));
            }
        }

        updateLandingGear(_deltaTime) {
            const landingGearLeft = SimVar.GetSimVarValue("GEAR LEFT POSITION", "Percent Over 100");
            const landingGearCenter = SimVar.GetSimVarValue("GEAR CENTER POSITION", "Percent Over 100");
            const landingGearRight = SimVar.GetSimVarValue("GEAR RIGHT POSITION", "Percent Over 100");

            // Make LGCIUs green if gear is down

            if (landingGearLeft === 1) {
                [this.view.gears.lgcius.all[0], this.view.gears.lgcius.all[1]]
                    .forEach(lgciu => this.makeGreen(lgciu));
            }

            if (landingGearCenter === 1) {
                [this.view.gears.lgcius.all[2], this.view.gears.lgcius.all[3]]
                    .forEach(lgciu => this.makeGreen(lgciu));
            }

            if (landingGearRight === 1) {
                [this.view.gears.lgcius.all[4], this.view.gears.lgcius.all[5]]
                    .forEach(lgciu => this.makeGreen(lgciu));
            }

            // Make LGCIUs red if gear in transit

            if (landingGearLeft >= 0.1 && landingGearLeft <= 0.9) {
                this.show(this.view.gears.doors.inTransit.left);
                this.hide(this.view.gears.doors.left);

                [this.view.gears.lgcius.all[0], this.view.gears.lgcius.all[1]]
                    .forEach(lgciu => this.makeRed(lgciu));
            } else {
                this.hide(this.view.gears.doors.inTransit.left);
                this.show(this.view.gears.doors.left);
            }

            if (landingGearCenter >= 0.1 && landingGearCenter <= 0.9) {
                this.show(this.view.gears.doors.inTransit.center);
                this.hide(this.view.gears.doors.center);

                [this.view.gears.lgcius.all[2], this.view.gears.lgcius.all[3]]
                    .forEach(lgciu => this.makeRed(lgciu));
            } else {
                this.hide(this.view.gears.doors.inTransit.center);
                this.show(this.view.gears.doors.center);
            }

            if (landingGearRight >= 0.1 && landingGearRight <= 0.9) {
                this.show(this.view.gears.doors.inTransit.right);
                this.hide(this.view.gears.doors.right);

                [this.view.gears.lgcius.all[4], this.view.gears.lgcius.all[5]]
                    .forEach(lgciu => this.makeRed(lgciu));
            } else {
                this.hide(this.view.gears.doors.inTransit.right);
                this.show(this.view.gears.doors.right);
            }

            // Now hide them since gear is retracted

            if (landingGearLeft === 0) {
                this.view.gears.lgcius.left.setAttribute("visibility", "hidden");
            } else if (landingGearRight >= 0.1) {
                this.view.gears.lgcius.left.setAttribute("visibility", "visible");
            }

            if (landingGearCenter === 0) {
                this.view.gears.lgcius.center.setAttribute("visibility", "hidden");
            } else if (landingGearRight >= 0.1) {
                this.view.gears.lgcius.center.setAttribute("visibility", "visible");
            }

            if (landingGearRight === 0) {
                this.view.gears.lgcius.right.setAttribute("visibility", "hidden");
            } else if (landingGearRight >= 0.1) {
                this.view.gears.lgcius.right.setAttribute("visibility", "visible");
            }
        }

        _checkBrakesPressure() {
            // TODO HERE WE NEED TO LOOP THROUGH HYDRALICS
        }
    }

    A320_Neo_LowerECAM_WHEEL.Page = Page;
})(A320_Neo_LowerECAM_WHEEL || (A320_Neo_LowerECAM_WHEEL = {}));
customElements.define("a320-neo-lower-ecam-wheel", A320_Neo_LowerECAM_WHEEL.Page);