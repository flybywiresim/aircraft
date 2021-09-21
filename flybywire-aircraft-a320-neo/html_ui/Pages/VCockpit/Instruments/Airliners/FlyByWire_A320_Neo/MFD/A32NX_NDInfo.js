class Jet_MFD_NDInfo extends HTMLElement {
    constructor() {
        super(...arguments);
        this._navMode = Jet_NDCompass_Navigation.NAV;
        this._navSource = 0;
        this._showILS = false;
        this._showET = false;
        this._dTime = 0;
        this._chronoValue = 0;
        this._chronoStarted = false;
        this._aircraft = Aircraft.A320_NEO;
    }
    get aircraft() {
        return this._aircraft;
    }
    set aircraft(_val) {
        if (this._aircraft != _val) {
            this._aircraft = _val;
        }
    }
    connectedCallback() {
        this.groundSpeed = this.querySelector("#GS_Value");
        this.trueAirSpeed = this.querySelector("#TAS_Value");
        this.windDirection = this.querySelector("#Wind_Direction");
        this.windStrength = this.querySelector("#Wind_Strength");
        this.windArrow = this.querySelector("#Wind_Arrow");
        this.topTitle = this.querySelector("#Title_Text");
        this.approach = this.querySelector("#Approach");
        this.approachType = this.querySelector("#APP_Type");
        this.approachFreq = this.querySelector("#APP_Freq");
        this.approachCourse = this.querySelector("#APP_Course_Value");
        this.approachInfo = this.querySelector("#APP_Info");
        this.waypoint = this.querySelector("#Waypoint");
        this.waypointName = this.querySelector("#WP_Name");
        this.waypointTrack = this.querySelector("#WP_Track_Value");
        this.waypointDistance = this.querySelector("#WP_Distance_Value");
        this.waypointUnit = this.querySelector("#WP_Distance_Units");
        this.waypointSymbol = this.querySelector("#WP_Degree_Symbol");
        this.waypointTime = this.querySelector("#WP_Time");
        this.VORLeft = new VORDMENavAid(this.querySelector("#VORDMENavaid_Left"), 1);
        this.VORRight = new VORDMENavAid(this.querySelector("#VORDMENavaid_Right"), 2);
        this.elapsedTime = this.querySelector("#ElapsedTime");
        this.elapsedTimeValue = this.querySelector("#ET_Value");
        this.setWind(Arinc429Word.empty(), Arinc429Word.empty(), Arinc429Word.empty(), true);
        this.setWaypoint("", 0, 0, 0, true);
        this.setMode(this._navMode, this._navSource, true);
    }
    update(_dTime, airDataReferenceSource, inertialReferenceSource) {
        this._dTime = _dTime / 1000;
        this.updateTitle();
        this.updateSpeeds(airDataReferenceSource, inertialReferenceSource);
        this.updateWaypoint();
        this.updateVOR();
        this.updateApproach();
        this.updateElapsedTime();
    }
    onEvent(_event) {
        if (_event == "Push_ET") {
            if (!this._showET) {
                this._showET = true;
                this._chronoValue = 0;
                this._chronoStarted = true;
            } else if (this._chronoStarted) {
                this._chronoStarted = false;
            } else {
                this._showET = false;
            }
        }
    }
    showILS(_val) {
        this._showILS = _val;
    }
    setMode(_navMode, _navSource, _force = false) {
        if (this._navMode != _navMode || this._navSource != _navSource || _force) {
            this._navMode = _navMode;
            this._navSource = _navSource;
            if (this._navMode == Jet_NDCompass_Navigation.NAV) {
                if (this.waypoint) {
                    this.waypoint.style.display = "block";
                }
                if (this.approach) {
                    this.approachType.textContent = "";
                    this.approachFreq.textContent = "";
                    this.approachCourse.textContent = "";
                    this.approachInfo.textContent = "";
                    this.approach.style.display = "none";
                }
            } else if (this._navMode == Jet_NDCompass_Navigation.ILS || this._navMode == Jet_NDCompass_Navigation.VOR) {
                if (this.waypoint) {
                    this.waypointName.textContent = "";
                    this.waypointTrack.textContent = "";
                    this.waypointDistance.textContent = "";
                    this.waypointTime.textContent = "";
                    this.waypoint.style.display = "none";
                }
                if (this.approach) {
                    this.approach.style.display = "block";
                }
            }
        }
    }
    updateSpeeds(airDataReferenceSource, inertialReferenceSource) {
        const windDirection = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_WIND_DIRECTION`);
        const windVelocity = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${inertialReferenceSource}_WIND_VELOCITY`);
        const heading = Arinc429Word.fromSimVarValue(`L:A32NX_ADIRS_IR_${airDataReferenceSource}_HEADING`);

        this.setWind(windDirection, windVelocity, heading);
    }
    updateWaypoint() {
        const wpETE = SimVar.GetSimVarValue("GPS WP ETE", "seconds"); // ETE is not available in Simplane 🙄
        const utcTime = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
        const utcETA = wpETE > 0 ? (utcTime + wpETE) % 86400 : 0;
        this.setWaypoint(Simplane.getNextWaypointName(), Math.round(Simplane.getNextWaypointTrack()), Simplane.getNextWaypointDistance(), utcETA, true);
    }
    setWind(_windAngle, _windStrength, _planeAngle, _force = false) {
        const anyAbnormal = !_windAngle.isNormalOperation() || !_windStrength.isNormalOperation() || !_planeAngle.isNormalOperation();
        const windAngle = anyAbnormal ? 0 : Math.round(_windAngle.value);
        const windStrength = anyAbnormal ? 0 : Math.round(_windStrength.value);
        const planeAngle = anyAbnormal ? 0 : _planeAngle.value;
        const refreshWindAngle = ((windAngle != this.currentWindAngle) || _force);
        const refreshWindStrength = ((windStrength != this.currentWindStrength) || _force);
        const refreshWindArrow = (refreshWindAngle || refreshWindStrength || (planeAngle != this.currentPlaneAngle) || _force);
        if (refreshWindAngle) {
            let startAngle = this.currentWindAngle;
            let endAngle = windAngle;
            const delta = endAngle - startAngle;
            if (delta > 180) {
                startAngle += 360;
            } else if (delta < -180) {
                endAngle += 360;
            }
            const smoothedAngle = Utils.SmoothSin(startAngle, endAngle, 0.25, this._dTime);
            this.currentWindAngle = smoothedAngle % 360;
        }
        if (refreshWindArrow) {
            this.currentPlaneAngle = planeAngle;
            if (this.windArrow != null) {
                {
                    let arrowAngle = this.currentWindAngle - this.currentPlaneAngle;
                    arrowAngle += 180;
                    const transformStr = this.windArrow.getAttribute("transform");
                    const split = transformStr.split("rotate");
                    if ((split != null) && (split.length > 0)) {
                        this.windArrow.setAttribute("transform", split[0] + " rotate(" + arrowAngle + ")");
                    }
                }
            }
        }
    }

    formatDistDecimalSvg(distValue, distDigits) {
        const [distNum, distDec] = distValue.toFixed(distDigits).split(".");
        return `${distNum}.<tspan class="small">${distDec}</tspan>`;
    }

    setWaypoint(_name, _track, _distance, _eta, _force = false) {
        if (this.waypoint) {
            if (this._navMode == Jet_NDCompass_Navigation.NAV) {
                if (_name && _name != "") {
                    if (_name != this.currentWaypointName || _force) {
                        this.currentWaypointName = _name;
                        if (this.waypointName != null) {
                            this.waypointName.textContent = _name;
                        }
                    }
                    if ((_track != this.currentWaypointTrack) || _force) {
                        this.currentWaypointTrack = _track;
                        this.waypointSymbol.textContent = String.fromCharCode(176);
                        if (this.waypointTrack) {
                            this.waypointTrack.textContent = this.currentWaypointTrack.toString().padStart(3, "0");
                        }
                    }
                    if ((_distance != this.currentWaypointDistance) || _force) {
                        this.currentWaypointDistance = _distance;
                        if (this.waypointDistance != null) {
                            this.waypointUnit.textContent = "NM";
                            if (this.currentWaypointDistance < 10000) {
                                if (this.currentWaypointDistance > 19.95) {
                                    this.waypointDistance.textContent = Math.round(this.currentWaypointDistance);
                                } else {
                                    this.waypointDistance.innerHTML = this.formatDistDecimalSvg(this.currentWaypointDistance,1);
                                }
                            } else {
                                this.waypointDistance.textContent = this.currentWaypointDistance.toFixed(0);
                            }
                        }
                    }
                    if ((_eta != this.currentWaypointTimeETA) || _force) {
                        this.currentWaypointTimeETA = _eta;
                        if (this.waypointTime != null) {
                            const hours = Math.floor(_eta / 3600);
                            const minutes = Math.floor((_eta % 3600) / 60);
                            this.waypointTime.textContent = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
                        }
                    }
                    //Fakes PPOS when there is no waypoint entered, can be removed when FPLN Manager is fully implemented.
                } else {
                    if (this.waypointName != null) {
                        this.waypointName.textContent = "PPOS";
                        this.waypointSymbol.textContent = "";
                        this.waypointUnit.textContent = "";
                    }
                    if (this.waypointTrack != null) {
                        this.waypointTrack.textContent = ""; //---°
                    }
                    if (this.waypointDistance != null) {
                        this.waypointDistance.textContent = ""; //-.-
                    }
                    if (this.waypointTime != null) {
                        this.waypointTime.textContent = ""; //--:--
                    }
                }
            }
        }
    }
    updateTitle() {
        if (this.topTitle != null) {
            switch (this._navMode) {
                case Jet_NDCompass_Navigation.NAV:
                {
                    let ilsText = null;
                    if (this._showILS) {
                        ilsText = this.getILSIdent();
                    }
                    if (ilsText) {
                        this.topTitle.textContent = ilsText;
                        this.topTitle.setAttribute("state", "ils");
                    } else {
                        this.topTitle.textContent = "";
                        this.topTitle.removeAttribute("state");
                    }
                    break;
                }
                case Jet_NDCompass_Navigation.VOR:
                {
                    this.topTitle.textContent = "VOR";
                    this.topTitle.removeAttribute("state");
                    break;
                }
                case Jet_NDCompass_Navigation.ILS:
                {
                    this.topTitle.textContent = "ILS";
                    this.topTitle.removeAttribute("state");
                    break;
                }
                default:
                {
                    this.topTitle.textContent = "";
                    break;
                }
            }
        }
    }
    updateVOR() {
        if (this.VORLeft != null) {
            this.VORLeft.update(this.gps, this.aircraft);
        }
        if (this.VORRight != null) {
            this.VORRight.update(this.gps, this.aircraft);
        }
    }

    formatVORDecimalSvg(VORvalue, VORdigits) {
        const [VORnum, VORdec] = VORvalue.toFixed(VORdigits).split(".");
        return `${VORnum}.<tspan class="small">${VORdec}</tspan>`;
    }

    updateApproach() {
        if (this.approach != null) {
            switch (this._navMode) {
                case Jet_NDCompass_Navigation.VOR:
                {
                    let vor;
                    if (this._navSource == 0) {
                        vor = this.gps.radioNav.getBestVORBeacon();
                    } else {
                        vor = this.gps.radioNav.getVORBeacon(this._navSource);
                    }
                    let suffix = "";
                    if (vor.id == 1 || this._navSource == 1) {
                        if (this.aircraft == Aircraft.A320_NEO || this.aircraft == Aircraft.CJ4) {
                            suffix = "1";
                        } else {
                            suffix = " L";
                        }
                    } else if (vor.id == 2 || this._navSource == 2) {
                        if (this.aircraft == Aircraft.A320_NEO || this.aircraft == Aircraft.CJ4) {
                            suffix = "2";
                        } else {
                            suffix = " R";
                        }
                    }
                    let type = "VOR";
                    let freq = "--.--";
                    let course = "---°";
                    let ident = "";
                    if (vor.id > 0) {
                        freq = this.formatVORDecimalSvg(parseFloat(vor.freq), 2);
                        course = Utils.leadingZeros(Math.round(vor.course), 3) + "°";
                        ident = vor.ident;
                        if (this.aircraft == Aircraft.CJ4) {
                            const hasLocalizer = SimVar.GetSimVarValue("NAV HAS LOCALIZER:" + vor.id, "Bool");
                            if (hasLocalizer) {
                                type = "LOC";
                            }
                        }
                    }
                    this.approachType.textContent = type + suffix;
                    this.approachFreq.innerHTML = freq;
                    this.approachCourse.textContent = course;
                    this.approachInfo.textContent = ident;
                    if (this.aircraft != Aircraft.CJ4) {
                        this.approachFreq.setAttribute("class", "Large");
                        this.approachCourse.setAttribute("class", "ValueVor");
                        this.approachInfo.setAttribute("class", "Large");
                    }
                    break;
                }
                case Jet_NDCompass_Navigation.ILS:
                {
                    let ils;
                    if (this._navSource == 0) {
                        ils = this.gps.radioNav.getBestILSBeacon();
                    } else {
                        ils = this.gps.radioNav.getILSBeacon(this._navSource);
                    }
                    let suffix = "";
                    if (ils.id == 1 || ils.id == 3 || this._navSource == 1) {
                        if (this.aircraft == Aircraft.A320_NEO || this.aircraft == Aircraft.CJ4) {
                            suffix = "1";
                        } else {
                            suffix = " L";
                        }
                    } else if (ils.id == 2 || ils.id == 4 || this._navSource == 2) {
                        if (this.aircraft == Aircraft.A320_NEO || this.aircraft == Aircraft.CJ4) {
                            suffix = "2";
                        } else {
                            suffix = " R";
                        }
                    }
                    const type = "ILS";
                    let freq = "--.--";
                    let course = "---°";
                    let ident = "";
                    if (ils.id > 0) {
                        freq = this.formatVORDecimalSvg(parseFloat(ils.freq), 2);
                        course = Utils.leadingZeros(Math.round(ils.course), 3) + "°";
                        ident = ils.ident;
                    }
                    this.approachType.textContent = type + suffix;
                    this.approachFreq.innerHTML = freq;
                    this.approachCourse.textContent = course;
                    this.approachInfo.textContent = ident;
                    if (this.aircraft != Aircraft.CJ4) {
                        this.approachFreq.setAttribute("class", "ValueIls");
                        this.approachCourse.setAttribute("class", "ValueIls");
                        this.approachInfo.setAttribute("class", "ValueIls");
                    }
                    break;
                }
            }
        }
    }
    updateElapsedTime() {
        if (this.elapsedTime) {
            if (this._showET) {
                if (this._chronoStarted) {
                    this._chronoValue += this._dTime;
                }
                const hours = Math.floor(this._chronoValue / 3600);
                const minutes = Math.floor((this._chronoValue - (hours * 3600)) / 60);
                const seconds = Math.floor(this._chronoValue - (minutes * 60) - (hours * 3600));
                let val = "";
                if (hours > 0) {
                    if (hours < 10) {
                        val += "0";
                    }
                    val += hours;
                    val += ":";
                    if (minutes < 10) {
                        val += "0";
                    }
                    val += minutes;
                } else {
                    if (minutes < 10) {
                        val += "0";
                    }
                    val += minutes;
                    val += ":";
                    if (seconds < 10) {
                        val += "0";
                    }
                    val += seconds;
                }
                this.elapsedTimeValue.textContent = val;
                this.elapsedTime.style.display = "block";
            } else {
                this.elapsedTime.style.display = "none";
            }
        }
    }
    getILSIdent() {
        const localizer = this.gps.radioNav.getBestILSBeacon();
        if (localizer.id > 0) {
            return localizer.name;
        }
        return null;
    }
}
class VORDMENavAid {
    constructor(_parent, _index) {
        this.parent = _parent;
        this.index = _index;
        if (this.parent != null) {
            this.stateText = _parent.querySelector("#State");
            this.idText = _parent.querySelector("#ID");
            this.modeText = _parent.querySelector("#Mode");
            this.distanceText = _parent.querySelector("#Distance");
            this.unitText = _parent.querySelector("#Unit");
            this.arrowShape = _parent.querySelector("#Arrow");
        }
        this.setState(NAV_AID_STATE.OFF, true);
        this.setIDValue(0, true);
        this.setMode(NAV_AID_MODE.NONE, true);
        this.setDistanceValue(0, true);
    }
    update(_gps, _aircraft) {
        this.gps = _gps;
        this.aircraft = _aircraft;
        const url = document.getElementsByTagName("a320-neo-mfd-element")[0].getAttribute("url");
        const index = parseInt(url.substring(url.length - 1));
        let state = Simplane.getAutoPilotNavAidState(_aircraft, index, this.index);
        if (_aircraft == Aircraft.B747_8) {
            state--;
            if (state < 0) {
                state = 2;
            }
        }
        this.setState(state);
        if (this.currentState != NAV_AID_STATE.OFF) {
            this.setDistanceValue(0);
            if (this.currentState == NAV_AID_STATE.VOR) {
                this.setIDValue(this.gps.radioNav.getVORActiveFrequency(this.index), true);

                const hasDme = SimVar.GetSimVarValue(`NAV HAS DME:${this.index}`, "boolean");
                if (hasDme) {
                    this.setDistanceValue(SimVar.GetSimVarValue(`NAV DME:${this.index}`, "nautical miles"));
                }
            } else {
                this.setIDValue(this.gps.radioNav.getADFActiveFrequency(this.index), true);
            }
            this.setMode(NAV_AID_MODE.MANUAL);
        }
    }
    setState(_state, _force = false) {
        if ((_state != this.currentState) || _force) {
            this.currentState = _state;
            let show = false;
            let type = "";
            switch (this.currentState) {
                case NAV_AID_STATE.ADF:
                {
                    type = "ADF";
                    if (this.aircraft == Aircraft.A320_NEO || this.aircraft == Aircraft.CJ4) {
                        type += this.index.toString();
                    } else if (this.index == 1) {
                        type += " L";
                    } else {
                        type += " R";
                    }
                    show = true;
                    break;
                }
                case NAV_AID_STATE.VOR:
                {
                    type = "VOR";
                    if (this.aircraft == Aircraft.A320_NEO || this.aircraft == Aircraft.CJ4) {
                        type += this.index.toString();
                    } else if (this.index == 1) {
                        type += " L";
                    } else {
                        type += " R";
                    }
                    show = true;
                    break;
                }
            }
            if (this.parent != null) {
                this.parent.style.display = show ? "block" : "none";
            }
            if (this.stateText != null) {
                this.stateText.textContent = type;
            }
        }
    }

    formatDecimalSvg(value, digits) {
        const [num, dec] = value.toFixed(digits).split(".");
        return `${num}.<tspan class="small">${dec}</tspan>`;
    }

    /**
     * Modify to show ID instead of frequency when locked
     *
     * @param {number} _value frequency of the selected navigation aid
     * @param {boolean} _force force update even when value does not changed
     */
    setIDValue(_value, _force = false) {
        if ((_value != this.idValue) || _force) {
            this.idValue = _value;
            if (this.idText != null) {
                if (this.idValue == 0) {
                    this.idText.textContent = "";
                } else {
                    switch (this.currentState) {
                        case NAV_AID_STATE.ADF:
                            if (SimVar.GetSimVarValue(`ADF SIGNAL:${this.index}`, "number")) {
                                this.idText.textContent = SimVar.GetSimVarValue(`ADF IDENT:${this.index}`, "string");
                            } else {
                                this.idText.innerHTML = this.formatDecimalSvg(parseFloat(this.idValue), 2);
                            }
                            break;
                        case NAV_AID_STATE.VOR:
                            if (SimVar.GetSimVarValue(`NAV HAS NAV:${this.index}`, "number")) {
                                this.idText.textContent = SimVar.GetSimVarValue(`NAV IDENT:${this.index}`, "string");
                            } else {
                                this.idText.innerHTML = this.formatDecimalSvg(parseFloat(this.idValue), 2);
                            }
                            break;
                        default:
                            this.idText.innerHTML = this.formatDecimalSvg(parseFloat(this.idValue), 2);
                    }
                }
            }
        }
    }

    setMode(_state, _force = false) {
        if ((_state != this.currentMode) || _force) {
            this.currentMode = _state;
            let mode = "";
            switch (this.currentMode) {
                case NAV_AID_MODE.MANUAL:
                {
                    mode = "M";
                    break;
                }
                case NAV_AID_MODE.REMOTE:
                {
                    mode = "R";
                    break;
                }
            }
            if (this.modeText != null) {
                this.modeText.textContent = mode;
            }
        }
    }
    setDistanceValue(_value, _force = false) {
        if ((_value != this.distanceValue) || _force) {
            this.distanceValue = _value;
            const showDistance = (this.distanceValue > 0);
            // var displayStr = showDistance ? "block" : "none";
            const displayStr = "block";
            if (this.distanceText != null) {
                if (showDistance) {
                    if (this.distanceValue > 19.95) {
                        this.distanceText.textContent = Math.round(this.distanceValue);
                    } else {
                        this.distanceText.innerHTML = this.formatDecimalSvg(this.distanceValue, 1);
                    }
                } else {
                    this.distanceText.textContent = "---";
                }
                this.distanceText.style.display = displayStr;
            }
            if (this.unitText != null) {
                this.unitText.style.display = displayStr;
            }
        }
    }
}
customElements.define("jet-mfd-nd-info", Jet_MFD_NDInfo);
