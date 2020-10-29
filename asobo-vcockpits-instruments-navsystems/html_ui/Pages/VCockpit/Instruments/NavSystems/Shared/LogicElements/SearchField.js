class SearchFieldWaypointICAO {
    constructor(_instrument, _elements, _container, _wpType = 'A') {
        this.wpType = 'A';
        this.isActive = false;
        this.lastIdent = "";
        this.lastIcao = "";
        this.instrument = _instrument;
        this.elements = _elements;
        this.container = _container;
        this.wayPoint = new WayPoint(_instrument);
        this.wayPoint.type = null;
        this.wpType = _wpType;
        this.batch = new SimVar.SimVarBatch("C:fs9gps:IcaoSearchMatchedIcaosNumber", "C:fs9gps:IcaoSearchMatchedIcao");
        this.batch.add("C:fs9gps:IcaoSearchCurrentIcaoType", "string", "string");
        this.batch.add("C:fs9gps:IcaoSearchCurrentIcao", "string", "string");
        this.batch.add("C:fs9gps:IcaoSearchCurrentIdent", "string", "string");
    }
    getUpdatedInfos() {
        if (this.isActive) {
            const icao = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.instrument.instrumentIdentifier);
            const ident = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", this.instrument.instrumentIdentifier);
            this.lastIcao = icao;
            if (ident != this.lastIdent) {
                this.wayPoint = null;
                this.instrument.facilityLoader.getFacilityCB(icao, (waypoint) => {
                    if (waypoint) {
                        if (waypoint.infos.icao == this.lastIcao) {
                            this.wayPoint = waypoint;
                        } else if (!this.wayPoint || this.wayPoint.icao != this.lastIcao) {
                            this.lastIdent = ident;
                            this.wayPoint = null;
                        }
                    }
                });
                this.lastIdent = ident;
            }
        }
        if (this.wayPoint) {
            return this.wayPoint.infos;
        } else {
            const info = new WayPointInfo(this.instrument);
            info.ident = this.lastIdent;
            info.icao = this.lastIcao;
            return info;
        }
    }
    getWaypoint() {
        return this.wayPoint;
    }
    setInstrument(_instrument) {
        this.instrument = _instrument;
        this.wayPoint.instrument = _instrument;
    }
    Update() {
        if (this.isActive && !this.container.IsEditingSearchField()) {
            this.isActive = false;
        }
        let ident;
        if (this.isActive) {
            this.getUpdatedInfos();
            let currICAO = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIdent", "string", this.instrument.instrumentIdentifier);
            currICAO = currICAO + "_____".slice(currICAO.length, 5);
            const state = this.container.blinkGetState(400, 200) ? "Blink" : "Off";
            const blinkPos = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCursorPosition", "number", this.instrument.instrumentIdentifier);
            const regex = new RegExp('^(.{' + blinkPos + '})(.)(.*)');
            const replace = '$1<span class="Blinking" state="' + state + '">$2</span>$3';
            ident = currICAO.replace(regex, replace);
        } else {
            if (this.wayPoint && this.wayPoint.infos && this.wayPoint.infos.icao) {
                ident = this.wayPoint.infos.ident;
            } else {
                this.instrument.facilityLoader.getFacilityCB(this.lastIcao, (waypoint) => {
                    this.wayPoint = waypoint;
                });
                ident = "_____";
            }
        }
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].innerHTML = ident;
        }
    }
    SetWaypoint(_type, _icao) {
        this.lastIcao = _icao;
        this.instrument.facilityLoader.getFacilityCB(_icao, (waypoint) => {
            if (waypoint) {
                this.wayPoint = waypoint;
            } else {
                this.wayPoint = new WayPoint(this.instrument);
            }
        });
    }
    StartSearch(_callback = null) {
        this.isActive = true;
        if (this.wayPoint) {
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchInitialIcao", "string", this.wayPoint.GetInfos().icao, this.instrument.instrumentIdentifier);
        }
        if (this.wpType) {
            SimVar.SetSimVarValue("C:fs9gps:IcaoSearchStartCursor", "string", this.wpType, this.instrument.instrumentIdentifier);
        }
        this.endCallback = _callback;
    }
    onInteractionEvent(_args) {
        switch (_args[0]) {
            case "NavigationLargeInc":
                this.AdvanceCursorRight();
                break;
            case "NavigationLargeDec":
                this.AdvanceCursorLeft();
                break;
            case "NavigationSmallInc":
                this.AdvanceCharacterNext();
                break;
            case "NavigationSmallDec":
                this.AdvanceCharacterPrevious();
                break;
            case "ENT_Push":
                this.Validate();
                break;
        }
    }
    AdvanceCursorRight() {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchAdvanceCursor", "number", 1, this.instrument.instrumentIdentifier);
    }
    AdvanceCursorLeft() {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchAdvanceCursor", "number", -1, this.instrument.instrumentIdentifier);
    }
    AdvanceCharacterNext() {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchAdvanceCharacter", "number", 1, this.instrument.instrumentIdentifier);
    }
    AdvanceCharacterPrevious() {
        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchAdvanceCharacter", "number", -1, this.instrument.instrumentIdentifier);
    }
    Validate() {
        this.instrument.facilityLoader.getFacilityCB(SimVar.GetSimVarValue("C:fs9gps:IcaoSearchCurrentIcao", "string", this.instrument.instrumentIdentifier), (waypoint) => {
            if (waypoint) {
                this.wayPoint = waypoint;
            }
            if (waypoint || this.wayPoint.infos.icao == this.lastIcao) {
                this.isActive = false;
                this.container.OnSearchFieldEndEditing();
                const numberOfDuplicates = SimVar.GetSimVarValue("C:fs9gps:IcaoSearchMatchedIcaosNumber", "number", this.instrument.instrumentIdentifier);
                if (numberOfDuplicates > 1) {
                    SimVar.GetSimVarArrayValues(this.batch, function (_Values) {
                        this.duplicates = [];
                        for (let i = 0; i < _Values.length; i++) {
                            const waypoint = new WayPoint(this.instrument);
                            waypoint.type = _Values[i][0];
                            waypoint.SetIdent(_Values[i][2]);
                            waypoint.SetICAO(_Values[i][1]);
                            this.duplicates.push(waypoint);
                        }
                        SimVar.SetSimVarValue("C:fs9gps:IcaoSearchMatchedIcao", "number", 0, this.instrument.instrumentIdentifier);
                        if (this.endCallback()) {
                            this.endCallback();
                        }
                    }.bind(this), this.instrument.instrumentIdentifier);
                } else if (this.endCallback) {
                    this.duplicates = [];
                    this.endCallback();
                }
            } else {
                this.lastIcao = this.wayPoint.infos.icao;
                if (this.endCallback) {
                    this.endCallback();
                }
            }
        });
    }
}
class SearchFieldWaypointName {
    constructor(_instrument, _elements, _container, _wpType = 'A', _relativeICAOSearch = null) {
        this.wpType = 'A';
        this.isActive = false;
        this.lastIcao = "";
        this.instrument = _instrument;
        this.elements = _elements;
        this.container = _container;
        this.wayPoint = new WayPoint(this.instrument);
        this.wayPoint.type = null;
        this.wpType = _wpType;
        this.relatedIcaoSearch = _relativeICAOSearch;
    }
    getUpdatedInfos() {
        if (this.isActive) {
            const icao = SimVar.GetSimVarValue("C:fs9gps:NameSearchCurrentIcao", "string", this.instrument.instrumentIdentifier);
            if (this.lastIcao != icao) {
                this.wayPoint.type = SimVar.GetSimVarValue("C:fs9gps:NameSearchCurrentIcaoType", "string", this.instrument.instrumentIdentifier);
                this.wayPoint.SetICAO(icao);
                this.lastIcao = icao;
            }
        }
        if (this.relatedIcaoSearch) {
            const icao = this.relatedIcaoSearch.getUpdatedInfos().icao;
            if (this.lastIcao != icao) {
                this.SetWaypoint(this.relatedIcaoSearch.getWaypoint().type, icao);
                this.lastIcao = icao;
            }
        }
        return this.wayPoint.GetInfos();
    }
    getWaypoint() {
        return this.wayPoint;
    }
    Update() {
        if (this.isActive && !this.container.IsEditingSearchField()) {
            this.isActive = false;
        }
        let name;
        if (this.isActive) {
            let currName = SimVar.GetSimVarValue("C:fs9gps:NameSearchCurrentName", "string", this.instrument.instrumentIdentifier);
            currName = currName + "__________________".slice(currName.length, 30);
            const state = this.container.blinkGetState(400, 200) ? "Blink" : "Off";
            const blinkPos = SimVar.GetSimVarValue("C:fs9gps:NameSearchCursorPosition", "number", this.instrument.instrumentIdentifier);
            const regex = new RegExp('^(.{' + blinkPos + '})(.)(.*)');
            const replace = '$1<span class="Blinking" state="' + state + '">$2</span>$3';
            name = currName.replace(regex, replace);
            const relatedIcao = this.relatedIcaoSearch.getUpdatedInfos().icao;
            if (this.lastIcao != relatedIcao) {
                this.relatedIcaoSearch.SetWaypoint("", SimVar.GetSimVarValue("C:fs9gps:NameSearchCurrentIcao", "string", this.instrument.instrumentIdentifier));
            }
        } else {
            if (this.isActive) {
                const icao = SimVar.GetSimVarValue("C:fs9gps:NameSearchCurrentIcao", "string", this.instrument.instrumentIdentifier);
                if (this.lastIcao != icao) {
                    this.wayPoint.type = SimVar.GetSimVarValue("C:fs9gps:NameSearchCurrentIcaoType", "string", this.instrument.instrumentIdentifier);
                    this.wayPoint.SetICAO(icao);
                    this.lastIcao = icao;
                }
            }
            if (this.relatedIcaoSearch) {
                const icao = this.relatedIcaoSearch.getUpdatedInfos().icao;
                if (this.lastIcao != icao) {
                    const waypoint = this.relatedIcaoSearch.getWaypoint();
                    this.SetWaypoint(waypoint ? waypoint.type : "", icao);
                    this.lastIcao = icao;
                }
            }
            if (this.wayPoint.GetInfos() && this.wayPoint.GetInfos().icao) {
                name = this.wayPoint.GetInfos().name;
            } else {
                name = "_____";
            }
        }
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].innerHTML = name;
        }
    }
    SetWaypoint(_type, _icao) {
        this.wayPoint.type = _type;
        this.wayPoint.SetICAO(_icao);
    }
    StartSearch(_callback = null) {
        this.isActive = true;
        SimVar.SetSimVarValue("C:fs9gps:NameSearchInitialIcao", "string", this.wayPoint.GetInfos().icao, this.instrument.instrumentIdentifier);
        SimVar.SetSimVarValue("C:fs9gps:NameSearchStartCursor", "string", this.wpType, this.instrument.instrumentIdentifier);
        this.endCallback = _callback;
    }
    onInteractionEvent(_args) {
        switch (_args[0]) {
            case "NavigationLargeInc":
                this.AdvanceCursorRight();
                break;
            case "NavigationLargeDec":
                this.AdvanceCursorLeft();
                break;
            case "NavigationSmallInc":
                this.AdvanceCharacterNext();
                break;
            case "NavigationSmallDec":
                this.AdvanceCharacterPrevious();
                break;
            case "ENT_Push":
                this.Validate();
                break;
        }
    }
    AdvanceCursorRight() {
        SimVar.SetSimVarValue("C:fs9gps:NameSearchAdvanceCursor", "number", 1, this.instrument.instrumentIdentifier);
    }
    AdvanceCursorLeft() {
        SimVar.SetSimVarValue("C:fs9gps:NameSearchAdvanceCursor", "number", -1, this.instrument.instrumentIdentifier);
    }
    AdvanceCharacterNext() {
        SimVar.SetSimVarValue("C:fs9gps:NameSearchAdvanceCharacter", "number", 1, this.instrument.instrumentIdentifier);
    }
    AdvanceCharacterPrevious() {
        SimVar.SetSimVarValue("C:fs9gps:NameSearchAdvanceCharacter", "number", -1, this.instrument.instrumentIdentifier);
    }
    Validate() {
        this.wayPoint.type = SimVar.GetSimVarValue("C:fs9gps:NameSearchCurrentIcaoType", "string", this.instrument.instrumentIdentifier);
        this.wayPoint.SetICAO(SimVar.GetSimVarValue("C:fs9gps:NameSearchCurrentIcao", "string", this.instrument.instrumentIdentifier));
        this.isActive = false;
        this.container.OnSearchFieldEndEditing();
        if (this.endCallback) {
            this.endCallback();
        }
    }
}
class SearchFieldAdfFrequency {
    constructor(_elements, _container) {
        this.isActive = false;
        this.elements = _elements;
        this.container = _container;
    }
    Update() {
        if (this.isActive && !this.container.IsEditingSearchField()) {
            this.isActive = false;
        }
        let freq = SimVar.GetSimVarValue("ADF STANDBY FREQUENCY:1", "KHz").toFixed(1);
        if (this.isActive) {
            freq = "000000".slice(freq.length) + freq;
            const state = this.container.blinkGetState(400, 200) ? "Blink" : "Off";
            const regex = new RegExp('^(.{' + (this.cursorPos == 4 ? 5 : this.cursorPos) + '})(.)(.*)');
            const replace = '$1<span class="Blinking" state="' + state + '">$2</span>$3';
            freq = freq.replace(regex, replace);
        }
        for (let i = 0; i < this.elements.length; i++) {
            this.elements[i].innerHTML = freq;
        }
    }
    StartSearch(_callback = null) {
        this.isActive = true;
        this.cursorPos = 1;
        this.endCallback = _callback;
    }
    onInteractionEvent(_args) {
        switch (_args[0]) {
            case "NavigationLargeInc":
                this.AdvanceCursorRight();
                break;
            case "NavigationLargeDec":
                this.AdvanceCursorLeft();
                break;
            case "NavigationSmallInc":
                this.AdvanceCharacterNext();
                break;
            case "NavigationSmallDec":
                this.AdvanceCharacterPrevious();
                break;
            case "ENT_Push":
                this.Validate();
                break;
        }
    }
    AdvanceCursorRight() {
        this.cursorPos = (this.cursorPos % 4) + 1;
    }
    AdvanceCursorLeft() {
        this.cursorPos--;
        if (this.cursorPos == 0) {
            this.cursorPos = 4;
        }
    }
    AdvanceCharacterNext() {
        switch (this.cursorPos) {
            case 1:
                SimVar.SetSimVarValue("K:ADF_100_INC", "number", 1);
                break;
            case 2:
                SimVar.SetSimVarValue("K:ADF_10_INC", "number", 1);
                break;
            case 3:
                SimVar.SetSimVarValue("K:ADF_1_INC", "number", 1);
                break;
            case 4:
                SimVar.SetSimVarValue("K:ADF1_RADIO_TENTHS_INC", "number", 1);
                break;
        }
    }
    AdvanceCharacterPrevious() {
        switch (this.cursorPos) {
            case 1:
                SimVar.SetSimVarValue("K:ADF_100_DEC", "number", 1);
                break;
            case 2:
                SimVar.SetSimVarValue("K:ADF_10_DEC", "number", 1);
                break;
            case 3:
                SimVar.SetSimVarValue("K:ADF_1_DEC", "number", 1);
                break;
            case 4:
                SimVar.SetSimVarValue("K:ADF1_RADIO_TENTHS_DEC", "number", 1);
                break;
        }
    }
    Validate() {
        this.isActive = false;
        this.container.OnSearchFieldEndEditing();
        if (this.endCallback) {
            this.endCallback();
        }
    }
}
class SearchFieldTime {
    constructor(_elements, _container) {
        this.isActive = false;
        this.values = [0, 0, 0, 0, 0, 0];
        this.maxValues = [2, 3, 5, 9, 5, 9];
        this.elements = _elements;
        this.container = _container;
    }
    Update() {
        if (this.isActive && !this.container.IsEditingSearchField()) {
            this.isActive = false;
        }
        const display = this.values[0].toString() + this.values[1].toString() + ":" + this.values[2].toString() + this.values[3].toString() + ":" + this.values[4].toString() + this.values[5].toString();
        const state = this.container.blinkGetState(400, 200) ? "Blink" : "Off";
        const regex = new RegExp('^(.{' + Math.floor(this.cursorPos * 1.5) + '})(.)(.*)');
        const replace = '$1<span class="Blinking" state="' + state + '">$2</span>$3';
        const finalDisplay = display.replace(regex, replace);
        for (let i = 0; i < this.elements.length; i++) {
            Avionics.Utils.diffAndSet(this.elements[i], finalDisplay);
        }
    }
    StartSearch(_callback = null) {
        this.isActive = true;
        this.cursorPos = 5;
        this.values = [0, 0, 0, 0, 0, 0];
        this.endCallback = _callback;
    }
    onInteractionEvent(_args) {
        switch (_args[0]) {
            case "NavigationLargeInc":
                this.AdvanceCursorRight();
                break;
            case "NavigationLargeDec":
                this.AdvanceCursorLeft();
                break;
            case "NavigationSmallInc":
                this.AdvanceCharacterNext();
                break;
            case "NavigationSmallDec":
                this.AdvanceCharacterPrevious();
                break;
            case "ENT_Push":
                this.Validate();
                break;
        }
    }
    AdvanceCursorRight() {
        this.cursorPos = Math.min(5, this.cursorPos + 1);
    }
    AdvanceCursorLeft() {
        this.cursorPos = Math.max(0, this.cursorPos - 1);
    }
    AdvanceCharacterNext() {
        this.values[this.cursorPos] = (this.values[this.cursorPos] + 1) % (this.maxValues[this.cursorPos] + 1);
    }
    AdvanceCharacterPrevious() {
        this.values[this.cursorPos] = (this.values[this.cursorPos] - 1);
        if (this.values[this.cursorPos] <= 0) {
            this.values[this.cursorPos] = this.maxValues[this.cursorPos];
        }
    }
    Validate() {
        this.isActive = false;
        this.container.OnSearchFieldEndEditing();
        if (this.endCallback) {
            this.endCallback((this.values[0] * 10 + this.values[1]) * 3600000 + (this.values[2] * 10 + this.values[3]) * 60000 + (this.values[4] * 10 + this.values[5]) * 1000);
        }
    }
}
class SearchFieldAltitude {
    constructor(_elements, _container) {
        this.isActive = false;
        this.values = [0, 0, 0, 0, 0];
        this.maxValues = [9, 9, 9, 9, 9];
        this.elements = _elements;
        this.container = _container;
    }
    Update() {
        if (this.isActive && !this.container.IsEditingSearchField()) {
            this.isActive = false;
        }
        if (this.isActive) {
            const display = this.values[0].toString() + this.values[1].toString() + this.values[2].toString() + this.values[3].toString() + this.values[4].toString() + "FT";
            const state = this.container.blinkGetState(400, 200) ? "Blink" : "Off";
            const regex = new RegExp('^(.{' + this.cursorPos + '})(.)(.*)');
            const replace = '$1<span class="Blinking" state="' + state + '">$2</span>$3';
            const finalDisplay = display.replace(regex, replace);
            for (let i = 0; i < this.elements.length; i++) {
                Avionics.Utils.diffAndSet(this.elements[i], finalDisplay);
            }
        }
    }
    StartSearch(_callback = null) {
        this.isActive = true;
        this.cursorPos = 0;
        this.values = [0, 0, 0, 0, 0];
        this.endCallback = _callback;
    }
    onInteractionEvent(_args) {
        switch (_args[0]) {
            case "NavigationLargeInc":
                this.AdvanceCursorRight();
                break;
            case "NavigationLargeDec":
                this.AdvanceCursorLeft();
                break;
            case "NavigationSmallInc":
                this.AdvanceCharacterNext();
                break;
            case "NavigationSmallDec":
                this.AdvanceCharacterPrevious();
                break;
            case "ENT_Push":
                this.Validate();
                break;
        }
    }
    AdvanceCursorRight() {
        this.cursorPos = Math.min(4, this.cursorPos + 1);
    }
    AdvanceCursorLeft() {
        this.cursorPos = Math.max(0, this.cursorPos - 1);
    }
    AdvanceCharacterNext() {
        this.values[this.cursorPos] = (this.values[this.cursorPos] + 1) % (this.maxValues[this.cursorPos] + 1);
    }
    AdvanceCharacterPrevious() {
        this.values[this.cursorPos] = (this.values[this.cursorPos] - 1);
        if (this.values[this.cursorPos] <= 0) {
            this.values[this.cursorPos] = this.maxValues[this.cursorPos];
        }
    }
    Validate() {
        this.isActive = false;
        this.container.OnSearchFieldEndEditing();
        if (this.endCallback) {
            let value = 0;
            let power = 1;
            for (let i = 4; i >= 0; i--) {
                value += power * this.values[i];
                power *= 10;
            }
            this.endCallback(value);
        }
    }
}
//# sourceMappingURL=SearchField.js.map