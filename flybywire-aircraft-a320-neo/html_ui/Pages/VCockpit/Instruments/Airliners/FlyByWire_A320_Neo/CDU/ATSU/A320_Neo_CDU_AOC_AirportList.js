const airportTypes = {
    Departure: 0,
    Arrival: 1,
    Alternate: 2,
    Selected: 3
};

/**
 * This method assembles the airport data which contains the raw data as well as the OutPut that can be seen on the page
 * @param _icao {string}
 * @param _type {airportTypes}
 * @returns {{outPut: string, icao: string, type: airportTypes}}
 */
function assembleAirportInfo(_icao = "", _type = airportTypes.Selected) {
    return { icao: _icao, type: _type, outPut: `{${_type === airportTypes.Selected || !_icao ? "cyan" : "green"}}${_icao ? _icao : "[ ]"}{end}` };
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
            _dep ? assembleAirportInfo(_dep, airportTypes.Departure) : defaultRow,
            _arr ? assembleAirportInfo(_arr, airportTypes.Arrival) : defaultRow,
            _alt ? assembleAirportInfo(_alt, airportTypes.Alternate) : defaultRow,
            defaultRow
        ];
    }

    /**
     * set arrival should only be used by new dest function
     * @param _value {string}
     */
    set arrival(_value) {
        if (this.rows[1].type === airportTypes.Arrival || (this.rows[1].type === airportTypes.Selected && !this.rows[1].icao)) {
            this.set(1, _value, airportTypes.Arrival);
        }
    }

    /**
     * set alternate should only be used by change alternate
     * @param _value {string}
     */
    set alternate(_value) {
        if (this.rows[2].type === airportTypes.Alternate || (this.rows[2].type === airportTypes.Selected && !this.rows[2].icao)) {
            this.set(2, _value, airportTypes.Alternate);
        }
    }

    set(_index, _value, _type = airportTypes.Selected) {
        this.rows[_index] = _value === FMCMainDisplay.clrValue ? defaultRow : assembleAirportInfo(_value, _type);
    }

    /**
     * Assembles a list with valid icao strings
     * @returns string[]
     */
    get icaos() {
        const icaos = [];
        this.rows.forEach(({icao}) => {
            if (icao) {
                icaos.push(icao);
            }
        });
        return icaos;
    }
}
