/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

class FMCMainDisplay extends BaseAirliners {
    constructor() {
        super(...arguments);
        this.currentFlightPlanWaypointIndex = -1;
        this._title = undefined;
        this._pageCurrent = undefined;
        this._pageCount = undefined;
        this._labels = [];
        this._lines = [];
        this._inOut = undefined;
        this.onLeftInput = [];
        this.onRightInput = [];
        this.leftInputDelay = [];
        this.rightInputDelay = [];
        this.costIndex = 0;
        this.lastUserInput = "";
        this.isDisplayingErrorMessage = false;
        this.isDisplayingTypeTwoMessage = false;
        this.maxCruiseFL = 390;
        this.routeIndex = 0;
        this.coRoute = "";
        this.tmpOrigin = "";
        this.transitionAltitude = 10000;
        this.perfTOTemp = 20;
        this._overridenFlapApproachSpeed = NaN;
        this._overridenSlatApproachSpeed = NaN;
        this._routeFinalFuelWeight = 0;
        this._routeFinalFuelTime = 30;
        this._routeFinalFuelTimeDefault = 30;
        this._routeReservedWeight = 0;
        this._routeReservedPercent = 5;
        this.takeOffWeight = NaN;
        this.landingWeight = NaN;
        this.averageWind = 0;
        this.perfCrzWindHeading = NaN;
        this.perfCrzWindSpeed = NaN;
        this.perfApprQNH = NaN;
        this.perfApprTemp = NaN;
        this.perfApprWindHeading = NaN;
        this.perfApprWindSpeed = NaN;
        this.perfApprTransAlt = NaN;
        this.vApp = NaN;
        this.perfApprMDA = NaN;
        this.perfApprDH = NaN;
        this.perfApprFlaps3 = false;
        this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_TAKEOFF;
        this._lockConnectIls = false;
        this._apNavIndex = 1;
        this._apLocalizerOn = false;
        this._canSwitchToNav = false;
        this._vhf1Frequency = 0;
        this._vhf2Frequency = 0;
        this._vor1Frequency = 0;
        this._vor1Course = 0;
        this._vor2Frequency = 0;
        this._vor2Course = 0;
        this._ilsFrequency = 0;
        this._ilsFrequencyPilotEntered = false;
        this._ilsCourse = 0;
        this._adf1Frequency = 0;
        this._adf2Frequency = 0;
        this._rcl1Frequency = 0;
        this._pre2Frequency = 0;
        this._atc1Frequency = 0;
        this._radioNavOn = false;
        this._debug = 0;
        this._checkFlightPlan = 0;

        this._windDirections = {
            TAILWIND : "TL",
            HEADWIND : "HD"
        };
        this._fuelPlanningPhases = {
            PLANNING : 1,
            IN_PROGRESS : 2,
            COMPLETED : 3
        };
        this._zeroFuelWeightZFWCGEntered = false;
        this._taxiEntered = false;
        this._windDir = this._windDirections.HEADWIND;
        this._DistanceToAlt = 0;
        this._routeAltFuelWeight = 0;
        this._routeAltFuelTime = 0;
        this._routeTripFuelWeight = 0;
        this._routeTripTime = 0;
        this._defaultTaxiFuelWeight = 0.2;
        this._rteRsvPercentOOR = false;
        this._rteReservedEntered = false;
        this._rteFinalCoeffecient = 0;
        this._rteFinalEntered = false;
        this._routeAltFuelEntered = false;
        this._minDestFob = 0;
        this._minDestFobEntered = false;
        this._defaultRouteFinalTime = 45;
        this._fuelPredDone = false;
        this._fuelPlanningPhase = this._fuelPlanningPhases.PLANNING;
        this._blockFuelEntered = false;
        /* CPDLC Fields */
        this.tropo = "";
    }

    getTitle() {
        if (this._title === undefined) {
            this._title = this._titleElement.textContent;
        }
        return this._title;
    }

    setTitle(content) {
        let color = content.split("[color]")[1];
        if (!color) {
            color = "white";
        }
        this._title = content.split("[color]")[0];
        this._titleElement.classList.remove("white", "cyan", "yellow", "green", "amber", "red", "magenta", "inop");
        this._titleElement.classList.add(color);
        this._titleElement.textContent = this._title;
    }

    setTitleLeft(content) {
        if (!content) {
            this._titleLeftElement.textContent = "";
            return;
        }
        let color = content.split("[color]")[1];
        if (!color) {
            color = "white";
        }
        this._titleLeft = content.split("[color]")[0];
        this._titleLeftElement.classList.remove("white", "blue", "yellow", "green", "red", "magenta", "inop");
        this._titleLeftElement.classList.add(color);
        this._titleLeftElement.textContent = this._titleLeft;
    }

    setPageCurrent(value) {
        if (typeof (value) === "number") {
            this._pageCurrent = value;
        } else if (typeof (value) === "string") {
            this._pageCurrent = parseInt(value);
        }
        this._pageCurrentElement.textContent = (this._pageCurrent > 0 ? this._pageCurrent : "") + "";
    }

    setPageCount(value) {
        if (typeof (value) === "number") {
            this._pageCount = value;
        } else if (typeof (value) === "string") {
            this._pageCount = parseInt(value);
        }
        this._pageCountElement.textContent = (this._pageCount > 0 ? this._pageCount : "") + "";
        if (this._pageCount === 0) {
            this.getChildById("page-slash").textContent = "";
        } else {
            this.getChildById("page-slash").textContent = "/";
        }
    }

    setLabel(label, row, col = -1) {
        if (col >= this._labelElements[row].length) {
            return;
        }
        if (!this._labels[row]) {
            this._labels[row] = [];
        }
        if (!label) {
            label = "";
        }
        if (col === -1) {
            for (let i = 0; i < this._labelElements[row].length; i++) {
                this._labels[row][i] = "";
                this._labelElements[row][i].textContent = "";
            }
            col = 0;
        }
        if (label === "__FMCSEPARATOR") {
            label = "------------------------";
        }
        if (label !== "") {
            if (label.indexOf("[b-text]") !== -1) {
                label = label.replace("[b-text]", "");
                this._lineElements[row][col].classList.remove("s-text");
                this._lineElements[row][col].classList.add("msg-text");
            } else {
                this._lineElements[row][col].classList.remove("msg-text");
            }

            let color = label.split("[color]")[1];
            if (!color) {
                color = "white";
            }
            const e = this._labelElements[row][col];
            e.classList.remove("white", "cyan", "yellow", "green", "amber", "red", "magenta", "inop");
            e.classList.add(color);
            label = label.split("[color]")[0];
        }
        this._labels[row][col] = label;
        this._labelElements[row][col].textContent = label;
    }

    setLine(content, row, col = -1) {
        if (col >= this._lineElements[row].length) {
            return;
        }
        if (!content) {
            content = "";
        }
        if (!this._lines[row]) {
            this._lines[row] = [];
        }
        if (col === -1) {
            for (let i = 0; i < this._lineElements[row].length; i++) {
                this._lines[row][i] = "";
                this._lineElements[row][i].textContent = "";
            }
            col = 0;
        }
        if (content === "__FMCSEPARATOR") {
            content = "------------------------";
        }
        if (content !== "") {
            if (content.indexOf("[s-text]") !== -1) {
                content = content.replace("[s-text]", "");
                this._lineElements[row][col].classList.add("s-text");
            } else {
                this._lineElements[row][col].classList.remove("s-text");
            }
            let color = content.split("[color]")[1];
            if (!color) {
                color = "white";
            }
            const e = this._lineElements[row][col];
            e.classList.remove("white", "cyan", "yellow", "green", "amber", "red", "magenta", "inop");
            e.classList.add(color);
            content = content.split("[color]")[0];
        }
        this._lines[row][col] = content;
        this._lineElements[row][col].textContent = this._lines[row][col];
    }

    get inOut() {
        return this.getInOut();
    }

    getInOut() {
        if (this._inOut === undefined) {
            this._inOut = this._inOutElement.textContent;
        }
        return this._inOut;
    }

    set inOut(v) {
        this.setInOut(v);
    }

    setInOut(content) {
        this._inOut = content;
        this._inOutElement.textContent = this._inOut;
    }

    setTemplate(template, large = false) {
        if (template[0]) {
            this.setTitle(template[0][0]);
            this.setPageCurrent(template[0][1]);
            this.setPageCount(template[0][2]);
            this.setTitleLeft(template[0][3]);
        }
        for (let i = 0; i < 6; i++) {
            let tIndex = 2 * i + 1;
            if (template[tIndex]) {
                if (large) {
                    if (template[tIndex][1] !== undefined) {
                        this.setLine(template[tIndex][0], i, 0);
                        this.setLine(template[tIndex][1], i, 1);
                        this.setLine(template[tIndex][2], i, 2);
                        this.setLine(template[tIndex][3], i, 3);
                    } else {
                        this.setLine(template[tIndex][0], i, -1);
                    }
                } else {
                    if (template[tIndex][1] !== undefined) {
                        this.setLabel(template[tIndex][0], i, 0);
                        this.setLabel(template[tIndex][1], i, 1);
                        this.setLabel(template[tIndex][2], i, 2);
                        this.setLabel(template[tIndex][3], i, 3);
                    } else {
                        this.setLabel(template[tIndex][0], i, -1);
                    }
                }
            }
            tIndex = 2 * i + 2;
            if (template[tIndex]) {
                if (template[tIndex][1] !== undefined) {
                    this.setLine(template[tIndex][0], i, 0);
                    this.setLine(template[tIndex][1], i, 1);
                    this.setLine(template[tIndex][2], i, 2);
                    this.setLine(template[tIndex][3], i, 3);
                } else {
                    this.setLine(template[tIndex][0], i, -1);
                }
            }
        }
        if (template[13]) {
            this.setInOut(template[13][0]);
        }
        SimVar.SetSimVarValue("L:AIRLINER_MCDU_CURRENT_FPLN_WAYPOINT", "number", this.currentFlightPlanWaypointIndex);
    }

    /**
     * Sets what arrows will be displayed in the corner of the screen. Arrows are removed when clearDisplay() is called.
     * @param {boolean} up - whether the up arrow will be displayed
     * @param {boolean} down - whether the down arrow will be displayed
     * @param {boolean} left - whether the left arrow will be displayed
     * @param {boolean} right - whether the right arrow will be displayed
     */
    setArrows(up, down, left, right) {
        this.arrowHorizontal.style.opacity = (left || right) ? "1" : "0";
        this.arrowVertical.style.opacity = (up || down) ? "1" : "0";
        if (up && down) {
            this.arrowVertical.innerHTML = "↓↑\xa0";
        } else if (up) {
            this.arrowVertical.innerHTML = "↑\xa0";
        } else {
            this.arrowVertical.innerHTML = "↓\xa0\xa0";
        }
        if (left && right) {
            this.arrowHorizontal.innerHTML = "←→\xa0";
        } else if (right) {
            this.arrowHorizontal.innerHTML = "→\xa0";
        } else {
            this.arrowHorizontal.innerHTML = "←\xa0\xa0";
        }
    }

    getNavDataDateRange() {
        return SimVar.GetGameVarValue("FLIGHT NAVDATA DATE RANGE", "string");
    }

    get cruiseFlightLevel() {
        return this._cruiseFlightLevel;
    }

    set cruiseFlightLevel(fl) {
        this._cruiseFlightLevel = Math.round(fl);
        SimVar.SetSimVarValue("L:AIRLINER_CRUISE_ALTITUDE", "number", this._cruiseFlightLevel * 100);
    }

    lastUserInputToScratchpad() {
        this.inOut = this.lastUserInput;
        this.lastUserInput = "";
    }

    clearUserInput() {
        if (!this.isDisplayingErrorMessage && !this.isDisplayingTypeTwoMessage) {
            this.lastUserInput = this.inOut;
            this.inOut = "";
            this._inOutElement.className = "white";
        }
        return this.lastUserInput;
    }

    tryClearOldUserInput() {
        if (!this.isDisplayingErrorMessage && !this.isDisplayingTypeTwoMessage) {
            this.lastUserInput = "";
        }
        this.tryShowMessage();
    }

    _showTypeOneMessage(message, color = false) {
        if (!this.isDisplayingErrorMessage && !this.isDisplayingTypeTwoMessage && !this.lastUserInput) {
            this.lastUserInput = this.inOut;
        }
        this.isDisplayingErrorMessage = true;
        this.inOut = message;
        this._inOutElement.className = color ? "amber" : "white";
    }

    /**
     * Returns true if an engine is running (FF > 0)
     * @returns {boolean}
     */
    isAnEngineOn() {
        return Simplane.getEngineActive(0) || Simplane.getEngineActive(1);
    }

    /**
     * Returns true if all engines are running (FF > 0)
     * @returns {boolean}
     */
    isAllEngineOn() {
        return Simplane.getEngineActive(0) && Simplane.getEngineActive(1);
    }

    /**
     * Returns the ISA temperature for a given altitude
     * @param alt {number} altitude in ft
     * @returns {number} ISA temp in C°
     */
    getIsaTemp(alt = Simplane.getAltitude()) {
        return alt / 1000 * (-1.98) + 15;
    }

    /**
     * Returns the deviation from ISA temperature and OAT at given altitude
     * @param alt {number} altitude in ft
     * @returns {number} ISA temp deviation from OAT in C°
     */
    getIsaTempDeviation(alt = Simplane.getAltitude()) {
        return SimVar.GetSimVarValue("AMBIENT TEMPERATURE", "celsius") - this.getIsaTemp(alt);
    }

    /**
     * Returns the maximum cruise FL for ISA temp and GW
     * @param temp {number} ISA in C°
     * @param gw {number} GW in t
     * @returns {number} MAX FL
     */
    getMaxFL(temp = this.getIsaTempDeviation(), gw = SimVar.GetSimVarValue("TOTAL WEIGHT", "kg") / 1000) {
        return Math.round(temp <= 10 ? -2.778 * gw + 578.667 : (temp * (-0.039) - 2.389) * gw + temp * (-0.667) + 585.334);
    }

    /**
     * Returns the maximum allowed cruise FL considering max service FL
     * @param fl {number} FL to check
     * @returns {number} maximum allowed cruise FL
     */
    getMaxFlCorrected(fl = this.getMaxFL()) {
        return fl >= this.maxCruiseFL ? this.maxCruiseFL : fl;
    }

    setCruiseFlightLevelAndTemperature(input) {
        if (input === FMCMainDisplay.clrValue) {
            this.cruiseFlightLevel = undefined;
            this.cruiseTemperature = undefined;
            return true;
        }
        const flString = input.split("/")[0].replace("FL", "");
        const tempString = input.split("/")[1];
        const onlyTemp = flString.length === 0;

        if (!!flString && !onlyTemp && this.trySetCruiseFl(parseFloat(flString))) {
            if (SimVar.GetSimVarValue("L:A32NX_CRZ_ALT_SET_INITIAL", "bool") === 1 && SimVar.GetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool") === 1) {
                SimVar.SetSimVarValue("L:A32NX_NEW_CRZ_ALT", "number", this.cruiseFlightLevel);
            } else {
                SimVar.SetSimVarValue("L:A32NX_CRZ_ALT_SET_INITIAL", "bool", 1);
            }
            if (!tempString) {
                return true;
            }
        }
        if (!!tempString) {
            const temp = parseInt(tempString.replace("M", "-"));
            console.log("tS: " + tempString);
            console.log("ti: " + temp);
            if (isFinite(temp) && this._cruiseEntered) {
                if (temp > -270 && temp < 100) {
                    this.cruiseTemperature = temp;
                    return true;
                } else {
                    this.addNewMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
            } else {
                this.addNewMessage(NXSystemMessages.notAllowed);
                return false;
            }
        }
        this.addNewMessage(NXSystemMessages.formatError);
        return false;
    }

    tryUpdateCostIndex(costIndex) {
        const value = parseInt(costIndex);
        if (isFinite(value)) {
            if (value >= 0) {
                if (value < 1000) {
                    this.costIndex = value;
                    return true;
                } else {
                    this.addNewMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
            }
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    /**
     * Any tropopause altitude up to 60,000 ft is able to be entered
     * @param {string | number} tropo Format: NNNN or NNNNN Leading 0’s must be included. Entry is rounded to the nearest 10 ft
     * @return {boolean} Whether tropopause could be set or not
     */
    tryUpdateTropo(tropo) {
        const _tropo = typeof tropo === 'number' ? tropo.toString() : tropo;
        if (_tropo.match(/^(?=(\D*\d){4,5}\D*$)/g)) {
            const value = parseInt(_tropo.padEnd(5, '0'));
            if (isFinite(value)) {
                if (value >= 0 && value <= 60000) {
                    const valueRounded = Math.round(value / 10) * 10;
                    this.tropo = valueRounded.toString();
                    return true;
                }
            }
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    ensureCurrentFlightPlanIsTemporary(callback = EmptyCallback.Boolean) {
        if (this.flightPlanManager.getCurrentFlightPlanIndex() === 0) {
            this.flightPlanManager.copyCurrentFlightPlanInto(1, () => {
                this.flightPlanManager.setCurrentFlightPlanIndex(1, (result) => {
                    SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 1);
                    SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 1);
                    callback(result);
                });
            });
        } else {
            callback(true);
        }
    }

    tryUpdateFromTo(fromTo, callback = EmptyCallback.Boolean) {
        if (fromTo === FMCMainDisplay.clrValue) {
            this.addNewMessage(NXSystemMessages.notAllowed);
            return callback(false);
        }
        const from = fromTo.split("/")[0];
        const to = fromTo.split("/")[1];
        this.dataManager.GetAirportByIdent(from).then((airportFrom) => {
            if (airportFrom) {
                this.dataManager.GetAirportByIdent(to).then((airportTo) => {
                    if (airportTo) {
                        this.eraseTemporaryFlightPlan(() => {
                            this.flightPlanManager.clearFlightPlan(() => {
                                this.flightPlanManager.setOrigin(airportFrom.icao, () => {
                                    this.tmpOrigin = airportFrom.ident;
                                    this.flightPlanManager.setDestination(airportTo.icao, () => {
                                        this.tmpOrigin = airportTo.ident;
                                        callback(true);
                                    });
                                });
                            });
                        });
                    } else {
                        this.addNewMessage(NXSystemMessages.notInDatabase);
                        callback(false);
                    }
                });
            } else {
                this.addNewMessage(NXSystemMessages.notInDatabase);
                callback(false);
            }
        });
    }

    /**
     * Computes distance between destination and alternate destination
     */
    tryUpdateDistanceToAlt() {
        this._DistanceToAlt = Avionics.Utils.computeGreatCircleDistance(
            this.flightPlanManager.getDestination().infos.coordinates,
            this.altDestination.infos.coordinates);
    }

    isAltFuelInRange(fuel) {
        return 0 < fuel && fuel < (this.blockFuel - this._routeTripFuelWeight);
    }

    async trySetRouteAlternateFuel(altFuel) {
        if (altFuel === FMCMainDisplay.clrValue) {
            this._routeAltFuelEntered = false;
            return true;
        }
        const value = parseFloat(altFuel) * this._conversionWeight;
        if (isFinite(value)) {
            if (this.isAltFuelInRange(value)) {
                this._routeAltFuelEntered = true;
                this._routeAltFuelWeight = value;
                this._routeAltFuelTime = FMCMainDisplay.minutesTohhmm(A32NX_FuelPred.computeUserAltTime(this._routeAltFuelWeight * 1000, 290));
                return true;
            } else {
                this.addNewMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        }
        this.addNewMessage(NXSystemMessages.formatError);
        return false;
    }

    isMinDestFobInRange(fuel) {
        return 0 <= fuel && fuel <= 80.0;
    }

    async trySetMinDestFob(fuel) {
        if (fuel === FMCMainDisplay.clrValue) {
            this._minDestFobEntered = false;
            return true;
        }
        const value = parseFloat(fuel) * this._conversionWeight;
        if (isFinite(value)) {
            if (this.isMinDestFobInRange(value)) {
                this._minDestFobEntered = true;
                if (value < this._minDestFob) {
                    this.addNewMessage(NXSystemMessages.checkMinDestFob);
                }
                this._minDestFob = value;
                return true;
            } else {
                this.addNewMessage(NXSystemMessages.entryOutOfRange);
            }
        }
        this.addNewMessage(NXSystemMessages.formatError);
        return false;
    }

    async tryUpdateAltDestination(altDestIdent) {
        if (altDestIdent === "NONE" || altDestIdent === FMCMainDisplay.clrValue) {
            this.altDestination = undefined;
            this._DistanceToAlt = 0;
            return true;
        }
        const airportAltDest = await this.dataManager.GetAirportByIdent(altDestIdent);
        if (airportAltDest) {
            this.altDestination = airportAltDest;
            this.tryUpdateDistanceToAlt();
            return true;
        }
        this.addNewMessage(NXSystemMessages.notInDatabase);
        return false;
    }

    /**
     * Updates the Fuel weight cell to tons. Uses a place holder FL120 for 30 min
     */
    tryUpdateRouteFinalFuel() {
        if (this._routeFinalFuelTime <= 0) {
            this._routeFinalFuelTime = this._defaultRouteFinalTime;
        }
        this._routeFinalFuelWeight = A32NX_FuelPred.computeHoldingTrackFF(this.zeroFuelWeight, 120) / 1000;
        this._rteFinalCoeffecient = A32NX_FuelPred.computeHoldingTrackFF(this.zeroFuelWeight, 120) / 30;
    }

    /**
     * Updates the alternate fuel and time values using a place holder FL of 330 until that can be set
     */
    tryUpdateRouteAlternate() {
        if (this._DistanceToAlt < 20) {
            this._routeAltFuelWeight = 0;
            this._routeAltFuelTime = 0;
        } else {
            const placeholderFl = 120;
            let airDistance = 0;
            if (this._windDir === this._windDirections.TAILWIND) {
                airDistance = A32NX_FuelPred.computeAirDistance(Math.round(this._DistanceToAlt), this.averageWind);
            } else if (this._windDir === this._windDirections.HEADWIND) {
                airDistance = A32NX_FuelPred.computeAirDistance(Math.round(this._DistanceToAlt), -this.averageWind);
            }

            const deviation = (this.zeroFuelWeight + this._routeFinalFuelWeight - A32NX_FuelPred.refWeight) * A32NX_FuelPred.computeNumbers(airDistance, placeholderFl, A32NX_FuelPred.computations.CORRECTIONS, true);
            if ((20 < airDistance && airDistance < 200) && (100 < placeholderFl && placeholderFl < 290)) { //This will always be true until we can setup alternate routes
                this._routeAltFuelWeight = (A32NX_FuelPred.computeNumbers(airDistance, placeholderFl, A32NX_FuelPred.computations.FUEL, true) + deviation) / 1000;
                this._routeAltFuelTime = A32NX_FuelPred.computeNumbers(airDistance, placeholderFl, A32NX_FuelPred.computations.TIME, true);
            }
        }
    }

    /**
     * Attempts to calculate trip information. Is dynamic in that it will use liveDistanceTo the destination rather than a
     * static distance. Works down to 20NM airDistance and FL100 Up to 3100NM airDistance and FL390, anything out of those ranges and values
     * won't be updated.
     */
    tryUpdateRouteTrip(dynamic = false) {
        let airDistance = 0;
        const groundDistance = dynamic ? this.flightPlanManager.getDestination().liveDistanceTo : this.flightPlanManager.getDestination().cumulativeDistanceInFP;
        if (this._windDir === this._windDirections.TAILWIND) {
            airDistance = A32NX_FuelPred.computeAirDistance(groundDistance, this.averageWind);
        } else if (this._windDir === this._windDirections.HEADWIND) {
            airDistance = A32NX_FuelPred.computeAirDistance(groundDistance, -this.averageWind);
        }

        let altToUse = this.cruiseFlightLevel;
        // Use the cruise level for calculations otherwise after cruise use descent altitude down to 10,000 feet.
        if (this.currentFlightPhase >= FlightPhase.FLIGHT_PHASE_DESCENT) {
            altToUse = SimVar.GetSimVarValue("PLANE ALTITUDE", 'Feet') / 100;
        }

        if ((20 <= airDistance && airDistance <= 3100) && (100 <= altToUse && altToUse <= 390)) {
            const deviation = (this.zeroFuelWeight + this._routeFinalFuelWeight + this._routeAltFuelWeight - A32NX_FuelPred.refWeight) * A32NX_FuelPred.computeNumbers(airDistance, altToUse, A32NX_FuelPred.computations.CORRECTIONS, false);

            this._routeTripFuelWeight = (A32NX_FuelPred.computeNumbers(airDistance, altToUse, A32NX_FuelPred.computations.FUEL, false) + deviation) / 1000;
            this._routeTripTime = A32NX_FuelPred.computeNumbers(airDistance, altToUse, A32NX_FuelPred.computations.TIME, false);
        }
    }

    tryUpdateMinDestFob() {
        this._minDestFob = this._routeAltFuelWeight + this.getRouteFinalFuelWeight();
    }

    tryUpdateTOW() {
        this.takeOffWeight = this.getGW() - this.taxiFuelWeight;
    }

    tryUpdateLW() {
        this.landingWeight = this.takeOffWeight - this._routeTripFuelWeight;
    }

    /**
     * Computes extra fuel
     * @param {boolean}useFOB - States whether to use the FOB rather than block fuel when computing extra fuel
     * @returns {number}
     */
    tryGetExtraFuel(useFOB = false) {
        if (useFOB) {
            return this.getFOB() - this.getTotalTripFuelCons() - this._minDestFob - this.taxiFuelWeight;
        } else {
            return this.blockFuel - this.getTotalTripFuelCons() - this._minDestFob - this.taxiFuelWeight;
        }
    }

    /**
     * EXPERIMENTAL
     * Attempts to calculate the extra time
     */
    tryGetExtraTime(useFOB = false) {
        if (this.tryGetExtraFuel(useFOB) <= 0) {
            return 0;
        }
        const tempWeight = this.getGW() - this._minDestFob;
        const tempFFCoefficient = A32NX_FuelPred.computeHoldingTrackFF(tempWeight, 180) / 30;
        return (this.tryGetExtraFuel(useFOB) * 1000) / tempFFCoefficient;
    }

    getRouteAltFuelWeight() {
        return this._routeAltFuelWeight;
    }

    getRouteAltFuelTime() {
        return this._routeAltFuelTime;
    }

    setOriginRunwayIndex(runwayIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setDepartureProcIndex(-1, () => {
                this.flightPlanManager.setOriginRunwayIndex(runwayIndex, () => {
                    return callback(true);
                });
            });
        });
    }

    setRunwayIndex(runwayIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            const routeOriginInfo = this.flightPlanManager.getOrigin().infos;
            if (!this.flightPlanManager.getOrigin()) {
                this.addNewMessage(NXFictionalMessages.noOriginSet);
                return callback(false);
            } else if (runwayIndex === -1) {
                this.flightPlanManager.setDepartureRunwayIndex(-1, () => {
                    this.flightPlanManager.setOriginRunwayIndex(-1, () => {
                        return callback(true);
                    });
                });
            } else if (routeOriginInfo instanceof AirportInfo) {
                if (routeOriginInfo.oneWayRunways[runwayIndex]) {
                    this.flightPlanManager.setDepartureRunwayIndex(runwayIndex, () => {
                        return callback(true);
                    });
                }
            } else {
                this.addNewMessage(NXSystemMessages.notInDatabase);
                callback(false);
            }
        });
    }

    setDepartureIndex(departureIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            const currentRunway = this.flightPlanManager.getDepartureRunway();
            this.flightPlanManager.setDepartureProcIndex(departureIndex, () => {
                if (currentRunway) {
                    const departure = this.flightPlanManager.getDeparture();
                    const departureRunwayIndex = departure.runwayTransitions.findIndex(t => {
                        return t.name.indexOf(currentRunway.designation) != -1;
                    });
                    if (departureRunwayIndex >= -1) {
                        return this.flightPlanManager.setDepartureRunwayIndex(departureRunwayIndex, () => {
                            return callback(true);
                        });
                    }
                }
                return callback(true);
            });
        });
    }

    setApproachTransitionIndex(transitionIndex, callback = EmptyCallback.Boolean) {
        const arrivalIndex = this.flightPlanManager.getArrivalProcIndex();
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setApproachTransitionIndex(transitionIndex, () => {
                this.flightPlanManager.setArrivalProcIndex(arrivalIndex, () => {
                    callback(true);
                });
            });
        });
    }

    setArrivalProcIndex(arrivalIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setArrivalProcIndex(arrivalIndex, () => {
                callback(true);
            });
        });
    }

    setArrivalIndex(arrivalIndex, transitionIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setArrivalEnRouteTransitionIndex(transitionIndex, () => {
                this.flightPlanManager.setArrivalProcIndex(arrivalIndex, () => {
                    callback(true);
                });
            });
        });
    }

    setApproachIndex(approachIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setApproachIndex(approachIndex, () => {
                const frequency = this.flightPlanManager.getApproachNavFrequency();
                if (isFinite(frequency)) {
                    const freq = Math.round(frequency * 100) / 100;
                    if (this.connectIlsFrequency(freq)) {
                        this._ilsFrequencyPilotEntered = false;
                        SimVar.SetSimVarValue("L:FLIGHTPLAN_APPROACH_ILS", "number", freq);
                        const approach = this.flightPlanManager.getApproach();
                        if (approach && approach.name && approach.name.indexOf("ILS") !== -1) {
                            const runway = this.flightPlanManager.getApproachRunway();
                            if (runway) {
                                SimVar.SetSimVarValue("L:FLIGHTPLAN_APPROACH_COURSE", "number", runway.direction);
                            }
                        }
                    }
                }
                callback(true);
            });
        });
    }

    updateFlightNo(flightNo, callback = EmptyCallback.Boolean) {
        if (flightNo.length > 7) {
            this.addNewMessage(NXSystemMessages.notAllowed);
            return callback(false);
        }

        SimVar.SetSimVarValue("ATC FLIGHT NUMBER", "string", flightNo, "FMC").then(() => {
            NXApi.connectTelex(flightNo)
                .then(() => {
                    callback(true);
                })
                .catch((err) => {
                    if (err !== NXApi.disabledError) {
                        this.addNewMessage(NXFictionalMessages.fltNbrInUse);
                        return callback(false);
                    }

                    return callback(true);
                });
        });
    }

    updateCoRoute(coRoute, callback = EmptyCallback.Boolean) {
        if (coRoute.length > 2) {
            if (coRoute.length < 10) {
                if (coRoute === "NONE") {
                    this.coRoute = undefined;
                } else {
                    this.coRoute = coRoute;
                }
                return callback(true);
            }
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return callback(false);
    }

    getTotalTripTime() {
        return this._routeTripTime;
    }

    getTotalTripFuelCons() {
        return this._routeTripFuelWeight;
    }

    getOrSelectVORsByIdent(ident, callback) {
        this.dataManager.GetVORsByIdent(ident).then((navaids) => {
            if (!navaids || navaids.length === 0) {
                this.addNewMessage(NXSystemMessages.notInDatabase);
                return callback(undefined);
            }
            if (navaids.length === 1) {
                return callback(navaids[0]);
            }
            A320_Neo_CDU_SelectWptPage.ShowPage(this, navaids, callback);
        });
    }
    getOrSelectNDBsByIdent(ident, callback) {
        this.dataManager.GetNDBsByIdent(ident).then((navaids) => {
            if (!navaids || navaids.length === 0) {
                this.addNewMessage(NXSystemMessages.notInDatabase);
                return callback(undefined);
            }
            if (navaids.length === 1) {
                return callback(navaids[0]);
            }
            A320_Neo_CDU_SelectWptPage.ShowPage(this, navaids, callback);
        });
    }

    getOrSelectWaypointByIdent(ident, callback) {
        this.dataManager.GetWaypointsByIdent(ident).then((waypoints) => {
            if (!waypoints || waypoints.length === 0) {
                return callback(undefined);
            }
            if (waypoints.length === 1) {
                return callback(waypoints[0]);
            }
            A320_Neo_CDU_SelectWptPage.ShowPage(this, waypoints, callback);
        });
    }

    insertWaypoint(newWaypointTo, index, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(async () => {
            this.getOrSelectWaypointByIdent(newWaypointTo, (waypoint) => {
                if (!waypoint) {
                    this.addNewMessage(NXSystemMessages.notInDatabase);
                    return callback(false);
                }
                this.flightPlanManager.addWaypoint(waypoint.icao, index, () => {
                    return callback(true);
                });
            });
        });
    }

    activateDirectToWaypoint(waypoint, callback = EmptyCallback.Void) {
        const waypoints = this.flightPlanManager.getWaypoints();
        const indexInFlightPlan = waypoints.findIndex(w => {
            return w.icao === waypoint.icao;
        });
        let i = 1;
        const removeWaypointMethod = (callback = EmptyCallback.Void) => {
            if (i < indexInFlightPlan) {
                this.flightPlanManager.removeWaypoint(1, i === indexInFlightPlan - 1, () => {
                    i++;
                    removeWaypointMethod(callback);
                });
            } else {
                callback();
            }
        };
        removeWaypointMethod(() => {
            this.flightPlanManager.activateDirectTo(waypoint.infos.icao, callback);
        });
    }

    async insertWaypointsAlongAirway(lastWaypointIdent, index, airwayName, callback = EmptyCallback.Boolean) {
        const referenceWaypoint = this.flightPlanManager.getWaypoint(index - 1);
        const lastWaypointIdentPadEnd = lastWaypointIdent.padEnd(5, " ");
        if (referenceWaypoint) {
            const infos = referenceWaypoint.infos;
            if (infos instanceof WayPointInfo) {
                await referenceWaypoint.infos.UpdateAirways(); // Sometimes the waypoint is initialized without waiting to the airways array to be filled
                const airway = infos.airways.find(a => {
                    return a.name === airwayName;
                });
                if (airway) {
                    const firstIndex = airway.icaos.indexOf(referenceWaypoint.icao);
                    const lastWaypointIcao = airway.icaos.find(icao => icao.substring(7, 12) === lastWaypointIdentPadEnd);
                    const lastIndex = airway.icaos.indexOf(lastWaypointIcao);
                    if (firstIndex >= 0) {
                        if (lastIndex >= 0) {
                            let inc = 1;
                            if (lastIndex < firstIndex) {
                                inc = -1;
                            }
                            index -= 1;
                            const count = Math.abs(lastIndex - firstIndex);
                            for (let i = 1; i < count + 1; i++) { // 9 -> 6
                                const syncInsertWaypointByIcao = async (icao, idx) => {
                                    return new Promise(resolve => {
                                        console.log("add icao:" + icao + " @ " + idx);
                                        this.flightPlanManager.addWaypoint(icao, idx, () => {
                                            const waypoint = this.flightPlanManager.getWaypoint(idx);
                                            waypoint.infos.airwayIn = airwayName;
                                            if (i < count) {
                                                waypoint.infos.airwayOut = airwayName;
                                            }
                                            console.log("icao:" + icao + " added");
                                            resolve();
                                        });
                                    });
                                };

                                await syncInsertWaypointByIcao(airway.icaos[firstIndex + i * inc], index + i);
                            }
                            callback(true);
                            return;
                        }
                        this.addNewMessage(NXFictionalMessages.secondIndexNotFound);
                        return callback(false);
                    }
                    this.addNewMessage(NXFictionalMessages.firstIndexNotFound);
                    return callback(false);
                }
                this.addNewMessage(NXFictionalMessages.noRefWpt);
                return callback(false);
            }
            this.addNewMessage(NXFictionalMessages.noWptInfos);
            return callback(false);
        }
        this.addNewMessage(NXFictionalMessages.noRefWpt);
        return callback(false);
    }

    // Copy airway selections from temporary to active flightplan
    async copyAirwaySelections() {
        const temporaryFPWaypoints = this.flightPlanManager.getWaypoints(1);
        const activeFPWaypoints = this.flightPlanManager.getWaypoints(0);
        for (let i = 0; i < activeFPWaypoints.length; i++) {
            if (activeFPWaypoints[i].infos && temporaryFPWaypoints[i] && activeFPWaypoints[i].icao === temporaryFPWaypoints[i].icao && temporaryFPWaypoints[i].infos) {
                activeFPWaypoints[i].infos.airwayIn = temporaryFPWaypoints[i].infos.airwayIn;
                activeFPWaypoints[i].infos.airwayOut = temporaryFPWaypoints[i].infos.airwayOut;
            }
        }
    }

    removeWaypoint(index, callback = EmptyCallback.Void) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.removeWaypoint(index, true, callback);
        });
    }

    eraseTemporaryFlightPlan(callback = EmptyCallback.Void) {
        this.flightPlanManager.setCurrentFlightPlanIndex(0, () => {
            SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 0);
            SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 0);
            callback();
        });
    }

    insertTemporaryFlightPlan(callback = EmptyCallback.Void) {
        if (this.flightPlanManager.getCurrentFlightPlanIndex() === 1) {
            this.flightPlanManager.copyCurrentFlightPlanInto(0, () => {
                this.flightPlanManager.setCurrentFlightPlanIndex(0, () => {
                    SimVar.SetSimVarValue("L:FMC_FLIGHT_PLAN_IS_TEMPORARY", "number", 0);
                    SimVar.SetSimVarValue("L:MAP_SHOW_TEMPORARY_FLIGHT_PLAN", "number", 0);
                    callback();
                });
            });
        }
    }

    vSpeedsValid() {
        return (!!this.v1Speed && !!this.vRSpeed ? this.v1Speed <= this.vRSpeed : true)
            && (!!this.vRSpeed && !!this.v2Speed ? this.vRSpeed <= this.v2Speed : true)
            && (!!this.v1Speed && !!this.v2Speed ? this.v1Speed <= this.v2Speed : true);
    }

    vSpeedDisagreeCheck() {
        if (!this.vSpeedsValid()) {
            this.addNewMessage(NXSystemMessages.vToDisagree, this.vSpeedsValid.bind(this));
        }
    }

    trySetV1Speed(s) {
        if (!/^\d+$/.test(s)) {
            this.addNewMessage(NXSystemMessages.formatError);
            return false;
        }
        const v = parseInt(s);
        if (isFinite(v)) {
            if (v >= 90 && v < 1000) {
                this.v1Speed = v;
                SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", this.v1Speed).then(() => {
                    this.vSpeedDisagreeCheck();
                });
                return true;
            }
            this.addNewMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    trySetVRSpeed(s) {
        if (!/^\d+$/.test(s)) {
            this.addNewMessage(NXSystemMessages.formatError);
            return false;
        }
        const v = parseInt(s);
        if (isFinite(v)) {
            if (v >= 90 && v < 1000) {
                this.vRSpeed = v;
                SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", this.vRSpeed).then(() => {
                    this.vSpeedDisagreeCheck();
                });
                return true;
            }
            this.addNewMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    trySetV2Speed(s) {
        if (!/^\d+$/.test(s)) {
            this.addNewMessage(NXSystemMessages.formatError);
            return false;
        }
        const v = parseInt(s);
        if (isFinite(v)) {
            if (v >= 90 && v < 1000) {
                this.v2Speed = v;
                SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", this.v2Speed).then(() => {
                    this.vSpeedDisagreeCheck();
                });
                return true;
            }
            this.addNewMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    trySetTransAltitude(s) {
        if (!/^\d+$/.test(s)) {
            this.addNewMessage(NXSystemMessages.formatError);
            return false;
        }
        const v = parseInt(s);
        if (isFinite(v) && v > 0) {
            this.transitionAltitude = v;
            SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", v);
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    trySetThrustReductionAccelerationAltitude(s) {
        let thrRed = NaN;
        let accAlt = NaN;
        if (s) {
            const sSplit = s.split("/");
            thrRed = parseInt(sSplit[0]);
            accAlt = parseInt(sSplit[1]);
        }
        if (isFinite(thrRed) || isFinite(accAlt)) {
            if (isFinite(thrRed)) {
                this.thrustReductionAltitude = thrRed;
                SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT", "Number", this.thrustReductionAltitude);
            }
            if (isFinite(accAlt)) {
                this.accelerationAltitude = accAlt;
                SimVar.SetSimVarValue("L:AIRLINER_ACC_ALT", "Number", this.accelerationAltitude);
            }
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    trySetThrustReductionAccelerationAltitudeGoaround(s) {
        let thrRed = NaN;
        let accAlt = NaN;
        if (s) {
            const sSplit = s.split("/");
            thrRed = parseInt(sSplit[0]);
            accAlt = parseInt(sSplit[1]);
        }
        if ((isFinite(thrRed) || isFinite(accAlt)) && thrRed <= accAlt) {
            if (isFinite(thrRed)) {
                this.thrustReductionAltitudeGoaround = thrRed;
                SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT_GOAROUND", "Number", this.thrustReductionAltitudeGoaround);
            }
            if (isFinite(accAlt)) {
                this.accelerationAltitudeGoaround = accAlt;
                SimVar.SetSimVarValue("L:AIRLINER_ACC_ALT_GOAROUND", "Number", this.accelerationAltitudeGoaround);
            }
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    trySetEngineOutAcceleration(s) {
        const engOutAcc = parseInt(s);
        if (isFinite(engOutAcc)) {
            this.engineOutAccelerationGoaround = engOutAcc;
            SimVar.SetSimVarValue("L:AIRLINER_ENG_OUT_ACC_ALT_GOAROUND", "Number", this.engineOutAccelerationGoaround);
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    getFlapSpeed() {
        const phase = Simplane.getCurrentFlightPhase();
        const flapsHandleIndex = Simplane.getFlapsHandleIndex();
        let flapSpeed = 100;
        if (flapsHandleIndex == 1) {
            let slatSpeed = 0;
            if (phase == FlightPhase.FLIGHT_PHASE_TAKEOFF || phase == FlightPhase.FLIGHT_PHASE_CLIMB || phase == FlightPhase.FLIGHT_PHASE_GOAROUND) {
                slatSpeed = Simplane.getStallSpeedPredicted(flapsHandleIndex - 1) * 1.25;
            } else if (phase == FlightPhase.FLIGHT_PHASE_DESCENT || phase == FlightPhase.FLIGHT_PHASE_APPROACH) {
                slatSpeed = this.getSlatApproachSpeed();
            }
            return slatSpeed;
        }
        if (flapsHandleIndex == 2 || flapsHandleIndex == 3) {
            if (phase == FlightPhase.FLIGHT_PHASE_TAKEOFF || phase == FlightPhase.FLIGHT_PHASE_CLIMB || phase == FlightPhase.FLIGHT_PHASE_GOAROUND) {
                flapSpeed = Simplane.getStallSpeedPredicted(flapsHandleIndex - 1) * 1.26;
            } else if (phase == FlightPhase.FLIGHT_PHASE_DESCENT || phase == FlightPhase.FLIGHT_PHASE_APPROACH) {
                flapSpeed = this.getFlapApproachSpeed();
            }
        }
        return flapSpeed;
    }

    getCleanTakeOffSpeed() {
        const dWeight = (this.getWeight() - 42) / (75 - 42);
        return 204 + 40 * dWeight;
    }

    updateCleanTakeOffSpeed() {
        const toGreenDotSpeed = this.getCleanTakeOffSpeed();
        if (isFinite(toGreenDotSpeed)) {
            SimVar.SetSimVarValue("L:AIRLINER_TO_GREEN_DOT_SPD", "Number", toGreenDotSpeed);
        }
    }

    setPerfTOFlexTemp(s) {
        const value = parseFloat(s);
        if (isFinite(value) && value > -270 && value < 150) {
            this.perfTOTemp = value;
            SimVar.SetSimVarValue("L:AIRLINER_TO_FLEX_TEMP", "Number", this.perfTOTemp);
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    getCrzManagedSpeed() {
        let dCI = this.costIndex / 999;
        dCI = dCI * dCI;
        let speed = 290 * (1 - dCI) + 310 * dCI;
        if (SimVar.GetSimVarValue("PLANE ALTITUDE", "feet") < 10000) {
            speed = Math.min(speed, 250);
        }
        return speed;
    }

    getDesManagedSpeed() {
        const dCI = this.costIndex / 999;
        const flapsHandleIndex = Simplane.getFlapsHandleIndex();
        if (flapsHandleIndex != 0) {
            return this.getFlapSpeed();
        }
        let speed = 288 * (1 - dCI) + 300 * dCI;
        if (SimVar.GetSimVarValue("PLANE ALTITUDE", "feet") < 10000) {
            speed = Math.min(speed, 250);
        }
        return Math.min(speed, this.getSpeedConstraint());
    }

    getFlapApproachSpeed() {
        if (isFinite(this._overridenFlapApproachSpeed)) {
            return this._overridenFlapApproachSpeed;
        }
        const dWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "kilograms") / 1000;
        switch (true) {
            case (dWeight <= 50):
                return 131;
            case (dWeight <= 55):
                return Math.ceil(131 + 1.2 * (dWeight - 50));
            case (dWeight <= 60):
                return Math.ceil(137 + 1.4 * (dWeight - 55));
            case (dWeight <= 65):
                return Math.ceil(144 + dWeight - 60);
            case (dWeight <= 70):
                return Math.ceil(149 + 1.2 * (dWeight - 65));
            case (dWeight <= 75):
                return Math.ceil(155 + dWeight - 70);
            default:
                return Math.ceil(160 + 1.20 * (dWeight - 75));
        }
    }

    getSlatApproachSpeed() {
        if (isFinite(this._overridenSlatApproachSpeed)) {
            return this._overridenSlatApproachSpeed;
        }
        const dWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "kilograms") / 1000;
        switch (true) {
            case (dWeight <= 45):
                return Math.ceil(152 + 1.8 * (dWeight - 40));
            case (dWeight <= 50):
                return Math.ceil(161 + 1.6 * (dWeight - 45));
            case (dWeight <= 55):
                return Math.ceil(169 + 1.8 * (dWeight - 50));
            case (dWeight <= 60):
                return Math.ceil(178 + 1.6 * (dWeight - 55));
            default:
                return Math.ceil(186 + 1.4 * (dWeight - 60));
        }
    }

    updateCleanApproachSpeed() {
        const apprGreenDotSpeed = this.getPerfGreenDotSpeed();
        if (isFinite(apprGreenDotSpeed)) {
            SimVar.SetSimVarValue("L:AIRLINER_APPR_GREEN_DOT_SPD", "Number", apprGreenDotSpeed);
        }
    }
    isTaxiFuelInRange(taxi) {
        return 0 <= taxi && taxi <= 9.9;
    }

    /**
     * Attempts to predict required block fuel for trip
     * @returns {boolean}
     */
    tryFuelPlanning() {
        if (this._fuelPlanningPhase === this._fuelPlanningPhases.IN_PROGRESS) {
            this._blockFuelEntered = true;
            this._fuelPlanningPhase = this._fuelPlanningPhases.COMPLETED;
            return true;
        }
        const tempRouteFinalFuelTime = this._routeFinalFuelTime;
        this.tryUpdateRouteFinalFuel();
        this.tryUpdateRouteAlternate();
        this.tryUpdateRouteTrip();
        this.tryUpdateMinDestFob();

        this._routeFinalFuelTime = tempRouteFinalFuelTime;
        this._routeFinalFuelWeight = (this._routeFinalFuelTime * this._rteFinalCoeffecient) / 1000;

        this.blockFuel = this.getTotalTripFuelCons() + this._minDestFob + this.taxiFuelWeight;
        this._fuelPlanningPhase = this._fuelPlanningPhases.IN_PROGRESS;
        return true;
    }
    async trySetTaxiFuelWeight(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.taxiFuelWeight = this._defaultTaxiFuelWeight;
            this._taxiEntered = false;
            return true;
        }
        if (!/[0-9]+(\.[0-9][0-9]?)?/.test(s)) {
            this.addNewMessage(NXSystemMessages.formatError);
            return false;
        }
        const value = parseFloat(s) * this._conversionWeight;
        if (isFinite(value) && value >= 0) {
            if (this.isTaxiFuelInRange(value)) {
                this._taxiEntered = true;
                this.taxiFuelWeight = value;
                return true;
            } else {
                this.addNewMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    getRouteFinalFuelWeight() {
        if (isFinite(this._routeFinalFuelWeight)) {
            this._routeFinalFuelWeight = (this._routeFinalFuelTime * this._rteFinalCoeffecient) / 1000;
            return this._routeFinalFuelWeight;
        }
    }

    getRouteFinalFuelTime() {
        return this._routeFinalFuelTime;
    }

    isFinalFuelInRange(fuel) {
        return 0 <= fuel && fuel <= 100;
    }

    isFinalTimeInRange(time) {
        const convertedTime = FMCMainDisplay.hhmmToMinutes(time.padStart(4,"0"));
        return 0 <= convertedTime && convertedTime <= 90;
    }

    /**
     * This method is used to set initial Final Time for when INIT B is making predictions
     * @param {String} s - containing time value
     * @returns {boolean}
     */
    async trySetRouteFinalTime(s) {
        if (s) {
            if (s === FMCMainDisplay.clrValue) {
                this._routeFinalFuelTime = this._routeFinalFuelTimeDefault;
                return true;
            }
            const rteFinalTime = s.split("/")[1];
            if (rteFinalTime !== undefined) {
                if (this.isFinalTimeInRange(rteFinalTime)) {
                    this._routeFinalFuelTime = FMCMainDisplay.hhmmToMinutes(rteFinalTime.padStart(4,"0"));
                    return true;
                } else {
                    this.addNewMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
            }
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    /**
     *
     * @param {string} s
     * @returns {Promise<boolean>}
     */
    async trySetRouteFinalFuel(s) {
        if (s === FMCMainDisplay.clrValue) {
            this._routeFinalFuelTime = this._routeFinalFuelTimeDefault;
            this._rteFinalEntered = false;
            return true;
        }
        if (s) {
            this._rteFinalEntered = true;
            const rteFinalWeight = parseFloat(s.split("/")[0]) / this._conversionWeight;
            const rteFinalTime = s.split("/")[1];
            if (rteFinalTime === undefined) {
                if (this.isFinalFuelInRange(rteFinalWeight)) {
                    this._routeFinalFuelWeight = rteFinalWeight;
                    this._routeFinalFuelTime = (rteFinalWeight * 1000) / this._rteFinalCoeffecient;
                    return true;
                } else {
                    this.addNewMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
            } else {
                if (this.isFinalTimeInRange(rteFinalTime)) {
                    this._routeFinalFuelTime = FMCMainDisplay.hhmmToMinutes(rteFinalTime.padStart(4,"0"));
                    this._routeFinalFuelWeight = (this._routeFinalFuelTime * this._rteFinalCoeffecient) / 1000;
                    return true;
                } else {
                    this.addNewMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
            }
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    getRouteReservedWeight() {
        if (isFinite(this._routeReservedWeight) && this._routeReservedWeight !== 0) {
            return this._routeReservedWeight;
        } else {
            return this._routeReservedPercent * this.blockFuel / 100;
        }
    }

    getRouteReservedPercent() {
        if (isFinite(this._routeReservedWeight) && isFinite(this.blockFuel) && this._routeReservedWeight !== 0) {
            return this._routeReservedWeight / this.blockFuel * 100;
        }
        return this._routeReservedPercent;
    }
    trySetRouteReservedPercent(s) {
        if (s) {
            if (s === FMCMainDisplay.clrValue) {
                this._rteReservedEntered = false;
                this._routeReservedWeight = 0;
                this._routeReservedPercent = 5;
                return true;
            }
            const rteRsvPercent = parseFloat(s.split("/")[1]);
            if (!this.isRteRsvPercentInRange(rteRsvPercent)) {
                this._rteRsvPercentOOR = true;
                this.addNewMessage(NXSystemMessages.notAllowed);
                return false;
            }
            this._rteRsvPercentOOR = false;
            if (isFinite(rteRsvPercent)) {
                this._routeReservedWeight = NaN;
                this._routeReservedPercent = rteRsvPercent;
                return true;
            }
            this.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    /**
     * Checks input and passes to trySetCruiseFl()
     * @param input
     * @returns {boolean} input passed checks
     */
    trySetCruiseFlCheckInput(input) {
        if (input === FMCMainDisplay.clrValue) {
            this.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        }
        const flString = input.replace("FL", "");
        if (!flString) {
            this.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        }
        return this.trySetCruiseFl(parseFloat(flString));
    }

    /**
     * Sets new Cruise FL if all conditions good
     * @param fl {number} Altitude or FL
     * @returns {boolean} input passed checks
     */
    trySetCruiseFl(fl) {
        if (!isFinite(fl)) {
            this.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        }
        if (fl >= 1000) {
            fl = Math.floor(fl / 100);
        }
        if (fl > this.maxCruiseFL) {
            this.addNewMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        const phase = Simplane.getCurrentFlightPhase();
        const selFl = Math.floor(Math.max(0, Simplane.getAutoPilotSelectedAltitudeLockValue("feet")) / 100);
        if (fl < selFl && phase === FlightPhase.FLIGHT_PHASE_CLIMB) {
            this.addNewMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        if (fl > Math.floor(Simplane.getAltitude() / 100) && phase > FlightPhase.FLIGHT_PHASE_CRUISE) {
            this.addNewMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        if (fl < selFl && fl < 10 && phase === FlightPhase.FLIGHT_PHASE_CLIMB || phase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            this.cruiseFlightLevel = selFl;
            this._cruiseEntered = true;
            this.cruiseTemperature = undefined;
            this.updateConstraints();
            return true;
        }
        if (fl > 0 && fl <= this.maxCruiseFL) {
            this.cruiseFlightLevel = fl;
            this._cruiseEntered = true;
            this.cruiseTemperature = undefined;
            this.updateConstraints();
            return true;
        }
        this.addNewMessage(NXSystemMessages.entryOutOfRange);
        return false;
    }

    isRteRsvPercentInRange(value) {
        return value > 0 && value < 15;
    }

    trySetRouteReservedFuel(s) {
        if (s) {
            if (s === FMCMainDisplay.clrValue) {
                this._rteReservedEntered = false;
                this._routeReservedWeight = 0;
                this._routeReservedPercent = 5;
                this._rteRsvPercentOOR = false;
                return true;
            }
            const rteRsvWeight = parseFloat(s.split("/")[0]) / this._conversionWeight;
            const rteRsvPercent = parseFloat(s.split("/")[1]);
            if (!this.isRteRsvPercentInRange(rteRsvPercent)) {
                this._rteRsvPercentOOR = true;
                return true;
            }
            this._rteRsvPercentOOR = false;
            this._rteReservedEntered = true;
            if (isFinite(rteRsvWeight)) {
                this._routeReservedWeight = rteRsvWeight;
                this._routeReservedPercent = 0;
                if (this.isRteRsvPercentInRange(this.getRouteReservedPercent())) { // Bit of a hacky method due previous tight coupling of weight and percentage calculations
                    return true;
                } else {
                    this.trySetRouteReservedFuel(FMCMainDisplay.clrValue);
                    this._rteRsvPercentOOR = true;
                    return false;
                }
            } else if (isFinite(rteRsvPercent)) {
                this._routeReservedWeight = NaN;
                this._routeReservedPercent = rteRsvPercent;
                return true;
            }
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    updateTakeOffTrim() {
        let d = (this.zeroFuelWeightMassCenter - 13) / (33 - 13);
        d = Math.min(Math.max(d, -0.5), 1);
        let dW = (this.getWeight(true) - 400) / (800 - 400);
        dW = Math.min(Math.max(dW, 0), 1);
        const minTrim = 3.5 * dW + 1.5 * (1 - dW);
        const maxTrim = 8.6 * dW + 4.3 * (1 - dW);
        this.takeOffTrim = minTrim * d + maxTrim * (1 - d);
    }

    getZeroFuelWeight(useLbs = false) {
        if (useLbs) {
            return this.zeroFuelWeight * 2.204623;
        }
        return this.zeroFuelWeight;
    }

    setZeroFuelWeight(s, callback = EmptyCallback.Boolean, useLbs = false) {
        let value = parseFloat(s);
        if (isFinite(value)) {
            if (useLbs) {
                value = value / 2.204623;
            }
            this.zeroFuelWeight = value;
            this.updateTakeOffTrim();
            return callback(true);
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        callback(false);
    }

    setZeroFuelCG(s, callback = EmptyCallback.Boolean) {
        const value = parseFloat(s);
        if (isFinite(value) && value > 0 && value < 100) {
            this.zeroFuelWeightMassCenter = value;
            this.updateTakeOffTrim();
            return callback(true);
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        callback(false);
    }

    isZFWInRange(zfw) {
        return 35.0 <= zfw && zfw <= 80.0; //TODO figure out how to handle LBs and KG input
    }

    isZFWCGInRange(zfwcg) {
        return (8.0 <= zfwcg && zfwcg <= 50.0);
    }

    tryEditZeroFuelWeightZFWCG(zfw = 0, zfwcg = 0, useLbs = false) {
        if (zfw > 0) {
            if (this.isZFWInRange(zfw)) {
                if (useLbs) {
                    zfw = zfw / 2.204623;
                }
                this.setZeroFuelWeight(zfw.toString());
            } else {
                this.addNewMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        }
        if (zfwcg > 0) {
            if (this.isZFWCGInRange(zfwcg)) {
                this.setZeroFuelCG(zfwcg.toString());
            } else {
                this.addNewMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        }
        this.updateTakeOffTrim();
        this.updateCleanTakeOffSpeed();
        this.updateCleanApproachSpeed();
        return true;
    }

    async trySetZeroFuelWeightZFWCG(s, useLbs = false) {
        let zfw = 0;
        let zfwcg = 0;
        if (s) {
            if (s.includes("/")) {
                const sSplit = s.split("/");
                zfw = parseFloat(sSplit[0]) / this._conversionWeight;
                zfwcg = parseFloat(sSplit[1]);
            } else {
                zfw = parseFloat(s) / this._conversionWeight;
            }
        }
        if (zfw > 0 && zfwcg > 0) {
            if (this.isZFWInRange(zfw) && this.isZFWCGInRange(zfwcg)) {
                this._zeroFuelWeightZFWCGEntered = true;
                if (useLbs) {
                    zfw = zfw / 2.204623;
                }

                this.setZeroFuelWeight(zfw.toString());
                this.setZeroFuelCG(zfwcg.toString());

                this.updateTakeOffTrim();
                this.updateCleanTakeOffSpeed();
                this.updateCleanApproachSpeed();
                return true;
            } else {
                this.addNewMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }
        }
        if (this._zeroFuelWeightZFWCGEntered) {
            return this.tryEditZeroFuelWeightZFWCG(zfw, zfwcg, useLbs);
        }
        this.addNewMessage(NXSystemMessages.formatError);
        return false;
    }

    /**
     *
     * @param useLbs states whether to return the weight back in tons or pounds
     * @returns {*}
     */
    getFOB(useLbs = false) {
        if (useLbs) {
            return SimVar.GetSimVarValue("FUEL TOTAL QUANTITY WEIGHT", "pound");
        } else {
            return (SimVar.GetSimVarValue("FUEL TOTAL QUANTITY WEIGHT", "pound") * 0.453592) / 1000;
        }
    }

    /**
     * retrieves GW in Tons
     * @returns {number}
     */
    getGW() {
        return (SimVar.GetSimVarValue("TOTAL WEIGHT", "Pounds") * 0.45359237) / 1000;
    }

    getCG() {
        return SimVar.GetSimVarValue("CG PERCENT", "Percent over 100") * 100;
    }

    /**
     *
     * @returns {number} Returns estimated fuel on board when arriving at the destination
     */
    getDestEFOB(useFOB = false) {
        if (useFOB) {
            return this.getFOB() - this._routeTripFuelWeight - this.taxiFuelWeight;
        } else {
            return this.blockFuel - this._routeTripFuelWeight - this.taxiFuelWeight;
        }
    }

    /**
     * @returns {number} Returns EFOB when arriving at the alternate dest
     */
    getAltEFOB(useFOB = false) {
        return this.getDestEFOB(useFOB) - this._routeAltFuelWeight;
    }

    isBlockFuelInRange(fuel) {
        return 0 <= fuel && fuel <= 80;
    }

    trySetBlockFuel(s, useLbs = false) {
        if (s === FMCMainDisplay.clrValue) {
            this.blockFuel = 0.0;
            this._blockFuelEntered = false;
            this._fuelPredDone = false;
            this._fuelPlanningPhase = this._fuelPlanningPhases.PLANNING;
            return true;
        }
        let value = parseFloat(s) / this._conversionWeight;
        if (isFinite(value) && this.isBlockFuelInRange(value)) {
            if (this.isBlockFuelInRange(value)) {
                if (useLbs) {
                    value = value / 2.204623;
                }
                this.blockFuel = value;
                this.updateTakeOffTrim();
                this._blockFuelEntered = true;
                return true;
            } else {
                this.addNewMessage(NXSystemMessages.entryOutOfRange);
                return false;
            }

        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    getWeight(useLbs = false) {
        let w = this.zeroFuelWeight + this.blockFuel;
        if (useLbs) {
            w *= 2.204623;
        }
        return w;
    }

    async trySetTakeOffWeightLandingWeight(s) {
        let tow = NaN;
        let lw = NaN;
        if (s) {
            const sSplit = s.split("/");
            tow = parseFloat(sSplit[0]);
            lw = parseFloat(sSplit[1]);
        }
        if (isFinite(tow) || isFinite(lw)) {
            if (isFinite(tow)) {
                this.takeOffWeight = tow;
            }
            if (isFinite(lw)) {
                this.landingWeight = lw;
            }
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    isAvgWindInRange(wind) {
        return 0 <= wind && wind <= 250;
    }

    async trySetAverageWind(s) {
        const validDelims = ["HD", "H", "-", "TL", "T", "+", ""]; // Based on arrays being iterated, it will check values like "23" last
        const matchedIndex = validDelims.findIndex(element => s.includes(element));

        if (matchedIndex >= 0) {
            const wind = parseFloat(s.split(validDelims[matchedIndex])[1]);

            this._windDir = matchedIndex <= 2 ? this._windDirections.HEADWIND : this._windDirections.TAILWIND;

            if (isFinite(wind)) {
                if (this.isAvgWindInRange(wind)) {
                    this.averageWind = wind;
                    return true;
                } else {
                    this.addNewMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
            } else {
                this.addNewMessage(NXSystemMessages.formatError);
                return false;
            }
        } else {
            this.addNewMessage(NXSystemMessages.formatError);
            return false;
        }
    }

    trySetPreSelectedClimbSpeed(s) {
        const v = parseFloat(s);
        if (isFinite(v)) {
            this.preSelectedClbSpeed = v;
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    trySetPreSelectedCruiseSpeed(s) {
        const v = parseFloat(s);
        if (isFinite(v)) {
            this.preSelectedCrzSpeed = v;
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    trySetPreSelectedDescentSpeed(s) {
        const v = parseFloat(s);
        if (isFinite(v)) {
            this.preSelectedDesSpeed = v;
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    setPerfApprQNH(s) {
        const value = parseFloat(s);
        const QNH_REGEX = /[0-9]{2}.[0-9]{2}/;

        if (QNH_REGEX.test(value)) {
            this.perfApprQNH = value;
            return true;
        } else if (isFinite(value)) {
            this.perfApprQNH = value;
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    setPerfApprTemp(s) {
        const value = parseFloat(s);
        if (isFinite(value) && value > -270 && value < 150) {
            this.perfApprTemp = value;
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    setPerfApprWind(s) {
        let heading = NaN;
        let speed = NaN;
        if (s) {
            const sSplit = s.split("/");
            heading = parseFloat(sSplit[0]);
            speed = parseFloat(sSplit[1]);
        }
        if ((isFinite(heading) && heading >= 0 && heading < 360) || (isFinite(speed) && speed > 0)) {
            if (isFinite(heading)) {
                this.perfApprWindHeading = heading;
            }
            if (isFinite(speed)) {
                this.perfApprWindSpeed = speed;
            }
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    setPerfApprTransAlt(s) {
        if (!/^\d+$/.test(s)) {
            this.addNewMessage(NXSystemMessages.formatError);
            return false;
        }
        const v = parseInt(s);
        if (isFinite(v) && v > 0) {
            this.perfApprTransAlt = v;
            SimVar.SetSimVarValue("L:AIRLINER_APPR_TRANS_ALT", "Number", v);
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    /**
     * VApp for _selected_ landing config
     */
    getVApp() {
        if (isFinite(this.vApp)) {
            return this.vApp;
        }
        return this.approachSpeeds.vapp;
    }

    setPerfApprVApp(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.vApp = NaN;
        }
        const value = parseFloat(s);
        if (isFinite(value) && value > 0) {
            this.vApp = value;
            return true;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    /**
     * VLS for current config (not selected landing config!)
     */
    getVLS() {
        return SimVar.GetSimVarValue("L:A32NX_SPEEDS_VLS", "Number");
    }

    /**
     * Tries to estimate the landing weight at destination
     * NaN on failure
     */
    tryEstimateLandingWeight() {
        let landingWeight;
        if (false /* TODO alt active */) {
            landingWeight = this.getAltEFOB(true) + this.zeroFuelWeight;
        } else {
            landingWeight = this.getDestEFOB(true) + this.zeroFuelWeight;
        }
        return isFinite(landingWeight) ? landingWeight : NaN;
    }

    setPerfApprMDA(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfApprMDA = NaN;
            SimVar.SetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "feet", 0);
            return true;
        } else {
            const value = parseFloat(s);
            if (isFinite(value)) {
                this.perfApprMDA = value;
                SimVar.SetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "feet", this.perfApprMDA);
                return true;
            }
            this.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        }
    }

    setPerfApprDH(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfApprDH = NaN;
            SimVar.SetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "feet", -1);
            return true;
        } else if (s === "NO" || s === "NO DH" || s === "NODH") {
            if (Simplane.getAutoPilotApproachType() === 4) {
                this.perfApprDH = "NO DH";
                SimVar.SetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "feet", -2);
                return true;
            } else {
                this.addNewMessage(NXSystemMessages.notAllowed);
                return false;
            }
        } else {
            const value = parseFloat(s);
            if (isFinite(value)) {
                if (value >= 0 && value <= 700) {
                    this.perfApprDH = value;
                    SimVar.SetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "feet", this.perfApprDH);
                    return true;
                } else {
                    this.addNewMessage(NXSystemMessages.entryOutOfRange);
                    return false;
                }
            }
            this.addNewMessage(NXSystemMessages.notAllowed);
            return false;
        }
    }

    setPerfApprFlaps3(s) {
        this.perfApprFlaps3 = s;
        SimVar.SetSimVarValue("L:A32NX_SPEEDS_LANDING_CONF3", "boolean", s);
    }
    getIsFlying() {
        return this.currentFlightPhase >= FlightPhase.FLIGHT_PHASE_TAKEOFF;
    }

    async tryGoInApproachPhase() {
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
            this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_APPROACH;
            Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
            SimVar.SetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool", 0);
            return true;
        }
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_APPROACH;
            Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
            SimVar.SetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool", 0);
            return true;
        }
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_DESCENT) {
            this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_APPROACH;
            Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
            SimVar.SetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool", 0);
            return true;
        }
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_GOAROUND) {
            this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_APPROACH;
            Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
            SimVar.SetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool", 0);
            return true;
        }
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_APPROACH) {
            SimVar.SetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool", 0);
            return true;
        }
        return false;
    }

    checkUpdateFlightPhase() {
        const airSpeed = SimVar.GetSimVarValue("AIRSPEED TRUE", "knots");
        const flapsHandlePercent = Simplane.getFlapsHandlePercent();
        const leftThrottleDetent = Simplane.getEngineThrottleMode(0);
        const rightThrottleDetent = Simplane.getEngineThrottleMode(1);
        const highestThrottleDetent = (leftThrottleDetent >= rightThrottleDetent) ? leftThrottleDetent : rightThrottleDetent;

        if (this.currentFlightPhase <= FlightPhase.FLIGHT_PHASE_TAKEOFF) {
            const isAirborne = !Simplane.getIsGrounded(); // TODO replace with proper flight mode in future
            const isTogaFlex = highestThrottleDetent === ThrottleMode.TOGA || highestThrottleDetent === ThrottleMode.FLEX_MCT;
            const flapsSlatsRetracted = (
                SimVar.GetSimVarValue("TRAILING EDGE FLAPS LEFT ANGLE", "degrees") === 0 &&
                SimVar.GetSimVarValue("TRAILING EDGE FLAPS RIGHT ANGLE", "degrees") === 0 &&
                SimVar.GetSimVarValue("LEADING EDGE FLAPS LEFT ANGLE", "degrees") === 0 &&
                SimVar.GetSimVarValue("LEADING EDGE FLAPS RIGHT ANGLE", "degrees") === 0
            );
            const pitchTakeoffEngaged = !isAirborne && isFinite(this.v2Speed) && isTogaFlex && !flapsSlatsRetracted;
            const isTakeOffValid = pitchTakeoffEngaged ||
                SimVar.GetSimVarValue("GPS GROUND SPEED", "knots") > 90 ||
                (
                    SimVar.GetSimVarValue("ENG N1 RPM:1", "Percent") >= 85 &&
                    SimVar.GetSimVarValue("ENG N1 RPM:2", "Percent") >= 85
                );

            //End preflight when takeoff power is applied and engines are running
            if (this.currentFlightPhase < FlightPhase.FLIGHT_PHASE_TAKEOFF && isTakeOffValid) {
                this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_TAKEOFF;
            }

            //Reset to preflight in case of RTO
            if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_TAKEOFF && !isTakeOffValid) {
                this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_PREFLIGHT;
                this.climbTransitionGroundAltitude = null;
            }
        }

        //Changes to climb phase when acceleration altitude is reached
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_TAKEOFF && airSpeed > 80) {
            const planeAltitudeMsl = Simplane.getAltitude();
            let accelerationAltitudeMsl = (this.accelerationAltitude || this.thrustReductionAltitude);

            if (!accelerationAltitudeMsl) {
                if (!this.climbTransitionGroundAltitude) {
                    const origin = this.flightPlanManager.getOrigin();
                    if (origin) {
                        this.climbTransitionGroundAltitude = origin.altitudeinFP;
                    }

                    if (!this.climbTransitionGroundAltitude) {
                        this.climbTransitionGroundAltitude = (parseInt(SimVar.GetSimVarValue("GROUND ALTITUDE", "feet")) || 0);
                    }
                }

                accelerationAltitudeMsl = this.climbTransitionGroundAltitude + parseInt(NXDataStore.get("CONFIG_ACCEL_ALT", "1500"));
            }

            if (planeAltitudeMsl > accelerationAltitudeMsl) {
                this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_CLIMB;
                this.climbTransitionGroundAltitude = null;
            }
        }

        //(Mostly) Default Asobo logic
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
            let remainInClimb = false;
            if (SimVar.GetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool") === 1) {
                if (SimVar.GetSimVarValue("L:A32NX_CRZ_ALT_SET_INITIAL", "bool") !== 1) {
                    remainInClimb = true;
                }
            }
            const altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "feet");
            const cruiseFlightLevel = this.cruiseFlightLevel * 100;
            if (isFinite(cruiseFlightLevel)) {
                if (altitude >= 0.96 * cruiseFlightLevel) {
                    if (!remainInClimb) {
                        this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_CRUISE;
                        SimVar.SetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool", 0);
                        Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
                    }
                }
            }
        }
        //(Mostly) Default Asobo logic
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            const altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "feets");
            const cruiseFlightLevel = this.cruiseFlightLevel * 100;
            if (isFinite(cruiseFlightLevel)) {
                if (altitude < 0.94 * cruiseFlightLevel) {
                    this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_DESCENT;
                    Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
                }
            }
        }
        //Default Asobo logic
        // Switches from any phase to APPR if less than 40 distance(?) from DEST
        if (this.flightPlanManager.getActiveWaypoint() === this.flightPlanManager.getDestination()) {
            if (SimVar.GetSimVarValue("L:FLIGHTPLAN_USE_DECEL_WAYPOINT", "number") != 1) {
                const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                const planeLla = new LatLongAlt(lat, long);
                const dist = Avionics.Utils.computeGreatCircleDistance(planeLla, this.flightPlanManager.getDestination().infos.coordinates);
                if (dist < 40 && this.currentFlightPhase != FlightPhase.FLIGHT_PHASE_GOAROUND) {
                    this.connectIls();
                    this.flightPlanManager.activateApproach();
                    if (this.currentFlightPhase != FlightPhase.FLIGHT_PHASE_APPROACH) {
                        console.log('switching to tryGoInApproachPhase: ' + JSON.stringify({lat, long, dist, prevPhase: this.currentFlightPhase}, null, 2));
                        this.tryGoInApproachPhase();
                    }
                }
            }
        }
        //Default Asobo logic
        // Switches from any phase to APPR if less than 3 distance(?) from DECEL
        if (SimVar.GetSimVarValue("L:FLIGHTPLAN_USE_DECEL_WAYPOINT", "number") === 1) {
            if (this.currentFlightPhase != FlightPhase.FLIGHT_PHASE_APPROACH) {
                if (this.flightPlanManager.decelWaypoint) {
                    const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                    const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                    const planeLla = new LatLongAlt(lat, long);
                    const dist = Avionics.Utils.computeGreatCircleDistance(this.flightPlanManager.decelWaypoint.infos.coordinates, planeLla);
                    if (dist < 3 && this.currentFlightPhase != FlightPhase.FLIGHT_PHASE_GOAROUND) {
                        this.flightPlanManager._decelReached = true;
                        this._waypointReachedAt = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
                        if (Simplane.getAltitudeAboveGround() < 9500) {
                            this.tryGoInApproachPhase();
                        }
                    }
                }
            }
        }
        //Logic to switch from APPR to GOAROUND
        //another condition getIsGrounded < 30sec
        if (this.currentFlightPhase == FlightPhase.FLIGHT_PHASE_APPROACH && highestThrottleDetent == ThrottleMode.TOGA && flapsHandlePercent != 0 && !Simplane.getAutoPilotThrottleActive() && SimVar.GetSimVarValue("RADIO HEIGHT", "feets") < 2000) {

            this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_GOAROUND;
            SimVar.SetSimVarValue("L:A32NX_GOAROUND_GATRK_MODE", "bool", 0);
            SimVar.SetSimVarValue("L:A32NX_GOAROUND_HDG_MODE", "bool", 0);
            SimVar.SetSimVarValue("L:A32NX_GOAROUND_NAV_MODE", "bool", 0);
            SimVar.SetSimVarValue("L:A32NX_GOAROUND_INIT_SPEED", "number", Simplane.getIndicatedSpeed());
            SimVar.SetSimVarValue("L:A32NX_GOAROUND_INIT_APP_SPEED", "number", this.getVApp());
            //delete override logic when we have valid nav data -aka goaround path- after goaround!
            SimVar.SetSimVarValue("L:A32NX_GOAROUND_NAV_OVERRIDE", "bool", 0);

            if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool") === 1) {
                SimVar.SetSimVarValue("K:AP_LOC_HOLD_ON", "number", 1); // Turns AP localizer hold !!ON/ARMED!! and glide-slope hold mode !!OFF!!
                SimVar.SetSimVarValue("K:AP_LOC_HOLD_OFF", "number", 1); // Turns !!OFF!! localizer hold mode
                SimVar.SetSimVarValue("K:AUTOPILOT_OFF", "number", 1);
                SimVar.SetSimVarValue("K:AUTOPILOT_ON", "number", 1);
                SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_APPR_MODE", "bool", 0);
                SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_LOC_MODE", "bool", 0);
            } else if (SimVar.GetSimVarValue("AUTOPILOT MASTER", "Bool") === 0 && SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "boolean") === 1) {
                SimVar.SetSimVarValue("AP_APR_HOLD_OFF", "number", 1);
                SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_APPR_MODE", "bool", 0);
                SimVar.SetSimVarValue("L:A32NX_AUTOPILOT_LOC_MODE", "bool", 0);
            }

            const currentHeading = Simplane.getHeadingMagnetic();
            Coherent.call("HEADING_BUG_SET", 1, currentHeading);

            CDUPerformancePage.ShowGOAROUNDPage(this);
        }

        //Logic to switch back from GOAROUND to CLB/CRZ
        //When missed approach or sec fpl are implemented this needs rework
        //Exit Scenario after successful GOAROUND
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_GOAROUND) {
            if (highestThrottleDetent === ThrottleMode.FLEX_MCT) {
                SimVar.SetSimVarValue("L:A32NX_GOAROUND_NAV_MODE", "bool", 1);
            }

            const planeAltitudeMsl = Simplane.getAltitude();
            const accelerationAltitudeMsl = this.accelerationAltitudeGoaround;

            if (planeAltitudeMsl > accelerationAltitudeMsl) {
                this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_CLIMB;
                SimVar.SetSimVarValue("L:A32NX_GOAROUND_PASSED", "bool", 1);
            }
        }

        //Resets flight phase to preflight 30 seconds after touchdown
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_APPROACH && Simplane.getAltitudeAboveGround() < 1.5) {
            if (this.landingResetTimer == null) {
                this.landingResetTimer = 30;
            }
            if (this.landingAutoBrakeTimer == null) {
                this.landingAutoBrakeTimer = SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Enum") === 1 ? 4 : 2;
            }
            if (this.lastPhaseUpdateTime == null) {
                this.lastPhaseUpdateTime = Date.now();
            }
            const deltaTime = Date.now() - this.lastPhaseUpdateTime;
            const deltaQuotient = deltaTime / 1000;
            this.lastPhaseUpdateTime = Date.now();
            this.landingResetTimer -= deltaQuotient;
            this.landingAutoBrakeTimer -= deltaQuotient;
            if (this.landingAutoBrakeTimer <= 0) {
                this.landingAutoBrakeTimer = null;
                SimVar.SetSimVarValue("L:A32NX_AUTOBRAKES_BRAKING", "Bool", 1);
            }
            if (this.landingResetTimer <= 0) {
                this.landingResetTimer = null;
                this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_PREFLIGHT;
                SimVar.SetSimVarValue("L:A32NX_TO_CONFIG_NORMAL", "Bool", 0);
                CDUIdentPage.ShowPage(this);
            }
        } else {
            //Reset timer to 30 when airborne in case of go around
            this.landingResetTimer = 30;
            this.landingAutoBrakeTimer = SimVar.GetSimVarValue("L:XMLVAR_Autobrakes_Level", "Enum") === 1 ? 4 : 2;
        }

        if (SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number") !== this.currentFlightPhase) {
            this.landingAutoBrakeTimer = null;
            SimVar.SetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number", this.currentFlightPhase);
            this.onFlightPhaseChanged();
            SimVar.SetSimVarValue("L:A32NX_CABIN_READY", "Bool", 0);
        }
    }

    connectIlsFrequency(_freq) {
        if (_freq >= 108 && _freq <= 111.95 && RadioNav.isHz50Compliant(_freq)) {
            switch (this.radioNav.mode) {
                case NavMode.FOUR_SLOTS: {
                    this.ilsFrequency = _freq;
                    break;
                }
                case NavMode.TWO_SLOTS: {
                    this.vor1Frequency = _freq;
                    break;
                }
            }
            this.connectIls();
            return true;
        }
        return false;
    }

    connectIls() {
        if (this.isRadioNavActive()) {
            return;
        }
        if (this._lockConnectIls) {
            return;
        }
        this._lockConnectIls = true;
        setTimeout(() => {
            this._lockConnectIls = false;
        }, 1000);
        switch (this.radioNav.mode) {
            case NavMode.FOUR_SLOTS: {
                if (Math.abs(this.radioNav.getILSActiveFrequency(1) - this.ilsFrequency) > 0.005) {
                    this.radioNav.setILSActiveFrequency(1, this.ilsFrequency);
                }
                break;
            }
            case NavMode.TWO_SLOTS: {
                if (Math.abs(this.radioNav.getVORActiveFrequency(1) - this.vor1Frequency) > 0.005) {
                    this.radioNav.setVORActiveFrequency(1, this.vor1Frequency);
                }
                break;
            }
            default:
                console.error("Unknown RadioNav operating mode");
                break;
        }
    }

    setIlsFrequency(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.ilsFrequency = 0;
            this.radioNav.setILSActiveFrequency(1, 0);
            this._ilsFrequencyPilotEntered = false;
            return true;
        }
        const v = parseFloat(s);
        if (isFinite(v)) {
            const freq = Math.round(v * 100) / 100;
            if (this.connectIlsFrequency(freq)) {
                this._ilsFrequencyPilotEntered = true;
                return true;
            }
            this.addNewMessage(NXSystemMessages.entryOutOfRange);
            return false;
        }
        this.addNewMessage(NXSystemMessages.notAllowed);
        return false;
    }

    initRadioNav(_boot) {
        if (this.isPrimary) {
            console.log("Init RadioNav");
            {
                if (_boot) {
                    this.vhf1Frequency = this.radioNav.getVHFActiveFrequency(this.instrumentIndex, 1);
                    this.vhf2Frequency = this.radioNav.getVHFActiveFrequency(this.instrumentIndex, 2);
                } else {
                    if (Math.abs(this.radioNav.getVHFActiveFrequency(this.instrumentIndex, 1) - this.vhf1Frequency) > 0.005) {
                        this.radioNav.setVHFActiveFrequency(this.instrumentIndex, 1, this.vhf1Frequency);
                    }
                    if (Math.abs(this.radioNav.getVHFActiveFrequency(this.instrumentIndex, 2) - this.vhf2Frequency) > 0.005) {
                        this.radioNav.setVHFActiveFrequency(this.instrumentIndex, 2, this.vhf2Frequency);
                    }
                }
            }
            {
                if (Math.abs(this.radioNav.getVORActiveFrequency(1) - this.vor1Frequency) > 0.005) {
                    this.radioNav.setVORActiveFrequency(1, this.vor1Frequency);
                }
                if (this.vor1Course >= 0) {
                    SimVar.SetSimVarValue("K:VOR1_SET", "number", this.vor1Course);
                }
                this.connectIls();
            }
            {
                if (Math.abs(this.radioNav.getVORActiveFrequency(2) - this.vor2Frequency) > 0.005) {
                    this.radioNav.setVORActiveFrequency(2, this.vor2Frequency);
                }
                if (this.vor2Course >= 0) {
                    SimVar.SetSimVarValue("K:VOR2_SET", "number", this.vor2Course);
                }
                if (Math.abs(this.radioNav.getILSActiveFrequency(2) - 0) > 0.005) {
                    this.radioNav.setILSActiveFrequency(2, 0);
                }
            }
            {
                if (_boot) {
                    this.adf1Frequency = this.radioNav.getADFActiveFrequency(1);
                    this.adf2Frequency = this.radioNav.getADFActiveFrequency(2);
                } else {
                    if (Math.abs(this.radioNav.getADFActiveFrequency(1) - this.adf1Frequency) > 0.005) {
                        SimVar.SetSimVarValue("K:ADF_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(this.adf1Frequency * 1000)).then(() => {
                        });
                    }
                    if (Math.abs(this.radioNav.getADFActiveFrequency(2) - this.adf2Frequency) > 0.005) {
                        SimVar.SetSimVarValue("K:ADF2_COMPLETE_SET", "Frequency ADF BCD32", Avionics.Utils.make_adf_bcd32(this.adf2Frequency * 1000)).then(() => {
                        });
                    }
                }
            }
            {
                if (this.atc1Frequency > 0) {
                    SimVar.SetSimVarValue("K:XPNDR_SET", "Frequency BCD16", Avionics.Utils.make_xpndr_bcd16(this.atc1Frequency));
                } else {
                    this.atc1Frequency = SimVar.GetSimVarValue("TRANSPONDER CODE:1", "number");
                }
            }
        }
    }

    updateRadioNavState() {
        if (this.isPrimary) {
            const radioNavOn = this.isRadioNavActive();
            if (radioNavOn != this._radioNavOn) {
                this._radioNavOn = radioNavOn;
                if (!radioNavOn) {
                    this.initRadioNav(false);
                }
                if (this.refreshPageCallback) {
                    this.refreshPageCallback();
                }
            }
            let apNavIndex = 1;
            let gpsDriven = true;
            const apprHold = SimVar.GetSimVarValue("AUTOPILOT APPROACH HOLD", "Bool");
            if (apprHold) {
                if (this.canSwitchToNav()) {
                    let navid = 0;
                    const ils = this.radioNav.getBestILSBeacon();
                    if (ils.id > 0) {
                        navid = ils.id;
                    } else {
                        const vor = this.radioNav.getBestVORBeacon();
                        if (vor.id > 0) {
                            navid = vor.id;
                        }
                    }
                    if (navid > 0) {
                        apNavIndex = navid;
                        const hasFlightplan = Simplane.getAutopilotGPSActive();
                        const apprCaptured = Simplane.getAutoPilotAPPRCaptured();
                        if (apprCaptured || !hasFlightplan) {
                            gpsDriven = false;
                        }
                    }
                }
            }
            if (apNavIndex != this._apNavIndex) {
                SimVar.SetSimVarValue("K:AP_NAV_SELECT_SET", "number", apNavIndex);
                this._apNavIndex = apNavIndex;
            }
            const curState = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
            if (curState != gpsDriven) {
                SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "Bool", 0);
            }
        }
    }

    canSwitchToNav() {
        if (!this._canSwitchToNav) {
            const altitude = Simplane.getAltitudeAboveGround();
            if (altitude >= 500) {
                this._canSwitchToNav = true;
            }
        }
        return this._canSwitchToNav;
    }

    isRadioNavActive() {
        return this.radioNav.getRADIONAVActive((this.isPrimary) ? 1 : 2);
    }

    get vhf1Frequency() {
        return this._vhf1Frequency;
    }

    get vhf2Frequency() {
        return this._vhf2Frequency;
    }

    get vor1Frequency() {
        return this._vor1Frequency;
    }

    get vor1Course() {
        return this._vor1Course;
    }

    get vor2Frequency() {
        return this._vor2Frequency;
    }

    get vor2Course() {
        return this._vor2Course;
    }

    get ilsFrequency() {
        return this._ilsFrequency;
    }

    get ilsCourse() {
        return this._ilsCourse;
    }

    get adf1Frequency() {
        return this._adf1Frequency;
    }

    get adf2Frequency() {
        return this._adf2Frequency;
    }

    get rcl1Frequency() {
        return this._rcl1Frequency;
    }

    get pre2Frequency() {
        return this._pre2Frequency;
    }

    get atc1Frequency() {
        return this._atc1Frequency;
    }

    set vhf1Frequency(_frq) {
        this._vhf1Frequency = _frq;
    }

    set vhf2Frequency(_frq) {
        this._vhf2Frequency = _frq;
    }

    set vor1Frequency(_frq) {
        this._vor1Frequency = _frq;
        SimVar.SetSimVarValue("L:FMC_VOR_FREQUENCY:1", "Hz", _frq * 1000000);
    }

    set vor1Course(_crs) {
        this._vor1Course = _crs;
    }

    set vor2Frequency(_frq) {
        this._vor2Frequency = _frq;
        SimVar.SetSimVarValue("L:FMC_VOR_FREQUENCY:2", "Hz", _frq * 1000000);
    }

    set vor2Course(_crs) {
        this._vor2Course = _crs;
    }

    set ilsFrequency(_frq) {
        this._ilsFrequency = _frq;
    }

    set ilsCourse(_crs) {
        this._ilsCourse = _crs;
    }

    set adf1Frequency(_frq) {
        this._adf1Frequency = _frq;
    }

    set adf2Frequency(_frq) {
        this._adf2Frequency = _frq;
    }

    set rcl1Frequency(_frq) {
        this._rcl1Frequency = _frq;
    }

    set pre2Frequency(_frq) {
        this._pre2Frequency = _frq;
    }

    set atc1Frequency(_frq) {
        this._atc1Frequency = _frq;
    }

    handlePreviousInputState() {
        if (this.inOut === FMCMainDisplay.clrValue) {
            this.inOut = "";
        }
        if (this.isDisplayingErrorMessage || this.isDisplayingTypeTwoMessage) {
            this.lastUserInputToScratchpad();
            this._inOutElement.className = "white";
            this.isDisplayingErrorMessage = false;
            this.isDisplayingTypeTwoMessage = false;
        }
    }

    Init() {
        super.Init();
        this.dataManager = new FMCDataManager(this);
        this.tempCurve = new Avionics.Curve();
        this.tempCurve.interpolationFunction = Avionics.CurveTool.NumberInterpolation;
        this.tempCurve.add(-10 * 3.28084, 21.50);
        this.tempCurve.add(0 * 3.28084, 15.00);
        this.tempCurve.add(10 * 3.28084, 8.50);
        this.tempCurve.add(20 * 3.28084, 2.00);
        this.tempCurve.add(30 * 3.28084, -4.49);
        this.tempCurve.add(40 * 3.28084, -10.98);
        this.tempCurve.add(50 * 3.28084, -17.47);
        this.tempCurve.add(60 * 3.28084, -23.96);
        this.tempCurve.add(70 * 3.28084, -30.45);
        this.tempCurve.add(80 * 3.28084, -36.94);
        this.tempCurve.add(90 * 3.28084, -43.42);
        this.tempCurve.add(100 * 3.28084, -49.90);
        this.tempCurve.add(150 * 3.28084, -56.50);
        this.tempCurve.add(200 * 3.28084, -56.50);
        this.tempCurve.add(250 * 3.28084, -51.60);
        this.tempCurve.add(300 * 3.28084, -46.64);
        this.tempCurve.add(400 * 3.28084, -22.80);
        this.tempCurve.add(500 * 3.28084, -2.5);
        this.tempCurve.add(600 * 3.28084, -26.13);
        this.tempCurve.add(700 * 3.28084, -53.57);
        this.tempCurve.add(800 * 3.28084, -74.51);
        let mainFrame = this.getChildById("Electricity");
        if (mainFrame == null) {
            mainFrame = this;
        }
        this.generateHTMLLayout(mainFrame);
        this._titleLeftElement = this.getChildById("title-left");
        this._titleElement = this.getChildById("title");
        this._pageCurrentElement = this.getChildById("page-current");
        this._pageCountElement = this.getChildById("page-count");
        this._labelElements = [];
        this._lineElements = [];
        for (let i = 0; i < 6; i++) {
            this._labelElements[i] = [
                this.getChildById("label-" + i + "-left"),
                this.getChildById("label-" + i + "-right"),
                this.getChildById("label-" + i + "-center")
            ];
            this._lineElements[i] = [
                this.getChildById("line-" + i + "-left"),
                this.getChildById("line-" + i + "-right"),
                this.getChildById("line-" + i + "-center")
            ];
        }
        this._inOutElement = this.getChildById("in-out");
        this._inOutElement.style.removeProperty("color");
        this._inOutElement.className = "white";
        this.onMenu = () => {
            FMCMainDisplayPages.MenuPage(this);
        };
        this.onLetterInput = (l) => {
            this.handlePreviousInputState();
            this.inOut += l;
        };
        this.onSp = () => {
            this.handlePreviousInputState();
            this.inOut += " ";
        };
        this.onDel = () => {
            this.handlePreviousInputState();
            if (this.inOut.length > 0) {
                this.inOut = this.inOut.slice(0, -1);
            }
        };
        this.onDiv = () => {
            this.handlePreviousInputState();
            this.inOut += "/";
        };
        this.onClr = () => {
            if (this.inOut === "") {
                this.inOut = FMCMainDisplay.clrValue;
            } else if (this.inOut === FMCMainDisplay.clrValue) {
                this.inOut = "";
            } else if (this.isDisplayingErrorMessage || this.isDisplayingTypeTwoMessage) {
                this.tryRemoveMessage();
                this.lastUserInputToScratchpad();
                this._inOutElement.className = "white";
                this.isDisplayingErrorMessage = false;
                this.isDisplayingTypeTwoMessage = false;
            } else {
                this.inOut = this.inOut.slice(0, -1);
            }
            this.tryShowMessage();
        };
        this.cruiseFlightLevel = SimVar.GetGameVarValue("AIRCRAFT CRUISE ALTITUDE", "feet");
        this.cruiseFlightLevel /= 100;
        SimVar.SetSimVarValue("L:FLIGHTPLAN_USE_DECEL_WAYPOINT", "number", 1);
        this.flightPlanManager.onCurrentGameFlightLoaded(() => {
            this.flightPlanManager.updateFlightPlan(() => {
                this.flightPlanManager.updateCurrentApproach(() => {
                    const frequency = this.flightPlanManager.getApproachNavFrequency();
                    if (isFinite(frequency)) {
                        const freq = Math.round(frequency * 100) / 100;
                        if (this.connectIlsFrequency(freq)) {
                            this._ilsFrequencyPilotEntered = false;
                            SimVar.SetSimVarValue("L:FLIGHTPLAN_APPROACH_ILS", "number", freq);
                            const approach = this.flightPlanManager.getApproach();
                            if (approach && approach.name && approach.name.indexOf("ILS") !== -1) {
                                const runway = this.flightPlanManager.getApproachRunway();
                                if (runway) {
                                    SimVar.SetSimVarValue("L:FLIGHTPLAN_APPROACH_COURSE", "number", runway.direction);
                                }
                            }
                        }
                    }
                });
                const callback = () => {
                    this.flightPlanManager.createNewFlightPlan();
                    SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", NaN);
                    SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", NaN);
                    SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", NaN);
                    const cruiseAlt = Math.floor(this.flightPlanManager.cruisingAltitude / 100);
                    console.log("FlightPlan Cruise Override. Cruising at FL" + cruiseAlt + " instead of default FL" + this.cruiseFlightLevel);
                    if (cruiseAlt > 0) {
                        this.cruiseFlightLevel = cruiseAlt;
                    }
                };
                const arrivalIndex = this.flightPlanManager.getArrivalProcIndex();
                if (arrivalIndex >= 0) {
                    this.flightPlanManager.setArrivalProcIndex(arrivalIndex, callback);
                } else {
                    callback();
                }
            });
        });
        this.updateFuelVars();
        this.thrustReductionAltitude = 1500;
        SimVar.SetSimVarValue("L:AIRLINER_THR_RED_ALT", "Number", this.thrustReductionAltitude);
        this.PageTimeout = {
            Prog: 5000,
            Dyn: 1500
        };
        this.page = {
            SelfPtr: false,
            Current: 0,
            Clear: 0,
            AirportsMonitor: 1,
            AirwaysFromWaypointPage: 2,
            // AirwaysFromWaypointPageGetAllRows: 3,
            AvailableArrivalsPage: 4,
            AvailableArrivalsPageVias: 5,
            AvailableDeparturesPage: 6,
            AvailableFlightPlanPage: 7,
            DataIndexPage1: 8,
            DataIndexPage2: 9,
            DirectToPage: 10,
            FlightPlanPage: 11,
            FuelPredPage: 12,
            GPSMonitor: 13,
            HoldAtPage: 14,
            IdentPage: 15,
            InitPageA: 16,
            InitPageB: 17,
            IRSInit: 18,
            IRSMonitor: 19,
            IRSStatus: 20,
            IRSStatusFrozen: 21,
            LateralRevisionPage: 22,
            MenuPage: 23,
            NavaidPage: 24,
            NavRadioPage: 25,
            NewWaypoint: 26,
            PerformancePageTakeoff: 27,
            PerformancePageClb: 28,
            PerformancePageCrz: 29,
            PerformancePageDes: 30,
            PerformancePageAppr: 31,
            PerformancePageGoAround: 32,
            PilotsWaypoint: 33,
            PosFrozen: 34,
            PositionMonitorPage: 35,
            ProgressPage: 36,
            ProgressPageReport: 37,
            ProgressPagePredictiveGPS: 38,
            SelectedNavaids: 39,
            SelectWptPage: 40,
            VerticalRevisionPage: 41,
            WaypointPage: 42,
            AOCInit: 43,
            AOCInit2: 44,
            AOCOfpData: 45,
            AOCOfpData2: 46,
            ClimbWind: 47,
            CruiseWind: 48,
            DescentWind: 49,
        };
    }

    /**
     * Used for switching pages
     * @returns {number} delay in ms between 150 and 200
     */
    getDelaySwitchPage() {
        return 150 + 50 * Math.random();
    }

    /**
     * Used for basic inputs e.g. alternate airport, ci, fl, temp, constraints, ...
     * @returns {number} delay in ms between 300 and 400
     */
    getDelayBasic() {
        return 300 + 100 * Math.random();
    }

    /**
     * Used for e.g. loading time fore pages
     * @returns {number} delay in ms between 600 and 800
     */
    getDelayMedium() {
        return 600 + 200 * Math.random();
    }

    /**
     * Used for intense calculation
     * @returns {number} delay in ms between 900 and 12000
     */
    getDelayHigh() {
        return 900 + 300 * Math.random();
    }

    /**
     * Used for changes to the flight plan
     * @returns {number} dynamic delay in ms between ~300 and up to +2000 (depending on additional conditions)
     */
    getDelayRouteChange() {
        if (this._zeroFuelWeightZFWCGEntered && this._blockFuelEntered) {
            return Math.pow(this.flightPlanManager.getWaypointsCount(), 2) + (this.flightPlanManager.getDestination().cumulativeDistanceInFP) / 10 + Math.random() * 300;
        } else {
            return 300 + this.flightPlanManager.getWaypointsCount() * Math.random() + this.flightPlanManager.getDestination().cumulativeDistanceInFP * Math.random();
        }
    }

    /**
     * Used for calculation time for fuel pred page
     * @returns {number} dynamic delay in ms between 2000ms and 4000ms
     */
    getDelayFuelPred() {
        return 225 * this.flightPlanManager.getWaypointsCount() + (this.flightPlanManager.getDestination().cumulativeDistanceInFP / 2);
    }

    /**
     * Used to load wind data into fms
     * @returns {number} dynamic delay in ms dependent on amount of waypoints
     */
    getDelayWindLoad() {
        return Math.pow(this.flightPlanManager.getWaypointsCount(), 2);
    }

    /**
     * Tries to delete a pages timeout
     */
    tryDeleteTimeout() {
        if (this.page.SelfPtr) {
            clearTimeout(this.page.SelfPtr);
            this.page.SelfPtr = false;
        }
    }

    onPowerOn() {
        super.onPowerOn();
        const gpsDriven = SimVar.GetSimVarValue("GPS DRIVES NAV1", "Bool");
        if (!gpsDriven) {
            SimVar.SetSimVarValue("K:TOGGLE_GPS_DRIVES_NAV1", "Bool", 0);
        }
        this.initRadioNav(true);
    }

    updateZfwVars() {
        const totalWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "kilograms") / 1000;
        const blockFuel = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons") * SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilograms") / 1000;
        this.zeroFuelWeight = totalWeight - blockFuel;
        this.zeroFuelWeightMassCenter = SimVar.GetSimVarValue("CG PERCENT", "percent");
    }

    updateFuelVars() {
        this.blockFuel = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons") * SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilograms") / 1000;
        this.updateZfwVars();
    }

    onUpdate(_deltaTime) {
        super.onUpdate(_deltaTime);
        if (this._debug++ > 180) {
            this._debug = 0;
        }
        this.checkUpdateFlightPhase();
        this._checkFlightPlan--;
        if (this._checkFlightPlan <= 0) {
            this._checkFlightPlan = 120;
            this.flightPlanManager.updateFlightPlan();
            this.flightPlanManager.updateCurrentApproach();
        }
        if (this.pageUpdate) {
            this.pageUpdate();
        }
        if (SimVar.GetSimVarValue("L:FMC_UPDATE_CURRENT_PAGE", "number") === 1) {
            SimVar.SetSimVarValue("L:FMC_UPDATE_CURRENT_PAGE", "number", 0);
            if (this.refreshPageCallback) {
                this.refreshPageCallback();
            }
        }
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_APPROACH) {
            // Is this LVar used by anything? It doesn't look like it...
            SimVar.SetSimVarValue("L:AIRLINER_MANAGED_APPROACH_SPEED", "number", this.getManagedApproachSpeedMcdu());
        }
        this.updateRadioNavState();
    }

    onEvent(_event) {
        if (_event.indexOf("1_BTN_") !== -1 || _event.indexOf("2_BTN_") !== -1 || _event.indexOf("BTN_") !== -1) {
            const input = _event.replace("1_BTN_", "").replace("2_BTN_", "").replace("BTN_", "");
            if (this.onInputAircraftSpecific(input)) {
                return;
            }
            if (input === "INIT") {
                this.onInit();
            } else if (input === "DEPARR") {
                this.onDepArr();
            } else if (input === "ATC") {
                this.onAtc();
            } else if (input === "FIX") {
                this.onFix();
            } else if (input === "HOLD") {
                this.onHold();
            } else if (input === "FMCCOMM") {
                this.onFmcComm();
            } else if (input === "PROG") {
                this.onProg();
            } else if (input === "MENU") {
                this.onMenu();
            } else if (input === "NAVRAD") {
                this.onRad();
            } else if (input === "PREVPAGE") {
                const cur = this.page.Current;
                setTimeout(() => {
                    if (this.page.Current === cur) {
                        this.onPrevPage();
                    }
                }, this.getDelaySwitchPage());
            } else if (input === "NEXTPAGE") {
                const cur = this.page.Current;
                setTimeout(() => {
                    if (this.page.Current === cur) {
                        this.onNextPage();
                    }
                }, this.getDelaySwitchPage());
            } else if (input === "SP") {
                setTimeout(() => {
                    this.onSp();
                }, this.getDelaySwitchPage());
            } else if (input === "DEL") {
                setTimeout(() => {
                    this.onDel();
                }, this.getDelaySwitchPage());
            } else if (input === "CLR") {
                setTimeout(() => {
                    this.onClr();
                }, this.getDelaySwitchPage());
            } else if (input === "DIV") {
                setTimeout(() => {
                    this.onDiv();
                }, this.getDelaySwitchPage());
            } else if (input === "DOT") {
                setTimeout(() => {
                    this.handlePreviousInputState();
                    this.inOut += ".";
                }, this.getDelaySwitchPage());
            } else if (input === "PLUSMINUS") {
                setTimeout(() => {
                    this.handlePreviousInputState();
                    const val = this.inOut;
                    if (val === "") {
                        this.inOut = "-";
                    } else if (val !== FMCMainDisplay.clrValue && (!this.isDisplayingErrorMessage || !this.isDisplayingTypeTwoMessage)) {
                        if (val.slice(-1) === "-") {
                            this.inOut = this.inOut.slice(0, -1) + "+";
                        } else if (val.slice(-1) === "+") {
                            this.inOut = this.inOut.slice(0, -1) + "-";
                        } else {
                            this.inOut += "-";
                        }
                    }
                }, this.getDelaySwitchPage());
            } else if (input === "Localizer") {
                this._apLocalizerOn = !this._apLocalizerOn;
            } else if (input.length === 2 && input[0] === "L") {
                const v = parseInt(input[1]);
                if (isFinite(v)) {
                    if (this.onLeftInput[v - 1]) {
                        const value = this.clearUserInput();
                        const cur = this.page.Current;
                        setTimeout(() => {
                            if (this.page.Current === cur) {
                                this.onLeftInput[v - 1](value);
                                this.tryClearOldUserInput();
                            }
                        }, this.leftInputDelay[v - 1] ? this.leftInputDelay[v - 1](value) : this.getDelayBasic());
                    }
                }
            } else if (input.length === 2 && input[0] === "R") {
                const v = parseInt(input[1]);
                if (isFinite(v)) {
                    if (this.onRightInput[v - 1]) {
                        const value = this.clearUserInput();
                        const cur = this.page.Current;
                        setTimeout(() => {
                            if (this.page.Current === cur) {
                                this.onRightInput[v - 1](value);
                                this.tryClearOldUserInput();
                            }
                        }, this.rightInputDelay[v - 1] ? this.rightInputDelay[v - 1]() : this.getDelayBasic());
                    }
                }
            } else if (input.length === 1 && FMCMainDisplay._AvailableKeys.indexOf(input) !== -1) {
                setTimeout(() => {
                    this.onLetterInput(input);
                }, this.getDelaySwitchPage());
            } else {
                console.log("'" + input + "'");
            }
        }
    }

    clearDisplay() {
        this.setTitle("UNTITLED");
        this.setPageCurrent(0);
        this.setPageCount(0);
        for (let i = 0; i < 6; i++) {
            this.setLabel("", i, -1);
        }
        for (let i = 0; i < 6; i++) {
            this.setLine("", i, -1);
        }
        this.onLeftInput = [];
        this.onRightInput = [];
        this.leftInputDelay = [];
        this.rightInputDelay = [];
        this.onPrevPage = () => {};
        this.onNextPage = () => {};
        this.pageUpdate = () => {};
        this.refreshPageCallback = undefined;
        if (this.page.Current === this.page.MenuPage) {
            this.forceClearScratchpad();
        }
        this.page.Current = this.page.Clear;
        this.setArrows(false, false);
        this.tryDeleteTimeout();
    }

    generateHTMLLayout(parent) {
        while (parent.children.length > 0) {
            parent.removeChild(parent.children[0]);
        }
        const header = document.createElement("div");
        header.id = "header";

        const titleLeft = document.createElement("div");
        titleLeft.classList.add("s-text");
        titleLeft.id = "title-left";
        parent.appendChild(titleLeft);

        const title = document.createElement("span");
        title.id = "title";
        header.appendChild(title);

        this.arrowHorizontal = document.createElement("span");
        this.arrowHorizontal.id = "arrow-horizontal";
        this.arrowHorizontal.innerHTML = "←→\xa0";
        header.appendChild(this.arrowHorizontal);

        parent.appendChild(header);

        const page = document.createElement("div");
        page.id = "page-info";
        page.classList.add("s-text");

        const pageCurrent = document.createElement("span");
        pageCurrent.id = "page-current";

        const pageSlash = document.createElement("span");
        pageSlash.id = "page-slash";
        pageSlash.textContent = "/";

        const pageCount = document.createElement("span");
        pageCount.id = "page-count";

        page.appendChild(pageCurrent);
        page.appendChild(pageSlash);
        page.appendChild(pageCount);
        parent.appendChild(page);

        for (let i = 0; i < 6; i++) {
            const label = document.createElement("div");
            label.classList.add("label", "s-text");
            const labelLeft = document.createElement("span");
            labelLeft.id = "label-" + i + "-left";
            labelLeft.classList.add("fmc-block", "label", "label-left");
            const labelRight = document.createElement("span");
            labelRight.id = "label-" + i + "-right";
            labelRight.classList.add("fmc-block", "label", "label-right");
            const labelCenter = document.createElement("span");
            labelCenter.id = "label-" + i + "-center";
            labelCenter.classList.add("fmc-block", "label", "label-center");
            label.appendChild(labelLeft);
            label.appendChild(labelRight);
            label.appendChild(labelCenter);
            parent.appendChild(label);
            const line = document.createElement("div");
            line.classList.add("line");
            const lineLeft = document.createElement("span");
            lineLeft.id = "line-" + i + "-left";
            lineLeft.classList.add("fmc-block", "line", "line-left");
            const lineRight = document.createElement("span");
            lineRight.id = "line-" + i + "-right";
            lineRight.classList.add("fmc-block", "line", "line-right");
            const lineCenter = document.createElement("span");
            lineCenter.id = "line-" + i + "-center";
            lineCenter.classList.add("fmc-block", "line", "line-center");
            line.appendChild(lineLeft);
            line.appendChild(lineRight);
            line.appendChild(lineCenter);
            parent.appendChild(line);
        }
        const footer = document.createElement("div");
        footer.classList.add("line");
        const inout = document.createElement("span");
        inout.id = "in-out";

        this.arrowVertical = document.createElement("span");
        this.arrowVertical.id = "arrow-vertical";
        this.arrowVertical.innerHTML = "↓↑\xa0";

        footer.appendChild(inout);
        footer.appendChild(this.arrowVertical);
        parent.appendChild(footer);
    }
    static secondsToUTC(seconds) {
        const h = Math.floor(seconds / 3600);
        seconds -= h * 3600;
        const m = Math.floor(seconds / 60);
        return (h % 24).toFixed(0).padStart(2, "0") + m.toFixed(0).padStart(2, "0");
    }
    static secondsTohhmm(seconds) {
        const h = Math.floor(seconds / 3600);
        seconds -= h * 3600;
        const m = Math.floor(seconds / 60);
        return h.toFixed(0).padStart(2, "0") + m.toFixed(0).padStart(2, "0");
    }

    static minuteToSeconds(minutes) {
        return minutes * 60;
    }

    static hhmmToSeconds(hhmm) {
        if (!hhmm) {
            return NaN;
        }
        const h = parseInt(hhmm.substring(0, 2));
        const m = parseInt(hhmm.substring(2, 4));
        return h * 3600 + m * 60;
    }

    /**
     * Computes hour and minutes when given minutes
     * @param {number} minutes - minutes used to make the conversion
     * @returns {string} A string in the format "HHMM" e.g "0235"
     */
    static minutesTohhmm(minutes) {
        const h = Math.floor(minutes / 60);
        minutes -= h * 60;
        const m = minutes;
        return h.toFixed(0).padStart(2,"0") + m.toFixed(0).padStart(2, "0");
    }

    /**
     * computes minutes when given hour and minutes
     * @param {string} hhmm - string used ot make the conversion
     * @returns {number} numbers in minutes form
     */
    static hhmmToMinutes(hhmm) {
        if (!hhmm) {
            return NaN;
        }
        const h = parseInt(hhmm.substring(0, 2));
        const m = parseInt(hhmm.substring(2, 4));
        return h * 60 + m;
    }

    setAPSelectedSpeed(_speed, _aircraft) {
        if (isFinite(_speed)) {
            if (Simplane.getAutoPilotMachModeActive()) {
                const mach = SimVar.GetGameVarValue("FROM KIAS TO MACH", "number", _speed);
                Coherent.call("AP_MACH_VAR_SET", 1, mach);
                SimVar.SetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_ON", "number", 1);
                return;
            }
            Coherent.call("AP_SPD_VAR_SET", 1, _speed);
            SimVar.SetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_OFF", "number", 1);
        }
    }

    setAPManagedSpeed(_speed, _aircraft) {
        if (isFinite(_speed)) {
            if (Simplane.getAutoPilotMachModeActive()) {
                let mach = SimVar.GetGameVarValue("FROM KIAS TO MACH", "number", _speed);
                const cruiseMach = SimVar.GetGameVarValue("AIRCRAFT CRUISE MACH", "mach");
                mach = Math.min(mach, cruiseMach);
                Coherent.call("AP_MACH_VAR_SET", 2, mach);
                SimVar.SetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_ON", "number", 1);
                return;
            }
            Coherent.call("AP_SPD_VAR_SET", 2, _speed);
            SimVar.SetSimVarValue("K:AP_MANAGED_SPEED_IN_MACH_OFF", "number", 1);
        }
    }
}

FMCMainDisplay.clrValue = "\xa0\xa0\xa0\xa0\xa0CLR";
FMCMainDisplay._AvailableKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
