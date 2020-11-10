class FMCMainDisplay extends BaseAirliners {
    constructor() {
        super(...arguments);
        this.defaultInputErrorMessage = "INVALID ENTRY";
        this.currentFlightPlanWaypointIndex = -1;
        this._title = undefined;
        this._pageCurrent = undefined;
        this._pageCount = undefined;
        this._labels = [];
        this._lines = [];
        this._inOut = undefined;
        this.onLeftInput = [];
        this.onRightInput = [];
        this.lastPos = "";
        this.costIndex = 0;
        this.lastUserInput = "";
        this.isDisplayingErrorMessage = false;
        this.maxCruiseFL = 390;
        this.routeIndex = 0;
        this.coRoute = "";
        this.routeIsSelected = false;
        this.routePageCurrent = 1;
        this.routePageCount = 2;
        this.tmpOrigin = "";
        this.tmpDestination = "";
        this.transitionAltitude = 10000;
        this.perfTOTemp = 20;
        this._overridenFlapApproachSpeed = NaN;
        this._overridenSlatApproachSpeed = NaN;
        this._routeFinalFuelWeight = NaN;
        this._routeFinalFuelTime = NaN;
        this._routeReservedWeight = NaN;
        this._routeReservedPercent = 0;
        this._takeOffFlap = -1;
        this.takeOffWeight = NaN;
        this.landingWeight = NaN;
        this.averageWind = NaN;
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
        this._flightPhases = ["PREFLIGHT", "TAXI", "TAKEOFF", "CLIMB", "CRUISE", "DESCENT", "APPROACH", "GOAROUND"];
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
        this._ilsCourse = 0;
        this._adf1Frequency = 0;
        this._adf2Frequency = 0;
        this._rcl1Frequency = 0;
        this._pre2Frequency = 0;
        this._atc1Frequency = 0;
        this._radioNavOn = false;
        this._debug = 0;
        this._checkFlightPlan = 0;
        this._smoothedTargetHeading = NaN;
        this._smootherTargetPitch = NaN;

        this._zeroFuelWeightZFWCGEntered = false;
        this._taxiEntered = false;
        this._windDir = "HD";
    }

    static approachTypeStringToIndex(approachType) {
        approachType = approachType.trim();
        const index = FMCMainDisplay.approachTypes.indexOf(approachType);
        if (isFinite(index) && index > 0) {
            return index;
        }
        return 0;
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
        this._titleElement.classList.remove("white", "blue", "yellow", "green", "red", "magenta", "inop");
        this._titleElement.classList.add(color);
        this._titleElement.textContent = this._title;
    }

    getPageCurrent() {
        if (this._pageCurrent === undefined) {
            this._pageCurrent = parseInt(this._pageCurrentElement.textContent);
        }
        return this._pageCurrent;
    }

    setPageCurrent(value) {
        if (typeof (value) === "number") {
            this._pageCurrent = value;
        } else if (typeof (value) === "string") {
            this._pageCurrent = parseInt(value);
        }
        this._pageCurrentElement.textContent = (this._pageCurrent > 0 ? this._pageCurrent : "") + "";
    }

    getPageCount() {
        if (this._pageCount === undefined) {
            this._pageCount = parseInt(this._pageCountElement.textContent);
        }
        return this._pageCount;
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

    getLabel(row, col = 0) {
        if (!this._labels[row]) {
            this._labels[row] = [];
        }
        return this._labels[row][col];
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
            e.classList.remove("white", "blue", "yellow", "green", "red", "magenta", "inop");
            e.classList.add(color);
            label = label.split("[color]")[0];
        }
        this._labels[row][col] = label;
        this._labelElements[row][col].textContent = label;
    }

    getLine(row, col = 0) {
        if (!this._lines[row]) {
            this._lines[row] = [];
        }
        return this._lines[row][col];
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
            e.classList.remove("white", "blue", "yellow", "green", "red", "magenta", "inop");
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
        if (content === FMCMainDisplay.clrValue) {
            this._inOutElement.style.paddingLeft = "8%";
        } else {
            this._inOutElement.style.paddingLeft = "";
        }
    }

    setTemplate(template, large = false) {
        if (template[0]) {
            this.setTitle(template[0][0]);
            this.setPageCurrent(template[0][1]);
            this.setPageCount(template[0][2]);
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

    clearUserInput() {
        if (!this.isDisplayingErrorMessage) {
            this.lastUserInput = this.inOut;
        }
        this.inOut = "";
        this._inOutElement.style.color = "#ffffff";
    }

    showErrorMessage(message, color = "#ffffff") {
        if (!this.isDisplayingErrorMessage) {
            this.lastUserInput = this.inOut;
        }
        this.isDisplayingErrorMessage = true;
        this.inOut = message;
        this._inOutElement.style.color = color;
    }

    /**
     * Returns true if an engine is running (FF > 0)
     * @returns {number}
     */
    isAnEngineOn() {
        return Simplane.getEngineActive(0) || Simplane.getEngineActive(1);
    }

    /**
     * Returns true if all engines are running (FF > 0)
     * @returns {number}
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

    async tryUpdateRefAirport(airportIdent) {
        const airport = await this.dataManager.GetAirportByIdent(airportIdent);
        if (!airport) {
            this.showErrorMessage("NOT IN DATABASE");
            return false;
        }
        this.refAirport = airport;
        return true;
    }

    tryUpdateGate(gate) {
        if (gate.length > 6) {
            this.showErrorMessage(this.defaultInputErrorMessage);
            return false;
        }
        this.refGate = gate;
        return true;
    }

    tryUpdateHeading(heading) {
        let nHeading = parseInt(heading);
        if (isNaN(nHeading)) {
            this.showErrorMessage(this.defaultInputErrorMessage);
            return false;
        }
        nHeading = Math.round(nHeading) % 360;
        this.refHeading = nHeading;
        return true;
    }

    async tryUpdateIrsCoordinatesDisplay(newIrsCoordinatesDisplay) {
        if (!this.dataManager.IsValidLatLon(newIrsCoordinatesDisplay)) {
            this.showErrorMessage(this.defaultInputErrorMessage);
            return false;
        }
        this.initCoordinates = newIrsCoordinatesDisplay;
        this.lastPos = this.initCoordinates;
        return true;
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

        if (tempString) {
            const temp = parseFloat(tempString);
            if (isFinite(temp)) {
                if (temp > -270 && temp < 100) {
                    this.cruiseTemperature = temp;
                } else {
                    if (onlyTemp) {
                        this.showErrorMessage("ENTRY OUT OF RANGE");
                        return false;
                    }
                }
            } else {
                if (onlyTemp) {
                    this.showErrorMessage(this.defaultInputErrorMessage);
                    return false;
                }
            }
        }
        if (flString) {
            return this.trySetCruiseFl(parseFloat(flString));
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    trySetGroundTemperature(groundTemperature) {
        const value = parseInt(groundTemperature);
        if (isFinite(value)) {
            this.groundTemperature = value;
            return true;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    tryUpdateCostIndex(costIndex) {
        const value = parseInt(costIndex);
        if (isFinite(value)) {
            if (value >= 0) {
                if (value < 1000) {
                    this.costIndex = value;
                    return true;
                }
            }
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
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
            this.showErrorMessage("NOT ALLOWED");
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
                                        this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_TAKEOFF;
                                        callback(true);
                                    });
                                });
                            });
                        });
                    } else {
                        this.showErrorMessage("NOT IN DATABASE");
                        callback(false);
                    }
                });
            } else {
                this.showErrorMessage("NOT IN DATABASE");
                callback(false);
            }
        });
    }

    async tryUpdateAltDestination(altDestIdent) {
        if (altDestIdent === "NONE") {
            this.altDestination = undefined;
            return true;
        }
        const airportAltDest = await this.dataManager.GetAirportByIdent(altDestIdent);
        if (airportAltDest) {
            this.altDestination = airportAltDest;
            return true;
        }
        this.showErrorMessage("NOT IN DATABASE");
        return false;
    }

    updateRouteOrigin(newRouteOrigin, callback = EmptyCallback.Boolean) {
        this.dataManager.GetAirportByIdent(newRouteOrigin).then(airport => {
            if (!airport) {
                this.showErrorMessage("NOT IN DATABASE");
                return callback(false);
            }
            this.flightPlanManager.setOrigin(airport.icao, () => {
                this.tmpOrigin = airport.ident;
                callback(true);
            });
        });
    }

    updateRouteDestination(routeDestination, callback = EmptyCallback.Boolean) {
        this.dataManager.GetAirportByIdent(routeDestination).then(airport => {
            if (!airport) {
                this.showErrorMessage("NOT IN DATABASE");
                return callback(false);
            }
            this.flightPlanManager.setDestination(airport.icao, () => {
                this.tmpDestination = airport.ident;
                callback(true);
            });
        });
    }

    setOriginRunway(runwayName, callback = EmptyCallback.Boolean) {
        const origin = this.flightPlanManager.getOrigin();
        if (origin && origin.infos instanceof AirportInfo) {
            const runwayIndex = origin.infos.oneWayRunways.findIndex(r => {
                return Avionics.Utils.formatRunway(r.designation) === Avionics.Utils.formatRunway(runwayName);
            });
            if (runwayIndex >= 0) {
                this.ensureCurrentFlightPlanIsTemporary(() => {
                    this.flightPlanManager.setOriginRunwayIndex(runwayIndex, () => {
                        return callback(true);
                    });
                });
            } else {
                this.showErrorMessage("NOT IN DATABASE");
                return callback(false);
            }
        } else {
            this.showErrorMessage("NO ORIGIN AIRPORT");
            return callback(false);
        }
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
                this.showErrorMessage("NO ORIGIN SET");
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
                this.showErrorMessage("NOT IN DATABASE");
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

    removeDeparture() {
        this.flightPlanManager.removeDeparture();
        return true;
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

    removeArrival() {
        this.flightPlanManager.removeDeparture();
        return true;
    }

    setApproachIndex(approachIndex, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.setApproachIndex(approachIndex, () => {
                const frequency = this.flightPlanManager.getApproachNavFrequency();
                if (isFinite(frequency)) {
                    const freq = Math.round(frequency * 100) / 100;
                    if (this.connectIlsFrequency(freq)) {
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
            this.showErrorMessage(this.defaultInputErrorMessage);
            return callback(false);
        }

        const storedTelexStatus = NXDataStore.get("CONFIG_TELEX_STATUS", "DISABLED");

        let connectSuccess = true;
        SimVar.SetSimVarValue("ATC FLIGHT NUMBER", "string", flightNo, "FMC").then(() => {
            if (storedTelexStatus === "ENABLED") {
                const initTelexServer = async () => {
                    NXApi.connectTelex(flightNo)
                        .catch((err) => {
                            if (err !== NXApi.disconnectedError) {
                                this.showErrorMessage("FLT NBR IN USE");
                            }

                            connectSuccess = false;
                        });
                };

                initTelexServer();
            }
            return callback(connectSuccess);
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
        this.showErrorMessage(this.defaultInputErrorMessage);
        return callback(false);
    }

    getTotalTripTime() {
        if (this.flightPlanManager.getOrigin()) {
            return this.flightPlanManager.getOrigin().infos.totalTimeInFP;
        }
        return NaN;
    }

    getTotalTripFuelCons() {
        if (this.flightPlanManager.getOrigin()) {
            return this.flightPlanManager.getOrigin().infos.totalFuelConsInFP;
        }
        return NaN;
    }

    getOrSelectWaypointByIdent(ident, callback) {
        this.dataManager.GetWaypointsByIdent(ident).then((waypoints) => {
            if (!waypoints || waypoints.length === 0) {
                return callback(undefined);
            }
            return callback(waypoints[0]);
        });
    }

    async tryAddNextAirway(newAirway) {
        this.showErrorMessage("NOT IMPLEMENTED");
        return false;
    }

    async tryAddNextWaypoint(newWaypointTo) {
        const waypoints = await this.dataManager.GetWaypointsByIdent(newWaypointTo);
        if (waypoints.length === 0) {
            this.showErrorMessage("NOT IN DATABASE");
            return false;
        }
        if (waypoints.length === 1) {
            this.flightPlanManager.addWaypoint(waypoints[0].icao);
            this.routeIsSelected = false;
            return true;
        }
        return false;
    }

    activateDirectToWaypointIdent(waypointIdent, callback = EmptyCallback.Void) {
        this.getOrSelectWaypointByIdent(waypointIdent, (w) => {
            if (w) {
                return this.activateDirectToWaypoint(w, callback);
            }
            return callback();
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

    insertWaypointNextTo(newWaypointTo, referenceWaypoint, callback = EmptyCallback.Boolean) {
        const referenceWaypointIndex = this.flightPlanManager.indexOfWaypoint(referenceWaypoint);
        if (referenceWaypointIndex >= 0) {
            return this.insertWaypoint(newWaypointTo, referenceWaypointIndex + 1, callback);
        }
        this.showErrorMessage("NOT IN DATABASE");
        callback(false);
    }

    insertWaypoint(newWaypointTo, index, callback = EmptyCallback.Boolean) {
        this.ensureCurrentFlightPlanIsTemporary(async () => {
            this.getOrSelectWaypointByIdent(newWaypointTo, (waypoint) => {
                if (!waypoint) {
                    this.showErrorMessage("NOT IN DATABASE");
                    return callback(false);
                }
                this.flightPlanManager.addWaypoint(waypoint.icao, index, () => {
                    return callback(true);
                });
            });
        });
    }

    async insertWaypointsAlongAirway(lastWaypointIdent, index, airwayName, callback = EmptyCallback.Boolean) {
        const referenceWaypoint = this.flightPlanManager.getWaypoint(index - 1);
        const lastWaypointIdentPadEnd = lastWaypointIdent.padEnd(5, " ");
        if (referenceWaypoint) {
            const infos = referenceWaypoint.infos;
            if (infos instanceof WayPointInfo) {
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
                        this.showErrorMessage("2ND INDEX NOT FOUND");
                        return callback(false);
                    }
                    this.showErrorMessage("1ST INDEX NOT FOUND");
                    return callback(false);
                }
                this.showErrorMessage("NO REF WAYPOINT");
                return callback(false);
            }
            this.showErrorMessage("NO WAYPOINT INFOS");
            return callback(false);
        }
        this.showErrorMessage("NO REF WAYPOINT");
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

    async tryInsertAirwayByWaypointIdent(newWaypointIdent, from) {
        this.showErrorMessage("NOT IMPLEMENTED");
        return false;
    }

    async tryInsertAirway(newAirway, from) {
        this.showErrorMessage("NOT IMPLEMENTED");
        return false;
    }

    removeWaypoint(index, callback = EmptyCallback.Void) {
        this.ensureCurrentFlightPlanIsTemporary(() => {
            this.flightPlanManager.removeWaypoint(index, true, callback);
        });
    }

    async tryUpdateWaypointVia(via, waypointIndex) {
        this.showErrorMessage("NOT IMPLEMENTED");
        return false;
    }

    clearDepartureDiscontinuity(callback = EmptyCallback.Void) {
        this.flightPlanManager.clearDepartureDiscontinuity(callback);
    }

    clearArrivalDiscontinuity(callback = EmptyCallback.Void) {
        this.flightPlanManager.clearArrivalDiscontinuity(callback);
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

    _computeV1Speed() {
        this.v1Speed = 120;
    }

    _computeVRSpeed() {
        this.vRSpeed = 130;
    }

    _computeV2Speed() {
        this.v2Speed = 140;
    }

    trySetV1Speed(s) {
        if (!/^\d+$/.test(s)) {
            this.showErrorMessage("FORMAT ERROR");
            return false;
        }
        const v = parseInt(s);
        if (isFinite(v)) {
            if (v > 0 && v < 1000) {
                this.v1Speed = v;
                SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", this.v1Speed);
                return true;
            }
            this.showErrorMessage("ENTRY OUT OF RANGE");
            return false;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    trySetVRSpeed(s) {
        if (!/^\d+$/.test(s)) {
            this.showErrorMessage("FORMAT ERROR");
            return false;
        }
        const v = parseInt(s);
        if (isFinite(v)) {
            if (v > 0 && v < 1000) {
                this.vRSpeed = v;
                SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", this.vRSpeed);
                return true;
            }
            this.showErrorMessage("ENTRY OUT OF RANGE");
            return false;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    trySetV2Speed(s) {
        if (!/^\d+$/.test(s)) {
            this.showErrorMessage("FORMAT ERROR");
            return false;
        }
        const v = parseInt(s);
        if (isFinite(v)) {
            if (v > 0 && v < 1000) {
                this.v2Speed = v;
                SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", this.v2Speed);
                return true;
            }
            this.showErrorMessage("ENTRY OUT OF RANGE");
            return false;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    trySetTransAltitude(s) {
        if (!/^\d+$/.test(s)) {
            this.showErrorMessage("FORMAT ERROR");
            return false;
        }
        const v = parseInt(s);
        if (isFinite(v) && v > 0) {
            this.transitionAltitude = v;
            SimVar.SetSimVarValue("L:AIRLINER_TRANS_ALT", "Number", this.v2Speed);
            return true;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
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
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    trySetFlapsTHS(s) {
        if (s) {
            const flaps = s.split("/")[0];
            let validEntry = false;
            if (!/^\d+$/.test(flaps)) {
                this.showErrorMessage("FORMAT ERROR");
                return false;
            }
            const vFlaps = parseInt(flaps);
            if (isFinite(vFlaps)) {
                this.flaps = vFlaps;
                validEntry = true;
            }
            const vThs = s.split("/")[1];
            if (vThs) {
                if (vThs.substr(0, 2) === "UP" || vThs.substr(0, 2) === "DN") {
                    if (isFinite(parseFloat(vThs.substr(2)))) {
                        this.ths = vThs;
                        validEntry = true;
                    }
                }
            }
            if (validEntry) {
                return true;
            }
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
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

    getFlapTakeOffSpeed() {
        const dWeight = (this.getWeight() - 42) / (75 - 42);
        return 134 + 40 * dWeight;
    }

    getSlatTakeOffSpeed() {
        const dWeight = (this.getWeight() - 42) / (75 - 42);
        return 183 + 40 * dWeight;
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
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    getClbManagedSpeed() {
        const dCI = this.costIndex / 999;
        const flapsHandleIndex = Simplane.getFlapsHandleIndex();
        if (flapsHandleIndex != 0) {
            return this.getFlapSpeed();
        }
        let speed = 220 * (1 - dCI) + 280 * dCI;
        if (SimVar.GetSimVarValue("PLANE ALTITUDE", "feet") < 10000) {
            speed = Math.min(speed, 250);
        }
        return speed;
    }

    getCrzManagedSpeed() {
        let dCI = this.costIndex / 999;
        dCI = dCI * dCI;
        const flapsHandleIndex = SimVar.GetSimVarValue("FLAPS HANDLE INDEX", "Number");
        if (flapsHandleIndex != 0) {
            return this.getFlapSpeed();
        }
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
        let speed = 288 * (1 - dCI) + 260 * dCI;
        if (SimVar.GetSimVarValue("PLANE ALTITUDE", "feet") < 10000) {
            speed = Math.min(speed, 250);
        }
        return speed;
    }

    getFlapApproachSpeed(useCurrentWeight = true) {
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

    setFlapApproachSpeed(s) {
        if (s === FMCMainDisplay.clrValue) {
            this._overridenFlapApproachSpeed = NaN;
            return true;
        }
        const v = parseFloat(s);
        if (isFinite(v)) {
            if (v > 0 && v < 300) {
                this._overridenFlapApproachSpeed = v;
                return true;
            }
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    getSlatApproachSpeed(useCurrentWeight = true) {
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

    setSlatApproachSpeed(s) {
        if (s === FMCMainDisplay.clrValue) {
            this._overridenSlatApproachSpeed = NaN;
            return true;
        }
        const v = parseFloat(s);
        if (isFinite(v)) {
            if (v > 0 && v < 300) {
                this._overridenSlatApproachSpeed = v;
                return true;
            }
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    getCleanApproachSpeed() {
        let dWeight = (this.getWeight() - 42) / (75 - 42);
        dWeight = Math.min(Math.max(dWeight, 0), 1);
        const base = Math.max(172, this.getVLS() + 5);
        return base + 40 * dWeight;
    }

    // Overridden by getManagedApproachSpeedMcdu in A320_Neo_CDU_MainDisplay
    // Not sure what to do with this
    getManagedApproachSpeed(flapsHandleIndex = NaN) {
        switch (((isNaN(flapsHandleIndex)) ? Simplane.getFlapsHandleIndex() : flapsHandleIndex)) {
            case 0:
                return this.getCleanApproachSpeed();
            case 1:
                return this.getSlatApproachSpeed();
            case 4:
                return this.getVApp();
            default:
                return this.getFlapApproachSpeed();
        }
    }

    updateCleanApproachSpeed() {
        const apprGreenDotSpeed = this.getCleanApproachSpeed();
        if (isFinite(apprGreenDotSpeed)) {
            SimVar.SetSimVarValue("L:AIRLINER_APPR_GREEN_DOT_SPD", "Number", apprGreenDotSpeed);
        }
    }

    async trySetTaxiFuelWeight(s) {
        if (!/[0-9]+(\.[0-9][0-9]?)?/.test(s)) {
            this.showErrorMessage("FORMAT ERROR");
            return false;
        }
        this._taxiEntered = true;
        const value = parseFloat(s);
        if (isFinite(value) && value >= 0) {
            this.taxiFuelWeight = value;
            return true;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    getRouteFinalFuelWeight() {
        if (isFinite(this._routeFinalFuelWeight)) {
            return this._routeFinalFuelWeight;
        } else if (isFinite(this._routeFinalFuelTime)) {
            return this.getTotalTripFuelCons() / this.getTotalTripTime() * this._routeFinalFuelTime;
        }
        return NaN;
    }

    getRouteFinalFuelTime() {
        if (isFinite(this._routeFinalFuelTime)) {
            return this._routeFinalFuelTime;
        } else if (isFinite(this._routeFinalFuelWeight)) {
            return this.getTotalTripTime() / this.getTotalTripFuelCons() * this._routeFinalFuelWeight;
        }
        return NaN;
    }

    async trySetRouteFinalFuel(s) {
        if (s) {
            const rteFinalWeight = parseFloat(s.split("/")[0]);
            const rteFinalTime = FMCMainDisplay.hhmmToSeconds(s.split("/")[1]);
            if (isFinite(rteFinalWeight)) {
                this._routeFinalFuelWeight = rteFinalWeight;
                this._routeFinalFuelTime = NaN;
                return true;
            } else if (isFinite(rteFinalTime)) {
                this._routeFinalFuelWeight = NaN;
                this._routeFinalFuelTime = rteFinalTime;
                return true;
            }
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    getRouteReservedWeight() {
        if (isFinite(this._routeReservedWeight)) {
            return this._routeReservedWeight;
        } else {
            return this._routeReservedPercent * this.blockFuel / 100;
        }
    }

    getRouteReservedPercent() {
        if (isFinite(this._routeReservedWeight) && isFinite(this.blockFuel)) {
            return this._routeReservedWeight / this.blockFuel * 100;
        }
        return this._routeReservedPercent;
    }

    /**
     * Checks input and passes to trySetCruiseFl()
     * @param input
     * @returns {boolean} input passed checks
     */
    trySetCruiseFlCheckInput(input) {
        if (input === FMCMainDisplay.clrValue) {
            this.showErrorMessage(this.defaultInputErrorMessage);
            return false;
        }
        const flString = input.replace("FL", "");
        if (!flString) {
            this.showErrorMessage(this.defaultInputErrorMessage);
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
            this.showErrorMessage(this.defaultInputErrorMessage);
            return false;
        }
        if (fl >= 1000) {
            fl = Math.floor(fl / 100);
        }
        if (fl > this.maxCruiseFL) {
            this.showErrorMessage(this.defaultInputErrorMessage);
            return false;
        }
        const phase = Simplane.getCurrentFlightPhase();
        if (fl < Math.floor(Math.max(0, Simplane.getAutoPilotDisplayedAltitudeLockValue()) / 100) && phase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            this.showErrorMessage(this.defaultInputErrorMessage);
            return false;
        }
        if (fl > Math.floor(Simplane.getAltitude() / 100) && phase > FlightPhase.FLIGHT_PHASE_CRUISE) {
            this.showErrorMessage("ENTRY OUT OF RANGE");
            return false;
        }
        if (fl > 0 && fl <= this.maxCruiseFL) {
            this.cruiseFlightLevel = fl;
            this._cruiseEntered = true;
            return true;
        }
        this.showErrorMessage("ENTRY OUT OF RANGE");
        return false;
    }

    trySetRouteReservedFuel(s) {
        if (s) {
            const rteRsvWeight = parseFloat(s.split("/")[0]);
            const rteRsvPercent = parseFloat(s.split("/")[1]);
            if (isFinite(rteRsvWeight)) {
                this._routeReservedWeight = rteRsvWeight;
                this._routeReservedPercent = 0;
                return true;
            } else if (isFinite(rteRsvPercent)) {
                this._routeReservedWeight = NaN;
                this._routeReservedPercent = rteRsvPercent;
                return true;
            }
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
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

    getTakeOffFlap() {
        return this._takeOffFlap;
    }

    setTakeOffFlap(s) {
        const value = Number.parseInt(s);
        if (isFinite(value)) {
            if (value >= 0 && value <= 30) {
                this._takeOffFlap = value;
                return true;
            }
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    getZeroFuelWeight(useLbs = false) {
        if (useLbs) {
            return this.zeroFuelWeight * 2.204623;
        }
        return this.zeroFuelWeight;
    }

    getApproachWeight(useLbs = false) {
        return this.getWeight(useLbs) * 0.25 + this.getZeroFuelWeight(useLbs) * 0.75;
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
        this.showErrorMessage(this.defaultInputErrorMessage);
        callback(false);
    }

    setZeroFuelCG(s, callback = EmptyCallback.Boolean) {
        const value = parseFloat(s);
        if (isFinite(value) && value > 0 && value < 100) {
            this.zeroFuelWeightMassCenter = value;
            this.updateTakeOffTrim();
            return callback(true);
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        callback(false);
    }

    async trySetZeroFuelWeightZFWCG(s, useLbs = false) {
        let zfw = 0;
        let zfwcg = 0;
        if (s) {
            if (s.includes("/")) {
                const sSplit = s.split("/");
                zfw = parseFloat(sSplit[0]);
                zfwcg = parseFloat(sSplit[1]);
            } else {
                zfw = parseFloat(s);
            }
        }
        if (zfw > 0 && zfwcg > 0) {
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
        }
        if (this._zeroFuelWeightZFWCGEntered) {
            if (zfw > 0) {
                if (useLbs) {
                    zfw = zfw / 2.204623;
                }
                this.setZeroFuelWeight(zfw.toString());
            } else if (zfwcg > 0) {
                this.setZeroFuelCG(zfwcg.toString());
            }

            this.updateTakeOffTrim();
            this.updateCleanTakeOffSpeed();
            this.updateCleanApproachSpeed();
            return true;
        } else {
            this.showErrorMessage("FORMAT ERROR");
            return false;
        }
    }

    getBlockFuel(useLbs = false) {
        if (useLbs) {
            return this.blockFuel * 2.204623;
        }
        return this.blockFuel;
    }

    trySetBlockFuel(s, useLbs = false) {
        let value = parseFloat(s);
        if (isFinite(value)) {
            if (useLbs) {
                value = value / 2.204623;
            }
            this.blockFuel = value;
            this.updateTakeOffTrim();
            return true;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    getWeight(useLbs = false) {
        let w = this.zeroFuelWeight + this.blockFuel;
        if (useLbs) {
            w *= 2.204623;
        }
        return w;
    }

    setWeight(a, callback = EmptyCallback.Boolean, useLbs = false) {
        let v = NaN;
        if (typeof (a) === "number") {
            v = a;
        } else if (typeof (a) === "string") {
            v = parseFloat(a);
        }
        if (isFinite(v)) {
            if (useLbs) {
                v = v / 2.204623;
            }
            if (isFinite(this.zeroFuelWeight)) {
                if (v - this.zeroFuelWeight > 0) {
                    this.blockFuel = v - this.zeroFuelWeight;
                    return callback(true);
                }
            } else {
                this.showErrorMessage("ZFW NOT SET");
                return callback(false);
            }
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return callback(false);
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
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    // If anyone wants to refactor this please do
    async trySetAverageWind(s) {
        let wind;
        if (s.includes("HD")) {
            wind = parseFloat(s.split("HD")[1]);
            this._windDir = "HD";
            if (isFinite(wind)) {
                this.averageWind = wind;
                return true;
            } else {
                this.showErrorMessage("FORMAT ERROR");
                return false;
            }
        } else if (s.includes("H")) {
            wind = parseFloat(s.split("H")[1]);
            this._windDir = "HD";
            if (isFinite(wind)) {
                this.averageWind = wind;
                return true;
            } else {
                this.showErrorMessage("FORMAT ERROR");
                return false;
            }
        } else if (s.includes("-")) {
            wind = parseFloat(s.split("-")[1]);
            this._windDir = "HD";
            if (isFinite(wind)) {
                this.averageWind = wind;
                return true;
            } else {
                this.showErrorMessage("FORMAT ERROR");
                return false;
            }
        } else if (s.includes("TL")) {
            wind = parseFloat(s.split("TL")[1]);
            this._windDir = "TL";
            if (isFinite(wind)) {
                this.averageWind = wind;
                return true;
            } else {
                this.showErrorMessage("FORMAT ERROR");
                return false;
            }
        } else if (s.includes("T")) {
            wind = parseFloat(s.split("T")[1]);
            this._windDir = "TL";
            if (isFinite(wind)) {
                this.averageWind = wind;
                return true;
            } else {
                this.showErrorMessage("FORMAT ERROR");
                return false;
            }
        } else if (s.includes("+")) { // Until the +- button on the MCDU actually shows a plus sign
            wind = parseFloat(s);
            this._windDir = "TL";
            if (isFinite(wind)) {
                this.averageWind = wind;
                return true;
            } else {
                this.showErrorMessage("FORMAT ERROR");
                return false;
            }
        }
    }

    setPerfCrzWind(s) {
        let heading = NaN;
        let speed = NaN;
        if (s) {
            const sSplit = s.split("/");
            heading = parseFloat(sSplit[0]);
            speed = parseFloat(sSplit[1]);
        }
        if ((isFinite(heading) && heading >= 0 && heading < 360) || (isFinite(speed) && speed > 0)) {
            if (isFinite(heading)) {
                this.perfCrzWindHeading = heading;
            }
            if (isFinite(speed)) {
                this.perfCrzWindSpeed = speed;
            }
            return true;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    trySetPreSelectedClimbSpeed(s) {
        const v = parseFloat(s);
        if (isFinite(v)) {
            this.preSelectedClbSpeed = v;
            return true;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    trySetPreSelectedCruiseSpeed(s) {
        const v = parseFloat(s);
        if (isFinite(v)) {
            this.preSelectedCrzSpeed = v;
            return true;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    trySetPreSelectedDescentSpeed(s) {
        const v = parseFloat(s);
        if (isFinite(v)) {
            this.preSelectedDesSpeed = v;
            return true;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
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
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    setPerfApprTemp(s) {
        const value = parseFloat(s);
        if (isFinite(value) && value > -270 && value < 150) {
            this.perfApprTemp = value;
            return true;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
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
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    setPerfApprTransAlt(s) {
        const value = parseFloat(s);
        if (isFinite(value) && value > 0 && value < 60000) {
            this.perfApprTransAlt = value;
            return true;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    getVApp() {
        if (isFinite(this.vApp)) {
            return this.vApp;
        }
        let windComp = SimVar.GetSimVarValue("AIRCRAFT WIND Z", "knots") / 3;
        windComp = Math.max(windComp, 5);
        return Math.ceil(this.getVLS() + windComp);
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
        this.showErrorMessage(this.defaultInputErrorMessage);
        return false;
    }

    getVLS() {
        // for this to be implemented a FLAPS 3 landing logic is needed.
        /*const flapsHandleIndex = Simplane.getFlapsHandleIndex();
        if (flapsHandleIndex === 3) {
            const dWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "kilograms") / 1000;
            let cg = this.zeroFuelWeightMassCenter;
            if (((isNaN(cg)) ? 24 : cg)) < 25) {
                switch (true) {
                    case (dWeight <= 40): return 116;
                    case (dWeight <= 45): return Math.ceil(116 + 0.4 * (dWeight - 40));
                    case (dWeight <= 60): return Math.ceil(118 + 1.2 * (dWeight - 45));
                    case (dWeight <= 75): return Math.ceil(136 + dWeight - 60);
                    default: return Math.ceil(150 + dWeight - 75);
                }
            }
            switch (true) {
                case (dWeight <= 45): return 116;
                case (dWeight <= 50): return Math.ceil(116 + 1.4 * (dWeight - 45));
                case (dWeight <= 55): return Math.ceil(123 + 1.2 * (dWeight - 50));
                case (dWeight <= 60): return Math.ceil(129 + dWeight - 55);
                case (dWeight <= 65): return Math.ceil(134 + 1.2 * (dWeight - 60));
                default: Math.ceil(140 + dWeight - 65);
            }
        }*/
        const dWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "kilograms") / 1000;
        const cg = this.zeroFuelWeightMassCenter;
        if (((isNaN(cg)) ? 24 : cg) < 25) {
            switch (true) {
                case (dWeight <= 50):
                    return 116;
                case (dWeight >= 75):
                    return Math.ceil(139 + .8 * (dWeight - 75));
                case (dWeight <= 55):
                    return Math.ceil(116 + .8 * (dWeight - 50));
                case (dWeight <= 70):
                    return Math.ceil(120 + dWeight - 55);
                default:
                    return Math.ceil(135 + .8 * (dWeight - 70));
            }
        }
        switch (true) {
            case (dWeight <= 50):
                return 116;
            case (dWeight >= 75):
                return Math.ceil(139 + .8 * (dWeight - 75));
            case (dWeight <= 55):
                return Math.ceil(116 + .6 * (dWeight - 50));
            default:
                return Math.ceil(119 + dWeight - 55);
        }
    }

    setPerfApprMDA(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfApprMDA = NaN;
            SimVar.SetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "number", 0);
            return true;
        } else {
            const value = parseFloat(s);
            if (isFinite(value)) {
                this.perfApprMDA = value;
                SimVar.SetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "number", this.perfApprMDA);
                return true;
            }
            this.showErrorMessage(this.defaultInputErrorMessage);
            return false;
        }
    }

    setPerfApprDH(s) {
        if (s === FMCMainDisplay.clrValue) {
            this.perfApprDH = NaN;
            SimVar.SetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "number", -1);
            return true;
        } else if (s === "NO" || s === "NO DH" || s === "NODH") {
            if (Simplane.getAutoPilotApproachType() === 4) {
                this.perfApprDH = "NO DH";
                SimVar.SetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "number", -1);
                return true;
            } else {
                this.showErrorMessage("NOT ALLOWED");
                return false;
            }
        } else {
            const value = parseFloat(s);
            if (isFinite(value)) {
                if (value >= 0 && value <= 700) {
                    this.perfApprDH = value;
                    SimVar.SetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "number", this.perfApprDH);
                    return true;
                } else {
                    this.showErrorMessage("ENTRY OUT OF RANGE");
                    return false;
                }
            }
            this.showErrorMessage(this.defaultInputErrorMessage);
            return false;
        }
    }

    getIsFlying() {
        return this.currentFlightPhase >= FlightPhase.FLIGHT_PHASE_TAKEOFF;
    }

    async tryGoInApproachPhase() {
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
            this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_APPROACH;
            Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
            return true;
        }
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
            this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_APPROACH;
            Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
            return true;
        }
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_DESCENT) {
            this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_APPROACH;
            Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
            return true;
        }
        if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_APPROACH) {
            return true;
        }
        return false;
    }

    checkUpdateFlightPhase() {
        const airSpeed = SimVar.GetSimVarValue("AIRSPEED TRUE", "knots");
        if (airSpeed > 10) {
            if (this.currentFlightPhase === 0) {
                this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_TAKEOFF;
            }
            if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_TAKEOFF) {
                const toTakeOffSpeed = this.getCleanTakeOffSpeed();
                if (isFinite(toTakeOffSpeed)) {
                    if (airSpeed >= 0.95 * toTakeOffSpeed) {
                        this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_CLIMB;
                    }
                }
                const agl = Simplane.getAltitudeAboveGround();
                if (agl > 50) {
                    this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_CLIMB;
                }
            }
            if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CLIMB) {
                const altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "feet");
                const cruiseFlightLevel = this.cruiseFlightLevel * 100;
                if (isFinite(cruiseFlightLevel)) {
                    if (altitude >= 0.96 * cruiseFlightLevel) {
                        this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_CRUISE;
                        Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
                    }
                }
            }
            if (this.currentFlightPhase === FlightPhase.FLIGHT_PHASE_CRUISE) {
                const altitude = SimVar.GetSimVarValue("PLANE ALTITUDE", "feet");
                const cruiseFlightLevel = this.cruiseFlightLevel;
                if (isFinite(cruiseFlightLevel)) {
                    if (altitude < 0.94 * cruiseFlightLevel) {
                        this.currentFlightPhase = FlightPhase.FLIGHT_PHASE_DESCENT;
                        Coherent.call("GENERAL_ENG_THROTTLE_MANAGED_MODE_SET", ThrottleMode.AUTO);
                    }
                }
            }
            if (this.flightPlanManager.getActiveWaypoint() === this.flightPlanManager.getDestination()) {
                if (SimVar.GetSimVarValue("L:FLIGHTPLAN_USE_DECEL_WAYPOINT", "number") != 1) {
                    const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                    const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                    const planeLla = new LatLongAlt(lat, long);
                    const dist = Avionics.Utils.computeGreatCircleDistance(planeLla, this.flightPlanManager.getDestination().infos.coordinates);
                    if (dist < 40) {
                        this.connectIls();
                        this.flightPlanManager.activateApproach();
                        if (this.currentFlightPhase != FlightPhase.FLIGHT_PHASE_APPROACH) {
                            this.tryGoInApproachPhase();
                        }
                    }
                }
            }
            if (SimVar.GetSimVarValue("L:FLIGHTPLAN_USE_DECEL_WAYPOINT", "number") === 1) {
                if (this.currentFlightPhase != FlightPhase.FLIGHT_PHASE_APPROACH) {
                    if (this.flightPlanManager.decelWaypoint) {
                        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
                        const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
                        const planeLla = new LatLongAlt(lat, long);
                        const dist = Avionics.Utils.computeGreatCircleDistance(this.flightPlanManager.decelWaypoint.infos.coordinates, planeLla);
                        if (dist < 3) {
                            console.log("Switching into approach. DECEL lat : " + lat + " long " + long);
                            this.tryGoInApproachPhase();
                        }
                    }
                }
            }
        }
        if (SimVar.GetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number") != this.currentFlightPhase) {
            SimVar.SetSimVarValue("L:AIRLINER_FLIGHT_PHASE", "number", this.currentFlightPhase);
            this.onFlightPhaseChanged();
        }
    }

    onFlightPhaseChanged() {
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
            return true;
        }
        const v = parseFloat(s);
        if (isFinite(v)) {
            const freq = Math.round(v * 100) / 100;
            if (this.connectIlsFrequency(freq)) {
                return true;
            }
            this.showErrorMessage("OUT OF RANGE");
            return false;
        }
        this.showErrorMessage(this.defaultInputErrorMessage);
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
        if (this.isDisplayingErrorMessage) {
            this.inOut = this.lastUserInput;
            this._inOutElement.style.color = "#ffffff";
            this.isDisplayingErrorMessage = false;
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
            } else if (this.isDisplayingErrorMessage) {
                this.inOut = this.lastUserInput;
                this._inOutElement.style.color = "#ffffff";
                this.isDisplayingErrorMessage = false;
            } else {
                this.inOut = this.inOut.slice(0, -1);
            }
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
                    this._computeV1Speed();
                    this._computeVRSpeed();
                    this._computeV2Speed();
                    SimVar.SetSimVarValue("L:AIRLINER_V1_SPEED", "Knots", this.v1Speed);
                    SimVar.SetSimVarValue("L:AIRLINER_V2_SPEED", "Knots", this.v2Speed);
                    SimVar.SetSimVarValue("L:AIRLINER_VR_SPEED", "Knots", this.vRSpeed);
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
            Prog: 5000
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
            WaypointPage: 42
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
     * @returns {number} dynamic delay in ms between 2000ms and 400ms
     */
    getDelayFuelPred() {
        return Math.pow(this.flightPlanManager.getWaypointsCount(), 2) + (this.flightPlanManager.getDestination().cumulativeDistanceInFP) / 10 + Math.random() * 300;
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

    updateFuelVars() {
        const totalWeight = SimVar.GetSimVarValue("TOTAL WEIGHT", "kilograms") / 1000;
        this.blockFuel = SimVar.GetSimVarValue("FUEL TOTAL QUANTITY", "gallons") * SimVar.GetSimVarValue("FUEL WEIGHT PER GALLON", "kilograms") / 1000;
        this.zeroFuelWeight = totalWeight - this.blockFuel;
        this.zeroFuelWeightMassCenter = SimVar.GetSimVarValue("CG PERCENT", "percent");
    }

    updateVSpeeds() {
        this.updateFuelVars();
        this._computeV1Speed();
        this._computeVRSpeed();
        this._computeV2Speed();
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
            SimVar.SetSimVarValue("L:AIRLINER_MANAGED_APPROACH_SPEED", "number", this.getManagedApproachSpeed());
        }
        this.updateRadioNavState();
    }

    onEvent(_event) {
        if (_event.indexOf("1_BTN_") !== -1 || _event.indexOf("BTN_") !== -1) {
            const input = _event.replace("1_BTN_", "").replace("BTN_", "");
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
                this.onPrevPage();
            } else if (input === "NEXTPAGE") {
                this.onNextPage();
            } else if (input === "SP") {
                this.onSp();
            } else if (input === "DEL") {
                this.onDel();
            } else if (input === "CLR") {
                this.onClr();
            } else if (input === "DIV") {
                this.onDiv();
            } else if (input === "DOT") {
                this.inOut += ".";
            } else if (input === "PLUSMINUS") {
                const val = this.inOut;
                if (val === "") {
                    this.inOut = "-";
                } else if (val !== FMCMainDisplay.clrValue && !this.isDisplayingErrorMessage) {
                    if (val.slice(-1) === "-") {
                        this.inOut = this.inOut.slice(0, -1) + "+";
                    } else if (val.slice(-1) === "+") {
                        this.inOut = this.inOut.slice(0, -1) + "-";
                    } else {
                        this.inOut += "-";
                    }
                }
            } else if (input === "Localizer") {
                this._apLocalizerOn = !this._apLocalizerOn;
            } else if (input.length === 2 && input[0] === "L") {
                const v = parseInt(input[1]);
                if (isFinite(v)) {
                    if (this.onLeftInput[v - 1]) {
                        this.onLeftInput[v - 1]();
                    }
                }
            } else if (input.length === 2 && input[0] === "R") {
                const v = parseInt(input[1]);
                if (isFinite(v)) {
                    if (this.onRightInput[v - 1]) {
                        this.onRightInput[v - 1]();
                    }
                }
            } else if (input.length === 1 && FMCMainDisplay._AvailableKeys.indexOf(input) !== -1) {
                this.onLetterInput(input);
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
        this.onPrevPage = undefined;
        this.onNextPage = undefined;
        this.pageUpdate = undefined;
        this.refreshPageCallback = undefined;
        this.page.Current = this.page.Clear;
        this.tryDeleteTimeout();
    }

    generateHTMLLayout(parent) {
        while (parent.children.length > 0) {
            parent.removeChild(parent.children[0]);
        }
        const header = document.createElement("div");
        header.id = "header";
        const title = document.createElement("span");
        title.id = "title";
        header.appendChild(title);
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
        footer.appendChild(inout);
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

    static hhmmToSeconds(hhmm) {
        if (!hhmm) {
            return NaN;
        }
        const h = parseInt(hhmm.substring(0, 2));
        const m = parseInt(hhmm.substring(2, 4));
        return h * 3600 + m * 60;
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

FMCMainDisplay.approachTypes = [
    "UNKNOWN",
    "VFR",
    "HEL",
    "TACAN",
    "NDB",
    "LORAN",
    "RNAV",
    "VOR",
    "GPS",
    "SDF",
    "LDA",
    "LOC",
    "MLS",
    "ILS"
];
FMCMainDisplay.clrValue = " CLR ";
FMCMainDisplay._AvailableKeys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
//# sourceMappingURL=FMCMainDisplay.js.map