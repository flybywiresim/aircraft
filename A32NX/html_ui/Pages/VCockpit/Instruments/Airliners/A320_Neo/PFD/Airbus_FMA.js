var Airbus;
(function (Airbus) {
    class FMA extends HTMLElement {
        constructor() {
            super(...arguments);
            this._aircraft = Aircraft.A320_NEO;
        }
        get aircraft() {
            return this._aircraft;
        }
        set aircraft(_val) {
            if (this._aircraft != _val) {
                this._aircraft = _val;
                this.init();
            }
        }
        connectedCallback() {
            this.init();
        }
        init() {
            Utils.RemoveAllChildren(this);
            Airbus_FMA.CurrentPlaneState.init();
            this.columns = new Array();
            this.columns.push(new Airbus_FMA.Column1(this));
            this.columns.push(new Airbus_FMA.Column2(this));
            this.columns.push(new Airbus_FMA.Column3(this));
            this.columns.push(new Airbus_FMA.Column4(this));
            this.columns.push(new Airbus_FMA.Column5(this));
            for (var i = 0; i < this.columns.length; ++i) {
                this.columns[i].init();
            }
            this.vertAndLat = new Airbus_FMA.VerticalAndLateral(this);
            this.vertAndLat.init();
            this.specialMessages = new Airbus_FMA.SpecialMessages(this);
            this.specialMessages.init();
        }
        update(_dTime) {
            Airbus_FMA.CurrentPlaneState.refresh();
            for (var i = 0; i < this.columns.length; ++i) {
                if (this.columns[i] != null) {
                    this.columns[i].update(_dTime);
                }
            }
            if (this.vertAndLat != null) {
                this.vertAndLat.update(_dTime);
            }
            if (this.specialMessages != null) {
                this.specialMessages.update(_dTime);
            }
        }
    }
    Airbus.FMA = FMA;
})(Airbus || (Airbus = {}));
var Airbus_FMA;
(function (Airbus_FMA) {
    class Definitions {
    }
    Definitions.HIGHLIGHT_LENGTH = 10 * 1000;
    Definitions.ALT_ENGAGED_RANGE = 20;
    Airbus_FMA.Definitions = Definitions;
    let MODE_STATE;
    (function (MODE_STATE) {
        MODE_STATE[MODE_STATE["NONE"] = 0] = "NONE";
        MODE_STATE[MODE_STATE["ENGAGED"] = 1] = "ENGAGED";
        MODE_STATE[MODE_STATE["CAPTURED"] = 2] = "CAPTURED";
        MODE_STATE[MODE_STATE["ARMED"] = 3] = "ARMED";
        MODE_STATE[MODE_STATE["CONSTRAINED"] = 4] = "CONSTRAINED";
        MODE_STATE[MODE_STATE["ACTIVE"] = 5] = "ACTIVE";
        MODE_STATE[MODE_STATE["STATUS"] = 6] = "STATUS";
        MODE_STATE[MODE_STATE["WARNING"] = 7] = "WARNING";
        MODE_STATE[MODE_STATE["DANGER"] = 8] = "DANGER";
        MODE_STATE[MODE_STATE["ACTIVE_BLINK"] = 9] = "ACTIVE_BLINK";
    })(MODE_STATE = Airbus_FMA.MODE_STATE || (Airbus_FMA.MODE_STATE = {}));
    let HIGHLIGHT_STYLE;
    (function (HIGHLIGHT_STYLE) {
        HIGHLIGHT_STYLE[HIGHLIGHT_STYLE["NONE"] = 0] = "NONE";
        HIGHLIGHT_STYLE[HIGHLIGHT_STYLE["FULL"] = 1] = "FULL";
        HIGHLIGHT_STYLE[HIGHLIGHT_STYLE["FULL_WARNING"] = 2] = "FULL_WARNING";
        HIGHLIGHT_STYLE[HIGHLIGHT_STYLE["OPEN_TOP"] = 3] = "OPEN_TOP";
        HIGHLIGHT_STYLE[HIGHLIGHT_STYLE["OPEN_TOP_WARNING"] = 4] = "OPEN_TOP_WARNING";
        HIGHLIGHT_STYLE[HIGHLIGHT_STYLE["OPEN_BOTTOM"] = 5] = "OPEN_BOTTOM";
        HIGHLIGHT_STYLE[HIGHLIGHT_STYLE["OPEN_BOTTOM_WARNING"] = 6] = "OPEN_BOTTOM_WARNING";
    })(HIGHLIGHT_STYLE = Airbus_FMA.HIGHLIGHT_STYLE || (Airbus_FMA.HIGHLIGHT_STYLE = {}));
    function TEXT_STYLE_CLASS(_style) {
        switch (_style) {
            case Airbus_FMA.MODE_STATE.ENGAGED: return "Engaged";
            case Airbus_FMA.MODE_STATE.CAPTURED: return "Captured";
            case Airbus_FMA.MODE_STATE.ARMED: return "Armed";
            case Airbus_FMA.MODE_STATE.CONSTRAINED: return "Constrained";
            case Airbus_FMA.MODE_STATE.ACTIVE: return "Active";
            case Airbus_FMA.MODE_STATE.STATUS: return "Status";
            case Airbus_FMA.MODE_STATE.WARNING: return "Warning";
            case Airbus_FMA.MODE_STATE.DANGER: return "Danger";
            case Airbus_FMA.MODE_STATE.ACTIVE_BLINK: return "ActiveBlink";
        }
        return "";
    }
    Airbus_FMA.TEXT_STYLE_CLASS = TEXT_STYLE_CLASS;
    class CurrentPlaneState {
        static init() {
        }
        static refresh() {
            this.autoPilotActive[0] = Simplane.getAutoPilotActive(1);
            this.autoPilotActive[1] = Simplane.getAutoPilotActive(2);
            this.anyAutoPilotsActive = (this.autoPilotActive[0] || this.autoPilotActive[1]);
            this.bothAutoPilotsActive = (this.autoPilotActive[0] && this.autoPilotActive[1]);
            this.autoPilotFlightDirectorActive[0] = Simplane.getAutoPilotFlightDirectorActive(1);
            this.autoPilotFlightDirectorActive[1] = Simplane.getAutoPilotFlightDirectorActive(2);
            this.anyFlightDirectorsActive = (this.autoPilotFlightDirectorActive[0] || this.autoPilotFlightDirectorActive[1]);
            this.bothFlightDirectorsActive = (this.autoPilotFlightDirectorActive[0] && this.autoPilotFlightDirectorActive[1]);
            this.autoPilotTOGAActive = Simplane.getAutoPilotTOGAActive();
            this.autoPilotThrottleArmed = Simplane.getAutoPilotThrottleArmed();
            this.autoPilotAirspeedHoldActive = Simplane.getAutoPilotAirspeedHoldActive();
            this.autoPilotVerticalSpeedHoldActive = Simplane.getAutoPilotVerticalSpeedHoldActive();
            this.autoPilotVerticalSpeedHoldValue = Simplane.getAutoPilotVerticalSpeedHoldValue();
            this.autoPilotFlightPathAngle = Simplane.getAutoPilotFlightPathAngle();
            this.autoPilotAltitudeLockActive = Simplane.getAutoPilotAltitudeLockActive();
            this.autoPilotAltitudeArmed = Simplane.getAutoPilotAltitudeArmed();
            this.autoPilotAltitudeLockValue = Simplane.getAutoPilotAltitudeLockValue();
            this.autoPilotHeadingSelectedMode = Simplane.getAutoPilotHeadingSelected();
            this.autoPilotHeadingManagedMode = Simplane.getAutoPilotHeadingManaged();
            this.autoPilotThrottleActive = Simplane.getAutoPilotThrottleActive();
            this.autoPilotThrottleLocked = Simplane.getAutoPilotThrottleLocked();
            this.autoPilotMachModeActive = Simplane.getAutoPilotMachModeActive();
            this.autoPilotGlideslopeActive = Simplane.getAutoPilotGlideslopeActive();
            this.autoPilotTRKFPAModeActive = Simplane.getAutoPilotTRKFPAModeActive();
            this.altitude = Simplane.getAltitude();
            this.flapsHandlePercent = Simplane.getFlapsHandlePercent();
            this.flightPhase = Simplane.getCurrentFlightPhase();
            var approachType = ApproachType.APPROACH_TYPE_ILS;
            this.isILSApproachActive = ((this.flightPhase == FlightPhase.FLIGHT_PHASE_APPROACH) && (approachType == ApproachType.APPROACH_TYPE_ILS));
            this.isNonILSApproachActive = ((this.flightPhase == FlightPhase.FLIGHT_PHASE_APPROACH) && (approachType != ApproachType.APPROACH_TYPE_ILS));
            this.leftThrottleDetent = Simplane.getEngineThrottleMode(0);
            this.rightThrottleDetent = Simplane.getEngineThrottleMode(1);
            this.highestThrottleDetent = (this.leftThrottleDetent >= this.rightThrottleDetent) ? this.leftThrottleDetent : this.rightThrottleDetent;
            this.managedAirspeed = SimVar.GetSimVarValue("L:AP_MANAGED_AIRSPEED", "number");
            this.minimumDescentAltitude = SimVar.GetSimVarValue("L:AIRLINER_MINIMUM_DESCENT_ALTITUDE", "number");
            this.decisionHeight = SimVar.GetSimVarValue("L:AIRLINER_DECISION_HEIGHT", "number");
            this.radioAltitude = Simplane.getAltitudeAboveGround();
            this.flexTemperature = Simplane.getFlexTemperature();
        }
    }
    CurrentPlaneState.autoPilotActive = [false, false];
    CurrentPlaneState.autoPilotFlightDirectorActive = [false, false];
    Airbus_FMA.CurrentPlaneState = CurrentPlaneState;
	AltCaptured = false;
    class Cell {
        constructor(_parent, _className) {
            this.parent = _parent;
            this.divRef = window.document.createElement("div");
            this.divRef.id = _className;
            this.divRef.className = Airbus_FMA.TEXT_STYLE_CLASS(Airbus_FMA.MODE_STATE.NONE);
            if (_parent != null) {
                _parent.appendChild(this.divRef);
            }
        }
        init() {
            this.textStyle = Airbus_FMA.MODE_STATE.NONE;
        }
        setVisibility(_show) {
            if (this.divRef != null) {
                this.divRef.style.display = _show ? "block" : "none";
            }
        }
        setText(_text, _style) {
            if (this.divRef != null) {
                if ((this.divRef.textContent != _text) || (this.textStyle != _style)) {
                    this.divRef.textContent = _text;
                    this.textStyle = _style;
                    this.divRef.className = Airbus_FMA.TEXT_STYLE_CLASS(this.textStyle);
                    return true;
                }
            }
            return false;
        }
    }
    Airbus_FMA.Cell = Cell;
    class Row extends Airbus_FMA.Cell {
        constructor(_parent, _className, _createSubCells) {
            super(_parent, _className);
            this.subLeft = null;
            this.subRight = null;
            if (_createSubCells && (this.parent != null)) {
                this.subLeft = new Airbus_FMA.Cell(this.parent, _className + "SubLeft");
                this.subLeft.setText("", Airbus_FMA.MODE_STATE.NONE);
                this.subRight = new Airbus_FMA.Cell(this.parent, _className + "SubRight");
                this.subRight.setText("", Airbus_FMA.MODE_STATE.NONE);
            }
        }
        init() {
            super.init();
            this.highlightStyle = Airbus_FMA.HIGHLIGHT_STYLE.FULL;
            this.hideHighlight();
            if (this.subLeft != null) {
                this.subLeft.init();
            }
            if (this.subRight != null) {
                this.subRight.init();
            }
        }
        update(_deltaTime) {
            if (this.highlightTime > 0) {
                this.highlightTime -= _deltaTime;
                if (this.highlightTime <= 0) {
                    this.hideHighlight();
                }
            }
        }
        setMainText(_text, _style) {
            var changed = this.setText(_text, _style);
            if (_text.length <= 0) {
                this.hideHighlight();
            }
            else if (changed) {
                this.showHighlight();
            }
            if (this.subLeft != null) {
                this.subLeft.setText("", Airbus_FMA.MODE_STATE.NONE);
            }
            if (this.subRight != null) {
                this.subRight.setText("", Airbus_FMA.MODE_STATE.NONE);
            }
        }
        setSubTexts(_textLeft, _styleLeft, _textRight, _styleRight) {
            this.setText("", Airbus_FMA.MODE_STATE.NONE);
            if (this.subLeft != null) {
                if (this.subLeft.setText(_textLeft, _styleLeft)) {
                    if (_textLeft.length > 0) {
                        this.showHighlight();
                    }
                    else {
                        this.hideHighlight();
                    }
                }
            }
            if (this.subRight != null) {
                this.subRight.setText(_textRight, _styleRight);
            }
        }
        setHighlightStyle(_highlightStyle) {
            this.highlightStyle = _highlightStyle;
        }
        showHighlight() {
            if (this.divRef != null) {
                if (this.highlightStyle != Airbus_FMA.HIGHLIGHT_STYLE.NONE) {
                    var colour = "white";
                    var showTop = true;
                    var showBottom = true;
                    switch (this.highlightStyle) {
                        case Airbus_FMA.HIGHLIGHT_STYLE.FULL_WARNING:
                            {
                                colour = "orange";
                                break;
                            }
                        case Airbus_FMA.HIGHLIGHT_STYLE.OPEN_BOTTOM:
                            {
                                showBottom = false;
                                break;
                            }
                        case Airbus_FMA.HIGHLIGHT_STYLE.OPEN_BOTTOM_WARNING:
                            {
                                colour = "orange";
                                showBottom = false;
                                break;
                            }
                        case Airbus_FMA.HIGHLIGHT_STYLE.OPEN_TOP:
                            {
                                showTop = false;
                                break;
                            }
                        case Airbus_FMA.HIGHLIGHT_STYLE.OPEN_TOP_WARNING:
                            {
                                colour = "orange";
                                showTop = false;
                                break;
                            }
                    }
                    var styleStr;
                    if (this.divRef.id === "Row1")
                        styleStr = "solid 2px " + colour;
                    else
                        styleStr = colour;
                    this.divRef.style.borderLeft = styleStr;
                    this.divRef.style.borderRight = styleStr;
                    if (showTop) {
                        this.divRef.style.borderTop = styleStr;
                    }
                    else {
                        this.divRef.style.borderTop = "none";
                    }
                    if (showBottom) {
                        this.divRef.style.borderBottom = styleStr;
                    }
                    else {
                        this.divRef.style.borderBottom = "none";
                    }
                    this.highlightTime = Airbus_FMA.Definitions.HIGHLIGHT_LENGTH;
                }
            }
        }
        hideHighlight() {
            if (this.divRef != null) {
                this.divRef.style.borderLeft = "none";
                this.divRef.style.borderRight = "none";
                this.divRef.style.borderTop = "none";
                this.divRef.style.borderBottom = "none";
            }
            this.highlightTime = 0;
        }
    }
    Airbus_FMA.Row = Row;
    class ColumnBase {
        constructor(_parent) {
            this.parent = _parent;
            this.divMain = window.document.createElement("div");
            this.divMain.id = this.getMainDivName();
            _parent.appendChild(this.divMain);
            this.rows = new Array();
            this.rows.push(new Airbus_FMA.Row(this.divMain, "Row1", this.createSubCellsOnRow1()));
            this.rows.push(new Airbus_FMA.Row(this.divMain, "Row2", this.createSubCellsOnRow2()));
            this.rows.push(new Airbus_FMA.Row(this.divMain, "Row3", this.createSubCellsOnRow3()));
        }
        createSubCellsOnRow1() { return false; }
        createSubCellsOnRow2() { return false; }
        createSubCellsOnRow3() { return false; }
        init() {
            if (this.rows != null) {
                for (var i = 0; i < this.rows.length; ++i) {
                    if (this.rows[i] != null) {
                        this.rows[i].init();
                    }
                }
            }
            this.initChild();
        }
        update(_deltaTime) {
            if (this.rows != null) {
                for (var i = 0; i < this.rows.length; ++i) {
                    if (this.rows[i] != null) {
                        this.rows[i].update(_deltaTime);
                    }
                }
            }
            this.updateChild(_deltaTime);
        }
        setRowHighlightStyle(_row, _highlightStyle) {
            if (this.rows != null) {
                if ((_row >= 0) && (_row < this.rows.length)) {
                    if (this.rows[_row] != null) {
                        this.rows[_row].setHighlightStyle(_highlightStyle);
                    }
                }
            }
        }
        setRowText(_row, _text, _style) {
            if (this.rows != null) {
                if ((_row >= 0) && (_row < this.rows.length)) {
                    if (this.rows[_row] != null) {
                        this.rows[_row].setMainText(_text, _style);
                    }
                }
            }
        }
        setRowMultiText(_row, _textLeft, _styleLeft, _textRight, _styleRight) {
            if (this.rows != null) {
                if ((_row >= 0) && (_row < this.rows.length)) {
                    if (this.rows[_row] != null) {
                        this.rows[_row].setSubTexts(_textLeft, _styleLeft, _textRight, _styleRight);
                    }
                }
            }
        }
    }
    Airbus_FMA.ColumnBase = ColumnBase;
    class Column1 extends Airbus_FMA.ColumnBase {
        constructor() {
            super(...arguments);
            this._blink = 0;
        }
        createSubCellsOnRow2() { return true; }
        getMainDivName() {
            return "Column1";
        }
        initChild() {
            this.currentRow1And2State = Column1.ROW_1_2_STATE.NONE;
            this.currentRow3State = Column1.ROW_3_STATE.NONE;
        }
        updateChild(_deltaTime) {
            var targetRow1And2State = this.getTargetRow1And2State();
            if ((targetRow1And2State != this.currentRow1And2State) || (this.currentRow1And2State == Column1.ROW_1_2_STATE.MANFLX)) {
                this.currentRow1And2State = targetRow1And2State;
                this.setRowText(0, "", Airbus_FMA.MODE_STATE.NONE);
                this.setRowText(1, "", Airbus_FMA.MODE_STATE.NONE);
                switch (this.currentRow1And2State) {
                    case Column1.ROW_1_2_STATE.MANTOGA:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.OPEN_BOTTOM);
                            this.setRowHighlightStyle(1, Airbus_FMA.HIGHLIGHT_STYLE.OPEN_TOP);
                            this.setRowText(0, "MAN", Airbus_FMA.MODE_STATE.STATUS);
                            this.setRowText(1, "TOGA", Airbus_FMA.MODE_STATE.STATUS);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.TOGA:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.FULL);
                            this.setRowText(0, "TOGA", Airbus_FMA.MODE_STATE.STATUS);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.MANFLX:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.OPEN_BOTTOM);
                            this.setRowHighlightStyle(1, Airbus_FMA.HIGHLIGHT_STYLE.OPEN_TOP);
                            this.setRowText(0, "MAN", Airbus_FMA.MODE_STATE.STATUS);
                            this.setRowMultiText(1, "FLX", Airbus_FMA.MODE_STATE.STATUS, Airbus_FMA.CurrentPlaneState.flexTemperature.toFixed(0), Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.MANMCT:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.OPEN_BOTTOM);
                            this.setRowHighlightStyle(1, Airbus_FMA.HIGHLIGHT_STYLE.OPEN_TOP);
                            this.setRowText(0, "MAN", Airbus_FMA.MODE_STATE.STATUS);
                            this.setRowText(1, "MCT", Airbus_FMA.MODE_STATE.STATUS);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.MANTHR:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.OPEN_BOTTOM_WARNING);
                            this.setRowHighlightStyle(1, Airbus_FMA.HIGHLIGHT_STYLE.OPEN_TOP_WARNING);
                            this.setRowText(0, "MAN", Airbus_FMA.MODE_STATE.STATUS);
                            this.setRowText(1, "THR", Airbus_FMA.MODE_STATE.STATUS);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.THRMCT:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.FULL);
                            this.setRowText(0, "THR MCT", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.THRCLB:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.FULL);
                            this.setRowText(0, "THR CLB", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.THRLVR:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.FULL);
                            this.setRowText(0, "THR LVR", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.THRIDLE:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.FULL);
                            this.setRowText(0, "THR IDLE", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.AFLOOR:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.FULL_WARNING);
                            this.setRowText(0, "A.FLOOR", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.TOGALK:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.FULL_WARNING);
                            this.setRowText(0, "TOGA LK", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.SPEED:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.FULL);
                            this.setRowText(0, "SPEED", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.MACH:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.FULL);
                            this.setRowText(0, "MACH", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column1.ROW_1_2_STATE.THRLK:
                        {
                            this.setRowHighlightStyle(0, Airbus_FMA.HIGHLIGHT_STYLE.FULL);
                            this.setRowText(0, "THR LK", Airbus_FMA.MODE_STATE.WARNING);
                            break;
                        }
                }
            }
            var targetRow3State = this.getTargetRow3State();
            if (targetRow3State != this.currentRow3State) {
                this.currentRow3State = targetRow3State;
                switch (this.currentRow3State) {
                    case Column1.ROW_3_STATE.LVRCLB:
                        {
                            this.setRowText(2, "LVR CLB", Airbus_FMA.MODE_STATE.ACTIVE_BLINK);
                            break;
                        }
                    case Column1.ROW_3_STATE.LVRMCT:
                        {
                            this.setRowText(2, "LVR MCT", Airbus_FMA.MODE_STATE.STATUS);
                            break;
                        }
                    case Column1.ROW_3_STATE.LVRASYM:
                        {
                            this.setRowText(2, "LVR ASYM", Airbus_FMA.MODE_STATE.WARNING);
                            break;
                        }
                    default:
                        {
                            this.setRowText(2, "", Airbus_FMA.MODE_STATE.NONE);
                            break;
                        }
                }
            }
        }
        getTargetRow1And2State() {
            if (this.IsActive_AFLOOR()) {
                return Column1.ROW_1_2_STATE.AFLOOR;
            }
            else if (this.IsActive_MANTOGA()) {
                return Column1.ROW_1_2_STATE.MANTOGA;
            }
            else if (this.IsActive_TOGA()) {
                return Column1.ROW_1_2_STATE.TOGA;
            }
            else if (this.IsActive_TOGALK()) {
                return Column1.ROW_1_2_STATE.TOGALK;
            }
            else if (this.IsActive_MANFLX()) {
                return Column1.ROW_1_2_STATE.MANFLX;
            }
            else if (this.IsActive_MANMCT()) {
                return Column1.ROW_1_2_STATE.MANMCT;
            }
            else if (this.IsActive_MANTHR()) {
                return Column1.ROW_1_2_STATE.MANTHR;
            }
            else if (this.IsActive_THRMCT()) {
                return Column1.ROW_1_2_STATE.THRMCT;
            }
            else if (this.IsActive_THRCLB()) {
                return Column1.ROW_1_2_STATE.THRCLB;
            }
            else if (this.IsActive_THRLVR()) {
                return Column1.ROW_1_2_STATE.THRLVR;
            }
            else if (this.IsActive_THRIDLE()) {
                return Column1.ROW_1_2_STATE.THRIDLE;
            }
			else if (this.IsActive_SPEED()) {
                return Column1.ROW_1_2_STATE.SPEED;
			}
            else if (this.IsActive_MACH()) {
                return Column1.ROW_1_2_STATE.MACH;
            }
            else if (this.IsActive_THRLK()) {
                return Column1.ROW_1_2_STATE.THRLK;
            }
            else {
                return Column1.ROW_1_2_STATE.NONE;
            }
        }
        getTargetRow3State() {
            if (this.IsActive_LVRCLB()) {
                return Column1.ROW_3_STATE.LVRCLB;
            }
            else if (this.IsActive_LVRMCT()) {
                return Column1.ROW_3_STATE.LVRMCT;
            }
            else if (this.IsActive_LVRASYM()) {
                return Column1.ROW_3_STATE.LVRASYM;
            }
            else {
                return Column1.ROW_3_STATE.NONE;
            }
        }
        IsActive_MANTOGA() {
            if (!Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive && Airbus_FMA.CurrentPlaneState.autoPilotThrottleArmed && (Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.TOGA)) {
                return true;
            }
            return false;
        }
        IsActive_TOGA() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive && (Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.TOGA)) {
                return true;
            }
            return false;
        }
        IsActive_MANFLX() {
            if (!Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive && Airbus_FMA.CurrentPlaneState.autoPilotThrottleArmed && (Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.FLEX_MCT)) {
                if ((Airbus_FMA.CurrentPlaneState.flightPhase <= FlightPhase.FLIGHT_PHASE_TAKEOFF) && (Airbus_FMA.CurrentPlaneState.flexTemperature > 0)) {
                    return true;
                }
            }
            return false;
        }
        IsActive_MANMCT() {
            if (!Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive && Airbus_FMA.CurrentPlaneState.autoPilotThrottleArmed && (Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.FLEX_MCT)) {
                if ((Airbus_FMA.CurrentPlaneState.flightPhase > FlightPhase.FLIGHT_PHASE_TAKEOFF) || (Airbus_FMA.CurrentPlaneState.flexTemperature <= 0)) {
                    return true;
                }
            }
            return false;
        }
        IsActive_MANTHR() {
            if (!Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive && Airbus_FMA.CurrentPlaneState.autoPilotThrottleArmed && (Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.CLIMB)) {
                return true;
            }
            return false;
        }
        IsActive_THRMCT() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive && (Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.FLEX_MCT)) {
                return true;
            }
            return false;
        }
        IsActive_THRCLB() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive &&
                Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.CLIMB &&
                Simplane.getVerticalSpeed() > 150 && !AltCaptured && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
				return true;
            }
            return false;
        }
        IsActive_THRLVR() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive &&
                Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.AUTO) {
                return true;
            }
            return false;
        }
        IsActive_THRIDLE() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive && Simplane.getVerticalSpeed() < -150) {
                return true;
            }
            return false;
        }
        IsActive_AFLOOR() {
            return Airbus_FMA.CurrentPlaneState.autoPilotThrottleLocked;
        }
        IsActive_TOGALK() {
            return Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.TOGA;
        }
        static IsActive_SpeedCommon() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive) {
                if (!Airbus_FMA.CurrentPlaneState.anyAutoPilotsActive && !Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                    return true;
                }
                else {
                    if ((Column2.GetModeState_ALT() == MODE_STATE.ENGAGED) || Column2.IsActive_VS() || Column2.IsActive_FPA() || (Column2.GetModeState_GS() == MODE_STATE.ENGAGED) || VerticalAndLateral.IsActive_FinalApp()) {
                        if (Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.AUTO) {
                            return true;
                        }
                    }
                }
            }
            return false;
        }
        IsActive_SPEED() {
			if (!Airbus_FMA.CurrentPlaneState.autoPilotMachModeActive && Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive) {
				if (AltCaptured) {
					return true;
				}
				if (Simplane.getVerticalSpeed() < 100) {
					return true;
				}
			}
			return false;
        }
        IsActive_MACH() {
			if (Airbus_FMA.CurrentPlaneState.autoPilotMachModeActive && Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive && Airbus_FMA.CurrentPlaneState.anyAutoPilotsActive) {
				if (AltCaptured) {
					return true;
				}
				if (Simplane.getVerticalSpeed() < 100) {
					return true;
				}
			}
			return false;
        }
        IsActive_LVRASYM() {
            var leftCLOrMCTFLX = ((Airbus_FMA.CurrentPlaneState.leftThrottleDetent == ThrottleMode.CLIMB) || (Airbus_FMA.CurrentPlaneState.leftThrottleDetent == ThrottleMode.FLEX_MCT));
            var rightCLOrMCTFLX = ((Airbus_FMA.CurrentPlaneState.rightThrottleDetent == ThrottleMode.CLIMB) || (Airbus_FMA.CurrentPlaneState.rightThrottleDetent == ThrottleMode.FLEX_MCT));
            if ((leftCLOrMCTFLX || rightCLOrMCTFLX) && (leftCLOrMCTFLX != rightCLOrMCTFLX)) {
                return true;
            }
            return false;
        }
        IsActive_THRLK() {
            return false;
        }
        IsActive_LVRCLB() {
            if (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_TAKEOFF) {
                if (Airbus_FMA.CurrentPlaneState.highestThrottleDetent < ThrottleMode.CLIMB && Simplane.getIndicatedSpeed() > 30) {
                    return true;
                }
            }
            else if (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_CLIMB) {
                if (Airbus_FMA.CurrentPlaneState.highestThrottleDetent > ThrottleMode.CLIMB) {
                    if (Airbus_FMA.CurrentPlaneState.radioAltitude >= Simplane.getThrustReductionAltitude()) {
                        return true;
                    }
                }
            }
            else if (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_GOAROUND) {
                if (Airbus_FMA.CurrentPlaneState.highestThrottleDetent > ThrottleMode.CLIMB) {
                    if (Airbus_FMA.CurrentPlaneState.radioAltitude >= Simplane.getThrustReductionAltitude()) {
                        return true;
                    }
                }
                else if (Airbus_FMA.CurrentPlaneState.highestThrottleDetent < ThrottleMode.CLIMB) {
                    return true;
                }
            }
            return false;
        }
        IsActive_LVRMCT() {
            var takeoff = (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_TAKEOFF);
            var goaround = (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_GOAROUND);
            if (takeoff || goaround) {
                var greenDotSpeed = goaround ? Simplane.getFMCApprGreenDotSpeed() : Simplane.getFMCGreenDotSpeed();
                if (Airbus_FMA.CurrentPlaneState.highestThrottleDetent < ThrottleMode.FLEX_MCT) {
                    if (SimVar.GetSimVarValue("AIRSPEED TRUE", "Number") < greenDotSpeed) {
                        return true;
                    }
                }
            }
            return false;
        }
    }
    Column1.ROW_1_2_STATE = {
        NONE: 0,
        MANTOGA: 1,
        MANFLX: 2,
        MANMCT: 3,
        MANTHR: 4,
        THRMCT: 5,
        THRCLB: 6,
        THRLVR: 7,
        THRIDLE: 8,
        AFLOOR: 9,
        TOGALK: 10,
        SPEED: 11,
        MACH: 12,
        THRLK: 13,
        TOGA: 14,
    };
    Column1.ROW_3_STATE = {
        NONE: 0,
        LVRCLB: 1,
        LVRMCT: 2,
        LVRASYM: 3,
    };
    Airbus_FMA.Column1 = Column1;
    class Column2 extends Airbus_FMA.ColumnBase {
        createSubCellsOnRow1() { return true; }
        createSubCellsOnRow2() { return true; }
        getMainDivName() {
            return "Column2";
        }
        initChild() {
            this.currentRow1State = Column2.ROW_1_STATE.NONE;
            this.currentRow2State = Column2.ROW_2_STATE.NONE;
        }
        updateChild(_deltaTime) {
            var targetRow1State = Column2.ROW_1_STATE.NONE;
            var targetRow2State = Column2.ROW_2_STATE.NONE;
            if (!Airbus_FMA.VerticalAndLateral.IsActive_Any()) {
                targetRow1State = this.getTargetRow1State();
                targetRow2State = this.getTargetRow2State();
            }
            if ((targetRow1State != this.currentRow1State) || (targetRow1State == Column2.ROW_1_STATE.VS) || (targetRow1State == Column2.ROW_1_STATE.FPA)) {
                this.currentRow1State = targetRow1State;
				AltCaptured = false;
                switch (this.currentRow1State) {
                    case Column2.ROW_1_STATE.SRS_ARMED:
                        {
                            this.setRowText(0, "SRS", Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    case Column2.ROW_1_STATE.SRS_ENGAGED:
                        {
                            this.setRowText(0, "SRS", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column2.ROW_1_STATE.ALT_ENGAGED:
                        {
                            this.setRowText(0, "ALT", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column2.ROW_1_STATE.ALT_CAPTURED:
                        {
                            this.setRowText(0, "ALT*", Airbus_FMA.MODE_STATE.CAPTURED);
							AltCaptured = true;
                            break;
                        }
                    case Column2.ROW_1_STATE.ALT_CST_ENGAGED:
                        {
                            this.setRowText(0, "ALT CST", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column2.ROW_1_STATE.ALT_CST_CAPTURED:
                        {
                            this.setRowText(0, "ALT CST*", Airbus_FMA.MODE_STATE.CAPTURED);
                            break;
                        }
                    case Column2.ROW_1_STATE.VS:
                        {
                            var speed = Airbus_FMA.CurrentPlaneState.autoPilotVerticalSpeedHoldValue;
                            var str;
                            if (speed >= 0) {
                                str = "+" + speed.toFixed(0);
                            }
                            else {
                                str = speed.toFixed(0);
                            }
                            this.setRowMultiText(0, "V/S", Airbus_FMA.MODE_STATE.ENGAGED, str, Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    case Column2.ROW_1_STATE.FPA:
                        {
                            var value = -Airbus_FMA.CurrentPlaneState.autoPilotFlightPathAngle;
                            var sign = (value < 0) ? "-" : "+";
                            value = Math.min(Math.abs(value), 9.9);
                            var str = sign + value.toFixed(2) + String.fromCharCode(176);
                            this.setRowMultiText(0, "FPA", Airbus_FMA.MODE_STATE.ENGAGED, str, Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    case Column2.ROW_1_STATE.EXP_CLB:
                        {
                            this.setRowText(0, "EXP CLB", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column2.ROW_1_STATE.EXP_DES:
                        {
                            this.setRowText(0, "EXP DES", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column2.ROW_1_STATE.GS_ENGAGED:
                        {
                            this.setRowText(0, "G/S", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column2.ROW_1_STATE.GS_CAPTURED:
                        {
                            this.setRowText(0, "G/S*", Airbus_FMA.MODE_STATE.CAPTURED);
                            break;
                        }
                    case Column2.ROW_1_STATE.OP_CLB:
                        {
                            this.setRowText(0, "OP CLB", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column2.ROW_1_STATE.OP_DES:
                        {
                            this.setRowText(0, "OP DES", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column2.ROW_1_STATE.CLB_ENGAGED:
                        {
                            this.setRowText(0, "CLB", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column2.ROW_1_STATE.DES:
                        {
                            this.setRowText(0, "DES", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column2.ROW_1_STATE.ALT_CRZ:
                        {
                            this.setRowText(0, "ALT CRZ", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    default:
                        {
                            this.setRowText(0, "", Airbus_FMA.MODE_STATE.NONE);
                            break;
                        }
                }
            }
            if (targetRow2State != this.currentRow2State) {
                this.currentRow2State = targetRow2State;
                switch (this.currentRow2State) {
                    case Column2.ROW_2_STATE.ALT_ARMED:
                        {
                            this.setRowText(1, "ALT", Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    case Column2.ROW_2_STATE.ALT_CST_CONSTRAINED:
                        {
                            this.setRowText(1, "ALT CST", Airbus_FMA.MODE_STATE.CONSTRAINED);
                            break;
                        }
                    case Column2.ROW_2_STATE.GS_ARMED:
                        {
                            this.setRowText(1, "G/S", Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    case Column2.ROW_2_STATE.GS_FINAL_ARMED:
                        {
                            this.setRowText(1, "FINAL", Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    case Column2.ROW_2_STATE.CLB_ARMED:
                        {
                            this.setRowMultiText(1, "CLB", Airbus_FMA.MODE_STATE.ARMED, "", Airbus_FMA.MODE_STATE.ACTIVE);
                            break;
                        }
                    default:
                        {
                            this.setRowText(1, "", Airbus_FMA.MODE_STATE.NONE);
                            break;
                        }
                }
            }
        }
        getTargetRow1State() {
            var srsModeState = this.GetModeState_SRS();
            if (srsModeState == Airbus_FMA.MODE_STATE.ARMED) {
                return Column2.ROW_1_STATE.SRS_ARMED;
            }
            else if (srsModeState == Airbus_FMA.MODE_STATE.ENGAGED) {
                return Column2.ROW_1_STATE.SRS_ENGAGED;
            }
            var altModeState = Column2.GetModeState_ALT();
            if (altModeState == Airbus_FMA.MODE_STATE.ENGAGED) {
                if (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_CRUISE) {
                    return Column2.ROW_1_STATE.ALT_CRZ;
                }
                else {
                    return Column2.ROW_1_STATE.ALT_ENGAGED;
                }
            }
            else if (altModeState == Airbus_FMA.MODE_STATE.CAPTURED) {
                return Column2.ROW_1_STATE.ALT_CAPTURED;
            }
            var altCSTModeState = this.GetModeState_ALTCST();
            if (altCSTModeState == Airbus_FMA.MODE_STATE.ENGAGED) {
                return Column2.ROW_1_STATE.ALT_CST_ENGAGED;
            }
            else if (altCSTModeState == Airbus_FMA.MODE_STATE.CAPTURED) {
                return Column2.ROW_1_STATE.ALT_CST_CAPTURED;
                return Column2.ROW_1_STATE.ALT_CST_CAPTURED;
            }
            if (Column2.IsActive_VS()) {
                return Column2.ROW_1_STATE.VS;
            }
            else if (Column2.IsActive_FPA()) {
                return Column2.ROW_1_STATE.FPA;
            }
            else if (this.IsActive_EXPCLB()) {
                return Column2.ROW_1_STATE.EXP_CLB;
            }
            else if (this.IsActive_EXPDES()) {
                return Column2.ROW_1_STATE.EXP_DES;
            }
            var gsModeState = Column2.GetModeState_GS();
            if (gsModeState == Airbus_FMA.MODE_STATE.ENGAGED) {
                return Column2.ROW_1_STATE.GS_ENGAGED;
            }
            else if (gsModeState == Airbus_FMA.MODE_STATE.CAPTURED) {
                return Column2.ROW_1_STATE.GS_CAPTURED;
            }
            if (this.IsActive_OPCLB()) {
                return Column2.ROW_1_STATE.OP_CLB;
            }
            else if (this.IsActive_OPDES()) {
                return Column2.ROW_1_STATE.OP_DES;
            }
            else if (this.GetModeState_CLB() == Airbus_FMA.MODE_STATE.ENGAGED) {
                return Column2.ROW_1_STATE.CLB_ENGAGED;
            }
            else if (this.IsActive_DES()) {
                return Column2.ROW_1_STATE.DES;
            }
            else {
                return Column2.ROW_1_STATE.NONE;
            }
        }
        getTargetRow2State() {
            if (Column2.GetModeState_ALT() == Airbus_FMA.MODE_STATE.ARMED) {
                return Column2.ROW_2_STATE.ALT_ARMED;
            }
            else if (this.GetModeState_ALTCST() == Airbus_FMA.MODE_STATE.CONSTRAINED) {
                return Column2.ROW_2_STATE.ALT_CST_CONSTRAINED;
            }
            else if (Column2.GetModeState_GS() == Airbus_FMA.MODE_STATE.ARMED) {
                return Column2.ROW_2_STATE.GS_ARMED;
            }
            else if (this.IsActive_FinalArmed()) {
                return Column2.ROW_2_STATE.GS_FINAL_ARMED;
            }
            else if (this.GetModeState_CLB() == Airbus_FMA.MODE_STATE.ARMED) {
                return Column2.ROW_2_STATE.CLB_ARMED;
            }
            else {
                return Column2.ROW_2_STATE.NONE;
            }
        }
        GetModeState_SRS() {
            if (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_TAKEOFF && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                if (Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.TOGA) {
                    return Airbus_FMA.MODE_STATE.ENGAGED;
                }
                else if ((Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.FLEX_MCT) && (Airbus_FMA.CurrentPlaneState.flexTemperature > 0)) {
                    return Airbus_FMA.MODE_STATE.ENGAGED;
                }
                else if ((SimVar.GetSimVarValue("L:AIRLINER_V2_SPEED", "Number") > 0) && (Airbus_FMA.CurrentPlaneState.flapsHandlePercent != 0)) {
                    return Airbus_FMA.MODE_STATE.ARMED;
                }
            }
            else if (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_GOAROUND) {
                if ((Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.TOGA) &&
                    (Airbus_FMA.CurrentPlaneState.flapsHandlePercent != 0)) {
                    return Airbus_FMA.MODE_STATE.ENGAGED;
                }
            }
            return Airbus_FMA.MODE_STATE.NONE;
        }
        static GetModeState_ALT() {
            if (Airbus_FMA.CurrentPlaneState.anyAutoPilotsActive && Airbus_FMA.CurrentPlaneState.autoPilotAltitudeLockActive && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                if (Airbus_FMA.CurrentPlaneState.autoPilotAltitudeArmed) {
                    return Airbus_FMA.MODE_STATE.ARMED;
                }
                else {
                    var diffAlt = Math.abs(Airbus_FMA.CurrentPlaneState.autoPilotAltitudeLockValue - Airbus_FMA.CurrentPlaneState.altitude);
                    if (diffAlt <= Airbus_FMA.Definitions.ALT_ENGAGED_RANGE) {
                        this._lastALTMode = Airbus_FMA.MODE_STATE.ENGAGED;
                    }
                    else {
                        if (this._lastALTMode == Airbus_FMA.MODE_STATE.ENGAGED) {
                            if ((diffAlt - Airbus_FMA.Definitions.ALT_ENGAGED_RANGE) > 50) {
                                this._lastALTMode = Airbus_FMA.MODE_STATE.CAPTURED;
                            }
                        }
                        else {
                            this._lastALTMode = Airbus_FMA.MODE_STATE.CAPTURED;
                        }
                    }
                    return this._lastALTMode;
                }
            }
            return Airbus_FMA.MODE_STATE.NONE;
        }
        GetModeState_ALTCST() {
            return Airbus_FMA.MODE_STATE.NONE;
        }
        static IsActive_VS() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotVerticalSpeedHoldActive && !Airbus_FMA.CurrentPlaneState.autoPilotTRKFPAModeActive && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                return true;
            }
            else {
                return false;
            }
        }
        static IsActive_FPA() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotVerticalSpeedHoldActive && Airbus_FMA.CurrentPlaneState.autoPilotTRKFPAModeActive && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                return true;
            }
            else {
                return false;
            }
        }
        IsActive_EXPCLB() {
            return false;
        }
        IsActive_EXPDES() {
            return false;
        }
        static GetModeState_GS() {
            if (Simplane.getAutoPilotAPPRHold() && Simplane.getAutoPilotGlideslopeHold() && Simplane.getAutoPilotApproachType() == 4) {
                if (Simplane.getAutoPilotGlideslopeActive() && Simplane.getAutoPilotAPPRActive()) {
                    return Airbus_FMA.MODE_STATE.ENGAGED;
                }
                else {
                    return Airbus_FMA.MODE_STATE.ARMED;
                }
            }
            return Airbus_FMA.MODE_STATE.NONE;
        }
        IsActive_OPCLB() {
            if (Simplane.getAutoPilotAltitudeSelected() && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                if (Simplane.getVerticalSpeed() > 100) {
                    return true;
                }
            }
        }
        IsActive_OPDES() {
            if (Simplane.getAutoPilotAltitudeSelected() && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                if (Simplane.getVerticalSpeed() < -100) {
                    return true;
                }
            }
        }
        GetModeState_CLB() {
            if ((Airbus_FMA.CurrentPlaneState.autoPilotAltitudeLockActive && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive || Simplane.getAutoPilotFLCActive() && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) && (Airbus_FMA.CurrentPlaneState.altitude < Airbus_FMA.CurrentPlaneState.autoPilotAltitudeLockValue) && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                if (Airbus_FMA.CurrentPlaneState.flightPhase < FlightPhase.FLIGHT_PHASE_CLIMB) {
                    return Airbus_FMA.MODE_STATE.ARMED;
                }
                else if (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_CLIMB) {
                    return Airbus_FMA.MODE_STATE.ENGAGED;
                }
            }
            if (Simplane.getAutoPilotFLCActive()) {
                let targetAltitude = Simplane.getAutoPilotAltitudeLockValue("feets");
                let altitude = Simplane.getAltitude();
                if (altitude < targetAltitude - 100) {
                    return Airbus_FMA.MODE_STATE.ENGAGED;
                }
            }
            return Airbus_FMA.MODE_STATE.NONE;
        }
        IsActive_DES() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotAltitudeLockActive && (Airbus_FMA.CurrentPlaneState.altitude > Airbus_FMA.CurrentPlaneState.autoPilotAltitudeLockValue) && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                if (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_DESCENT) {
                    return true;
                }
            }
            if (Simplane.getAutoPilotFLCActive() && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                let targetAltitude = Simplane.getAutoPilotAltitudeLockValue("feets");
                let altitude = Simplane.getAltitude();
                if (altitude > targetAltitude + 100) {
                    return true;
                }
            }
            return false;
        }
        IsActive_FinalArmed() {
            if (Simplane.getAutoPilotAPPRHold() && Simplane.getAutoPilotGlideslopeHold() && Simplane.getAutoPilotApproachType() == 10) {
                if (!Simplane.getAutoPilotGlideslopeActive() || !Simplane.getAutoPilotAPPRActive()) {
                    return true;
                }
            }
            return false;
        }
    }
    Column2.ROW_1_STATE = {
        NONE: 0,
        SRS_ARMED: 1,
        SRS_ENGAGED: 2,
        ALT_ENGAGED: 3,
        ALT_CAPTURED: 4,
        ALT_CST_ENGAGED: 5,
        ALT_CST_CAPTURED: 6,
        VS: 7,
        FPA: 8,
        EXP_CLB: 9,
        EXP_DES: 10,
        GS_ENGAGED: 11,
        GS_CAPTURED: 12,
        OP_CLB: 13,
        OP_DES: 14,
        CLB_ENGAGED: 15,
        DES: 16,
        ALT_CRZ: 17,
    };
    Column2.ROW_2_STATE = {
        NONE: 0,
        ALT_ARMED: 1,
        ALT_CST_CONSTRAINED: 2,
        GS_ARMED: 3,
        GS_FINAL_ARMED: 4,
        CLB_ARMED: 5
    };
    Column2._lastALTMode = undefined;
    Airbus_FMA.Column2 = Column2;
    class Column3 extends Airbus_FMA.ColumnBase {
        constructor() {
            super(...arguments);
            this.rwytrkDisabled = false;
        }
        getMainDivName() {
            return "Column3";
        }
        initChild() {
            this.currentRow1State = Column3.ROW_1_STATE.NONE;
            this.currentRow2State = Column3.ROW_2_STATE.NONE;
        }
        updateChild(_deltaTime) {
            var targetRow1State = Column3.ROW_1_STATE.NONE;
            var targetRow2State = Column3.ROW_2_STATE.NONE;
            if (!Airbus_FMA.VerticalAndLateral.IsActive_Any()) {
                targetRow1State = this.getTargetRow1State();
                targetRow2State = this.getTargetRow2State();
            }
            if (targetRow1State != this.currentRow1State) {
                if (this.currentRow1State == Column3.ROW_1_STATE.RWY_TRK) {
                    this.rwytrkDisabled = true;
                }
                this.currentRow1State = targetRow1State;
                switch (this.currentRow1State) {
                    case Column3.ROW_1_STATE.RWY:
                        {
                            this.setRowText(0, "RWY", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column3.ROW_1_STATE.HDG:
                        {
                            this.setRowText(0, "HDG", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column3.ROW_1_STATE.TRACK:
                        {
                            this.setRowText(0, "TRACK", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column3.ROW_1_STATE.LOC_ENGAGED:
                        {
                            this.setRowText(0, "LOC", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column3.ROW_1_STATE.LOC_CAPTURED:
                        {
                            this.setRowText(0, "LOC*", Airbus_FMA.MODE_STATE.CAPTURED);
                            break;
                        }
                    case Column3.ROW_1_STATE.NAV_ENGAGED:
                        {
                            this.setRowText(0, "NAV", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column3.ROW_1_STATE.NAV_CAPTURED:
                        {
                            this.setRowText(0, "NAV", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column3.ROW_1_STATE.RWY_TRK:
                        {
                            this.setRowText(0, "RWY TRK", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column3.ROW_1_STATE.GA_TRK:
                        {
                            this.setRowText(0, "GA TRK", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    case Column3.ROW_1_STATE.APPNAV_ENGAGED:
                        {
                            this.setRowText(0, "APP NAV", Airbus_FMA.MODE_STATE.ENGAGED);
                            break;
                        }
                    default:
                        {
                            this.setRowText(0, "", Airbus_FMA.MODE_STATE.NONE);
                            break;
                        }
                }
            }
            if (targetRow2State != this.currentRow2State) {
                this.currentRow2State = targetRow2State;
                switch (this.currentRow2State) {
                    case Column3.ROW_2_STATE.LOC_ARMED:
                        {
                            this.setRowText(1, "LOC", Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    case Column3.ROW_2_STATE.NAV_ARMED:
                        {
                            this.setRowText(1, "NAV", Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    case Column3.ROW_2_STATE.APPNAV_ARMED:
                        {
                            this.setRowText(1, "APP NAV", Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    default:
                        {
                            this.setRowText(1, "", Airbus_FMA.MODE_STATE.NONE);
                            break;
                        }
                }
            }
        }
        getTargetRow1State() {
            if (this.IsActive_RWY()) {
                return Column3.ROW_1_STATE.RWY;
            }
            else if (this.IsActive_HDG()) {
                return Column3.ROW_1_STATE.HDG;
            }
            else if (this.IsActive_TRACK()) {
                return Column3.ROW_1_STATE.TRACK;
            }
            var locModeState = this.GetModeState_LOC();
            if (locModeState == Airbus_FMA.MODE_STATE.ENGAGED) {
                return Column3.ROW_1_STATE.LOC_ENGAGED;
            }
            else if (locModeState == Airbus_FMA.MODE_STATE.CAPTURED) {
                return Column3.ROW_1_STATE.LOC_CAPTURED;
            }
            if (this.GetModeState_APPNAV() == Airbus_FMA.MODE_STATE.ENGAGED) {
                return Column3.ROW_1_STATE.APPNAV_ENGAGED;
            }
            var navModeState = this.GetModeState_NAV();
            if (navModeState == Airbus_FMA.MODE_STATE.ENGAGED) {
                return Column3.ROW_1_STATE.NAV_ENGAGED;
            }
            else if (navModeState == Airbus_FMA.MODE_STATE.CAPTURED) {
                return Column3.ROW_1_STATE.NAV_CAPTURED;
            }
            if (this.IsActive_RWYTRK()) {
                return Column3.ROW_1_STATE.RWY_TRK;
            }
            else if (this.IsActive_GATRK()) {
                return Column3.ROW_1_STATE.GA_TRK;
            }
            return Column3.ROW_1_STATE.NONE;
        }
        getTargetRow2State() {
            if (this.GetModeState_LOC() == Airbus_FMA.MODE_STATE.ARMED) {
                return Column3.ROW_2_STATE.LOC_ARMED;
            }
            else if (this.GetModeState_APPNAV() == Airbus_FMA.MODE_STATE.ARMED) {
                return Column3.ROW_2_STATE.APPNAV_ARMED;
            }
            else if (this.GetModeState_NAV() == Airbus_FMA.MODE_STATE.ARMED) {
                return Column3.ROW_2_STATE.NAV_ARMED;
            }
            else {
                return Column3.ROW_2_STATE.NONE;
            }
        }
        IsActive_RWY() {
            if (Airbus_FMA.CurrentPlaneState.flightPhase <= FlightPhase.FLIGHT_PHASE_CLIMB && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                if (Airbus_FMA.CurrentPlaneState.highestThrottleDetent >= ThrottleMode.FLEX_MCT) {
                    if (Airbus_FMA.CurrentPlaneState.radioAltitude < 30) {
                        return true;
                    }
                }
            }
            return false;
        }
        IsActive_HDG() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotHeadingSelectedMode && !Airbus_FMA.CurrentPlaneState.autoPilotTRKFPAModeActive && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                return true;
            }
            else {
                return false;
            }
        }
        IsActive_TRACK() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotHeadingSelectedMode && Airbus_FMA.CurrentPlaneState.autoPilotTRKFPAModeActive && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                return true;
            }
            else {
                return false;
            }
        }
        GetModeState_LOC() {
			if (Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
				if (Simplane.getAutoPilotAPPRActive()) {
					return Airbus_FMA.MODE_STATE.ENGAGED;
				}
				else if (Simplane.getAutoPilotAPPRArm()) {
					return Airbus_FMA.MODE_STATE.ARMED;
				}
			}
            return Airbus_FMA.MODE_STATE.NONE;
        }
        GetModeState_NAV() {
            if (Airbus_FMA.CurrentPlaneState.autoPilotHeadingManagedMode && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                if ((Airbus_FMA.CurrentPlaneState.radioAltitude >= 30) && Airbus_FMA.CurrentPlaneState.anyAutoPilotsActive) {
                    return Airbus_FMA.MODE_STATE.ENGAGED;
                }
                else {
                    return Airbus_FMA.MODE_STATE.ARMED;
                }
            }
            return Airbus_FMA.MODE_STATE.NONE;
        }
        IsActive_RWYTRK() {
            if (!this.rwytrkDisabled) {
                if (Airbus_FMA.CurrentPlaneState.flightPhase <= FlightPhase.FLIGHT_PHASE_CLIMB && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                    if (Airbus_FMA.CurrentPlaneState.highestThrottleDetent >= ThrottleMode.FLEX_MCT) {
                        if (!Airbus_FMA.CurrentPlaneState.autoPilotHeadingManagedMode) {
                            if (Airbus_FMA.CurrentPlaneState.radioAltitude >= 30) {
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        }
        IsActive_GATRK() {
            if (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_GOAROUND) {
                if ((Airbus_FMA.CurrentPlaneState.highestThrottleDetent == ThrottleMode.TOGA) && (Airbus_FMA.CurrentPlaneState.flapsHandlePercent != 0)) {
                    return true;
                }
            }
            return false;
        }
        GetModeState_APPNAV() {
            if (Simplane.getAutoPilotAPPRHold() && Simplane.getAutoPilotGlideslopeHold() && Simplane.getAutoPilotApproachType() != 4) {
                if (Simplane.getAutoPilotAPPRActive()) {
                    return Airbus_FMA.MODE_STATE.ENGAGED;
                }
                else if (Simplane.getAutoPilotAPPRArm()) {
                    return Airbus_FMA.MODE_STATE.ARMED;
                }
            }
            return Airbus_FMA.MODE_STATE.NONE;
        }
    }
    Column3.ROW_1_STATE = {
        NONE: 0,
        RWY: 1,
        HDG: 2,
        TRACK: 3,
        LOC_ENGAGED: 4,
        LOC_CAPTURED: 5,
        NAV_ENGAGED: 6,
        NAV_CAPTURED: 7,
        RWY_TRK: 8,
        GA_TRK: 9,
        APPNAV_ENGAGED: 10
    };
    Column3.ROW_2_STATE = {
        NONE: 0,
        LOC_ARMED: 1,
        NAV_ARMED: 2,
        APPNAV_ARMED: 3
    };
    Airbus_FMA.Column3 = Column3;
    class Column4 extends Airbus_FMA.ColumnBase {
        createSubCellsOnRow3() { return true; }
        getMainDivName() {
            return "Column4";
        }
        initChild() {
            this.currentRow1State = Column4.ROW_1_STATE.NONE;
            this.currentRow2State = Column4.ROW_2_STATE.NONE;
            this.currentRow3State = Column4.ROW_3_STATE.NONE;
        }
        updateChild(_deltaTime) {
            this.updateRow1(_deltaTime);
            this.updateRow2(_deltaTime);
            this.updateRow3(_deltaTime);
        }
        updateRow1(_deltaTime) {
            var targetState = Column4.ROW_1_STATE.NONE;
            if (Airbus_FMA.CurrentPlaneState.autoPilotAPPRActive) {
                if (Airbus_FMA.CurrentPlaneState.autoPilotActive && Airbus_FMA.CurrentPlaneState.isILSApproachActive) {
                    targetState = Column4.ROW_1_STATE.CAT_3;
                }
                else if (!Airbus_FMA.CurrentPlaneState.autoPilotActive && Airbus_FMA.CurrentPlaneState.isILSApproachActive) {
                    targetState = Column4.ROW_1_STATE.CAT_1;
                }
            }
            if (targetState != this.currentRow1State) {
                this.currentRow1State = targetState;
                switch (targetState) {
                    case Column4.ROW_1_STATE.CAT_1:
                        {
                            this.setRowText(0, "CAT 1", Airbus_FMA.MODE_STATE.STATUS);
                            break;
                        }
                    case Column4.ROW_1_STATE.CAT_2:
                        {
                            this.setRowText(0, "CAT 2", Airbus_FMA.MODE_STATE.STATUS);
                            break;
                        }
                    case Column4.ROW_1_STATE.CAT_3:
                        {
                            this.setRowText(0, "CAT 3", Airbus_FMA.MODE_STATE.STATUS);
                            break;
                        }
                    default:
                        {
                            this.setRowText(0, "", Airbus_FMA.MODE_STATE.NONE);
                            break;
                        }
                }
            }
        }
        updateRow2(_deltaTime) {
            var targetState = Column4.ROW_2_STATE.NONE;
            if (Airbus_FMA.CurrentPlaneState.autoPilotAPPRActive && (Airbus_FMA.CurrentPlaneState.isILSApproachActive || Airbus_FMA.CurrentPlaneState.isNonILSApproachActive) && Airbus_FMA.CurrentPlaneState.anyAutoPilotsActive) {
                if (Airbus_FMA.CurrentPlaneState.bothAutoPilotsActive) {
                    targetState = Column4.ROW_2_STATE.DUAL;
                }
                else {
                    targetState = Column4.ROW_2_STATE.SINGLE;
                }
            }
            if (targetState != this.currentRow2State) {
                this.currentRow2State = targetState;
                switch (targetState) {
                    case Column4.ROW_2_STATE.SINGLE:
                        {
                            this.setRowText(1, "SINGLE", Airbus_FMA.MODE_STATE.STATUS);
                            break;
                        }
                    case Column4.ROW_2_STATE.DUAL:
                        {
                            this.setRowText(1, "DUAL", Airbus_FMA.MODE_STATE.STATUS);
                            break;
                        }
                    default:
                        {
                            this.setRowText(1, "", Airbus_FMA.MODE_STATE.NONE);
                            break;
                        }
                }
            }
        }
        updateRow3(_deltaTime) {
            var targetState = Column4.ROW_3_STATE.NONE;
            if ((Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_DESCENT) || (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_APPROACH)) {
                if (Airbus_FMA.CurrentPlaneState.minimumDescentAltitude > 0) {
                    targetState = Column4.ROW_3_STATE.MDA;
                }
                else if (Airbus_FMA.CurrentPlaneState.decisionHeight > 0) {
                    targetState = Column4.ROW_3_STATE.DH;
                }
                else {
                    targetState = Column4.ROW_3_STATE.NO_DH;
                }
            }
            if ((targetState != this.currentRow3State) || (targetState == Column4.ROW_3_STATE.DH) || (targetState == Column4.ROW_3_STATE.MDA)) {
                this.currentRow3State = targetState;
                switch (targetState) {
                    case Column4.ROW_3_STATE.DH:
                        {
                            var value = Airbus_FMA.CurrentPlaneState.decisionHeight;
                            this.setRowMultiText(2, "DH", Airbus_FMA.MODE_STATE.STATUS, value.toFixed(0), Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    case Column4.ROW_3_STATE.NO_DH:
                        {
                            this.setRowText(2, "NO DH", Airbus_FMA.MODE_STATE.STATUS);
                            break;
                        }
                    case Column4.ROW_3_STATE.MDA:
                        {
                            var value = Airbus_FMA.CurrentPlaneState.minimumDescentAltitude;
                            this.setRowMultiText(2, "MDA", Airbus_FMA.MODE_STATE.STATUS, value.toFixed(0), Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    default:
                        {
                            this.setRowText(2, "", Airbus_FMA.MODE_STATE.NONE);
                            break;
                        }
                }
            }
        }
    }
    Column4.ROW_1_STATE = {
        NONE: 0,
        CAT_1: 1,
        CAT_2: 2,
        CAT_3: 3
    };
    Column4.ROW_2_STATE = {
        NONE: 0,
        SINGLE: 1,
        DUAL: 2
    };
    Column4.ROW_3_STATE = {
        NONE: 0,
        DH: 1,
        NO_DH: 2,
        MDA: 3
    };
    Airbus_FMA.Column4 = Column4;
    class Column5 extends Airbus_FMA.ColumnBase {
        getMainDivName() {
            return "Column5";
        }
        initChild() {
            this.currentRow1State = Column5.ROW_1_STATE.NONE;
            this.currentRow2State = Column5.ROW_2_STATE.NONE;
            this.currentRow3State = Column5.ROW_3_STATE.NONE;
        }
        updateChild(_deltaTime) {
            this.refreshAutoPilotDisplay();
            this.refreshFlightDirectorDisplay();
            this.refreshAutoThrottleDisplay();
        }
        refreshAutoPilotDisplay() {
            var targetState = Column5.ROW_1_STATE.NONE;
            if (Airbus_FMA.CurrentPlaneState.bothAutoPilotsActive) {
                targetState = Column5.ROW_1_STATE.AP_BOTH;
            }
            else if (Airbus_FMA.CurrentPlaneState.autoPilotActive[0]) {
                targetState = Column5.ROW_1_STATE.AP_1;
            }
            else if (Airbus_FMA.CurrentPlaneState.autoPilotActive[1]) {
                targetState = Column5.ROW_1_STATE.AP_2;
            }
            if (targetState != this.currentRow1State) {
                this.currentRow1State = targetState;
                switch (targetState) {
                    case Column5.ROW_1_STATE.AP_1:
                        {
                            this.setRowText(0, "AP1", Airbus_FMA.MODE_STATE.ACTIVE);
                            break;
                        }
                    case Column5.ROW_1_STATE.AP_2:
                        {
                            this.setRowText(0, "AP2", Airbus_FMA.MODE_STATE.ACTIVE);
                            break;
                        }
                    case Column5.ROW_1_STATE.AP_BOTH:
                        {
                            this.setRowText(0, "AP1+2", Airbus_FMA.MODE_STATE.ACTIVE);
                            break;
                        }
                    default:
                        {
                            this.setRowText(0, "", Airbus_FMA.MODE_STATE.NONE);
                            break;
                        }
                }
            }
        }
        refreshFlightDirectorDisplay() {
            var targetState = Column5.ROW_2_STATE.NONE;
            if (Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
                targetState = Column5.ROW_2_STATE.FD_BOTH;
            }
            if (targetState != this.currentRow2State) {
                this.currentRow2State = targetState;
                switch (targetState) {
                    case Column5.ROW_2_STATE.FD_1:
                        {
                            this.setRowText(1, "1FD-", Airbus_FMA.MODE_STATE.ACTIVE);
                            break;
                        }
                    case Column5.ROW_2_STATE.FD_2:
                        {
                            this.setRowText(1, "-FD2", Airbus_FMA.MODE_STATE.ACTIVE);
                            break;
                        }
                    case Column5.ROW_2_STATE.FD_BOTH:
                        {
                            this.setRowText(1, "1FD2", Airbus_FMA.MODE_STATE.ACTIVE);
                            break;
                        }
                    default:
                        {
                            this.setRowText(1, "", Airbus_FMA.MODE_STATE.NONE);
                            break;
                        }
                }
            }
        }
        refreshAutoThrottleDisplay() {
            var targetState = Column5.ROW_3_STATE.NONE;
            if (Airbus_FMA.CurrentPlaneState.autoPilotThrottleActive) {
                targetState = Column5.ROW_3_STATE.ATHR_ACTIVE;
            }
            else if (Airbus_FMA.CurrentPlaneState.autoPilotThrottleArmed) {
                targetState = Column5.ROW_3_STATE.ATHR_ARMED;
            }
            if (targetState != this.currentRow3State) {
                this.currentRow3State = targetState;
                switch (targetState) {
                    case Column5.ROW_3_STATE.ATHR_ARMED:
                        {
                            this.setRowText(2, "A/THR", Airbus_FMA.MODE_STATE.ARMED);
                            break;
                        }
                    case Column5.ROW_3_STATE.ATHR_ACTIVE:
                        {
                            this.setRowText(2, "A/THR", Airbus_FMA.MODE_STATE.ACTIVE);
                            break;
                        }
                    default:
                        {
                            this.setRowText(2, "", Airbus_FMA.MODE_STATE.NONE);
                            break;
                        }
                }
            }
        }
    }
    Column5.ROW_1_STATE = {
        NONE: 0,
        AP_1: 1,
        AP_2: 2,
        AP_BOTH: 3
    };
    Column5.ROW_2_STATE = {
        NONE: 0,
        FD_1: 1,
        FD_2: 2,
        FD_BOTH: 3
    };
    Column5.ROW_3_STATE = {
        NONE: 0,
        ATHR_ARMED: 1,
        ATHR_ACTIVE: 2
    };
    Airbus_FMA.Column5 = Column5;
    let SPECIAL_MESSAGE;
    (function (SPECIAL_MESSAGE) {
        SPECIAL_MESSAGE[SPECIAL_MESSAGE["NONE"] = 0] = "NONE";
        SPECIAL_MESSAGE[SPECIAL_MESSAGE["MACH_SEL"] = 1] = "MACH_SEL";
        SPECIAL_MESSAGE[SPECIAL_MESSAGE["SPEED_SEL"] = 2] = "SPEED_SEL";
    })(SPECIAL_MESSAGE = Airbus_FMA.SPECIAL_MESSAGE || (Airbus_FMA.SPECIAL_MESSAGE = {}));
    class VerticalAndLateral {
        constructor(_parent) {
            this.rolloutDelay = 0;
            this.parent = _parent;
            this.divMain = window.document.createElement("div");
            this.divMain.id = "VerticalAndLateral";
            _parent.appendChild(this.divMain);
            this.msg = new Airbus_FMA.Cell(this.divMain, "Msg");
        }
        init() {
            if (this.msg != null) {
                this.msg.init();
                this.msg.setText("", Airbus_FMA.MODE_STATE.NONE);
                this.msg.setVisibility(false);
                Airbus_FMA.VerticalAndLateral.isActive = false;
            }
            this.currentState = VerticalAndLateral.STATE.NONE;
        }
        update(_deltaTime) {
            var targetState = VerticalAndLateral.STATE.NONE;
            if (this.msg != null) {
                if (Airbus_FMA.VerticalAndLateral.IsActive_FinalApp()) {
                    targetState = VerticalAndLateral.STATE.FINAL_APP;
                }
                else if (Airbus_FMA.CurrentPlaneState.isILSApproachActive) {
                    if (Airbus_FMA.CurrentPlaneState.radioAltitude <= 1.5) {
                        this.rolloutDelay += _deltaTime;
                        if (this.rolloutDelay >= 1000) {
                            targetState = VerticalAndLateral.STATE.ROLLOUT;
                        }
                        else {
                            targetState = VerticalAndLateral.STATE.FLARE;
                        }
                    }
                    else if (Airbus_FMA.CurrentPlaneState.radioAltitude < 40) {
                        this.rolloutDelay = 0;
                        targetState = VerticalAndLateral.STATE.FLARE;
                    }
                    else if (Airbus_FMA.CurrentPlaneState.radioAltitude < 400 ||
                        (this._previousState === VerticalAndLateral.STATE.LAND && Airbus_FMA.CurrentPlaneState.radioAltitude < 400 * 1.1)) {
                        targetState = VerticalAndLateral.STATE.LAND;
                    }
                }
                if (targetState != this.currentState) {
                    if (this.currentState == VerticalAndLateral.STATE.ROLLOUT) {
                        this.rolloutDelay = 0;
                    }
                    this.currentState = targetState;
                    var str = "";
                    switch (targetState) {
                        case VerticalAndLateral.STATE.FINAL_APP:
                            {
                                str = "FINAL APP";
                                break;
                            }
                        case VerticalAndLateral.STATE.LAND:
                            {
                                str = "LAND";
                                break;
                            }
                        case VerticalAndLateral.STATE.FLARE:
                            {
                                str = "FLARE";
                                break;
                            }
                        case VerticalAndLateral.STATE.ROLLOUT:
                            {
                                str = "ROLLOUT";
                                break;
                            }
                    }
					if (!Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive) {
						str = "";
					}
                    if (str.length > 0) {
                        this.msg.setText(str, Airbus_FMA.MODE_STATE.ENGAGED);
                        this.msg.setVisibility(true);
                        Airbus_FMA.VerticalAndLateral.isActive = true;
                    }
                    else {
                        this.msg.setText("", Airbus_FMA.MODE_STATE.NONE);
                        this.msg.setVisibility(false);
                        Airbus_FMA.VerticalAndLateral.isActive = false;
                    }
                }
            }
            this._previousState = this.currentState;
        }
        static IsActive_FinalApp() {
            return Simplane.getAutoPilotGlideslopeActive() && Simplane.getAutoPilotAPPRActive() && Simplane.getAutoPilotApproachType() == 10 && Airbus_FMA.CurrentPlaneState.anyFlightDirectorsActive;
        }
        static IsActive_Any() {
            return Airbus_FMA.VerticalAndLateral.isActive;
        }
    }
    VerticalAndLateral.STATE = {
        NONE: 0,
        FINAL_APP: 1,
        LAND: 2,
        FLARE: 3,
        ROLLOUT: 4
    };
    Airbus_FMA.VerticalAndLateral = VerticalAndLateral;
    class SpecialMessages {
        constructor(_parent) {
            this.parent = _parent;
            this.divMain = window.document.createElement("div");
            this.divMain.id = "SpecialMessages";
            _parent.appendChild(this.divMain);
            this.msg1 = new Airbus_FMA.Cell(this.divMain, "Msg1");
            this.msg2 = new Airbus_FMA.Cell(this.divMain, "Msg2");
            this.currentMessage = Airbus_FMA.SPECIAL_MESSAGE.NONE;
        }
        init() {
            if (this.msg1 != null) {
                this.msg1.init();
                this.msg1.setText("", Airbus_FMA.MODE_STATE.NONE);
                this.msg1.setVisibility(false);
            }
            if (this.msg2 != null) {
                this.msg2.init();
                this.msg2.setText("", Airbus_FMA.MODE_STATE.NONE);
                this.msg2.setVisibility(false);
            }
        }
        update(_deltaTime) {
            if ((this.msg1 != null) && (this.msg2 != null)) {
                var requiredMessage = this.getCurrentRequiredMessage();
                if ((requiredMessage != this.currentMessage) || (requiredMessage == Airbus_FMA.SPECIAL_MESSAGE.MACH_SEL) || (requiredMessage == Airbus_FMA.SPECIAL_MESSAGE.SPEED_SEL)) {
                    this.currentMessage = requiredMessage;
                    var useMsgID = 0;
                    switch (this.currentMessage) {
                        case Airbus_FMA.SPECIAL_MESSAGE.MACH_SEL:
                            {
                                useMsgID = 1;
                                var value = Airbus_FMA.CurrentPlaneState.managedAirspeed * 0.0015130718954118;
                                this.msg1.setText("MACH SEL: " + value.toFixed(2), Airbus_FMA.MODE_STATE.ARMED);
                                break;
                            }
                        case Airbus_FMA.SPECIAL_MESSAGE.SPEED_SEL:
                            {
                                useMsgID = 1;
                                var value = Airbus_FMA.CurrentPlaneState.managedAirspeed;
                                this.msg1.setText("SPEED SEL: " + value.toFixed(0), Airbus_FMA.MODE_STATE.ARMED);
                                break;
                            }
                    }
                    if (useMsgID == 1) {
                        this.msg1.setVisibility(true);
                    }
                    else {
                        this.msg1.setVisibility(false);
                        this.msg1.setText("", Airbus_FMA.MODE_STATE.NONE);
                    }
                    if (useMsgID == 2) {
                        this.msg2.setVisibility(true);
                    }
                    else {
                        this.msg2.setVisibility(false);
                        this.msg2.setText("", Airbus_FMA.MODE_STATE.NONE);
                    }
                }
            }
        }
        getCurrentRequiredMessage() {
            if (!Column1.IsActive_SpeedCommon() && (Airbus_FMA.CurrentPlaneState.managedAirspeed > 0) && ((Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_TAKEOFF) || (Airbus_FMA.CurrentPlaneState.flightPhase == FlightPhase.FLIGHT_PHASE_CLIMB))) {
                if (Airbus_FMA.CurrentPlaneState.autoPilotMachModeActive) {
                    return Airbus_FMA.SPECIAL_MESSAGE.MACH_SEL;
                }
                else {
                    return Airbus_FMA.SPECIAL_MESSAGE.SPEED_SEL;
                }
            }
            return Airbus_FMA.SPECIAL_MESSAGE.NONE;
        }
    }
    Airbus_FMA.SpecialMessages = SpecialMessages;
})(Airbus_FMA || (Airbus_FMA = {}));
customElements.define("airbus-fma", Airbus.FMA);
//# sourceMappingURL=Airbus_FMA.js.map