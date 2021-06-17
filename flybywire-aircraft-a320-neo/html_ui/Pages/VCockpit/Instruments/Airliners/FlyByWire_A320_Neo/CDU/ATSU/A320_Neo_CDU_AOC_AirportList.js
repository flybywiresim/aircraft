/**
 * This method assembles the airport data which contains the raw data as well as the output that can be seen on the page
 * @param _icao {string}
 * @param _isManaged {boolean}
 * @returns {{output: string, icao: string, isManaged: boolean}}
 */
function assembleAirportInfo(_icao = "", _isManaged = false) {
    return { icao: _icao, isManaged: _isManaged, output: `{${!_isManaged || !_icao ? "cyan" : "green"}}${_icao ? _icao : "[ ]"}{end}` };
}

const defaultRow = assembleAirportInfo();

class CDUAocAirportList {
    constructor() {
        this.rows = [defaultRow, defaultRow, defaultRow, defaultRow];
    }

    /**
     * Initialization of the airport list
     * @param _dep {string}
     * @param _arr {string}
     * @param _alt {string}
     */
    init(_dep = undefined, _arr = undefined, _alt = undefined) {
        this.rows = [
            _dep ? assembleAirportInfo(_dep, true) : defaultRow,
            _arr ? assembleAirportInfo(_arr, true) : defaultRow,
            _alt ? assembleAirportInfo(_alt, true) : defaultRow,
            defaultRow
        ];
    }

    /**
     * set arrival should only be used by new dest function
     * @param _value {string}
     */
    set arrival(_value) {
        this.canUpdate(1, _value);
    }

    /**
     * set alternate should only be used by change alternate
     * @param _value {string}
     */
    set alternate(_value) {
        this.canUpdate(2, _value);
    }

    /**
     * Ensure either a managed value or none is currently present in the target row (Honeywell doesn't override pilot entered airports)
     * @param _index {number}
     * @param _value {string}
     */
    canUpdate(_index, _value) {
        if (this.rows[_index].isManaged || (!this.rows[_index].isManaged && !this.rows[_index].icao)) {
            this.rows[_index] = assembleAirportInfo(_value, true);
        }
    }

    set(_index, _value) {
        this.rows[_index] = _value === FMCMainDisplay.clrValue ? defaultRow : assembleAirportInfo(_value);
    }

    /**
     * Assembles a list with valid icao strings
     * @returns string[]
     */
    get icaos() {
        return this.rows.reduce((result, {icao}) => icao ? result.concat(icao) : result, []);
    }
}
