// Used to determine if an ICAO code uses InHG or HPa.
function AirportUsesHPA(icao) {
    const InHgRegions = ["K", "C", "M", "P", "RJ", "RO", "TI", "TJ"];
    return !InHgRegions.some(r => icao.startsWith(r));
}

// Used to set the baro unit selector to the correct setting.
class A32NX_BaroSelector {
    constructor() {
        console.log('A32NX_BaroSelector constructed');
    }
    init() {
        console.log('A32NX_BaroSelector init');
        this.SimVarCallbackPending = false;
        this.BaroSelectorHasBeenSet = false;

        const configDefaultBaroUnit = NXDataStore.get("CONFIG_DEFAULT_BARO_UNIT", "IN HG");
        if (configDefaultBaroUnit != "AUTO") this.SetBaroSelector(configDefaultBaroUnit == "HPA");
    }
    update(_dTime, _core) {
        if (this.BaroSelectorHasBeenSet) return;
        // TODO: What if this callback never gets called?
        if (this.SimVarCallbackPending) return;

        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumItems", "number", 1);
        SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumDistance", "nautical miles", 10000);
        SimVar.SetSimVarValue("C:fs9gps:NearestAirportCurrentLatitude", "degree latitude", lat);
        SimVar.SetSimVarValue("C:fs9gps:NearestAirportCurrentLongitude", "degree longitude", lon);

        const batch = new SimVar.SimVarBatch("C:fs9gps:NearestAirportItemsNumber", "C:fs9gps:NearestAirportCurrentLine");
        batch.add("C:fs9gps:NearestAirportCurrentICAO", "string", "string");

        SimVar.GetSimVarArrayValues(batch, (values) => {
            if (values.length != 1) return;
            const icao = values[0][0].substr(2).trim();
            this.SetBaroSelector(AirportUsesHPA(icao));
            this.SimVarCallbackPending = false;
        });

        this.SimVarCallbackPending = true;
    }
    SetBaroSelector(value) {
        SimVar.SetSimVarValue("L:XMLVAR_Baro_Selector_HPA_1", "bool", value);
        this.BaroSelectorHasBeenSet = true;
    }
}
