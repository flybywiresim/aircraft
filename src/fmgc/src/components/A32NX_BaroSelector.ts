import { NXDataStore } from '@shared/persistence';

/* eslint-disable camelcase */
export class A32NX_BaroSelector {
    totalDeltaTime: number;

    callbackDispatchedAt: any;

    baroSelectionCompleted: boolean;

    nearestAirportSamples: number;

    nearestAirportChanges: number;

    cachedNearestAirportIcao: string;

    nearestAirportIcao: any;

    init() {
        this.totalDeltaTime = 0;
        this.callbackDispatchedAt = null;
        this.baroSelectionCompleted = false;

        this.nearestAirportSamples = 0;
        this.nearestAirportChanges = 0;
        this.cachedNearestAirportIcao = '';

        const configInitBaroUnit = NXDataStore.get('CONFIG_INIT_BARO_UNIT', 'IN HG');
        if (configInitBaroUnit !== 'AUTO') {
            this.setBaroSelector(configInitBaroUnit === 'HPA');
        }
    }

    update(_deltaTime, _core) {
        if (this.baroSelectionCompleted) {
            return;
        }
        this.totalDeltaTime += _deltaTime;

        // Check if we are waiting for a dispatched callback. If we've waited for more then 100ms, then try again.
        if (this.callbackDispatchedAt != null && (this.totalDeltaTime - this.callbackDispatchedAt) < 100) {
            return;
        }

        const lat = SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude');
        const lon = SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude');
        SimVar.SetSimVarValue('C:fs9gps:NearestAirportMaximumItems', 'number', 1);
        SimVar.SetSimVarValue('C:fs9gps:NearestAirportMaximumDistance', 'nautical miles', 10000);
        SimVar.SetSimVarValue('C:fs9gps:NearestAirportCurrentLatitude', 'degree latitude', lat);
        SimVar.SetSimVarValue('C:fs9gps:NearestAirportCurrentLongitude', 'degree longitude', lon);
        const batch = new SimVar.SimVarBatch('C:fs9gps:NearestAirportItemsNumber', 'C:fs9gps:NearestAirportCurrentLine');
        batch.add('C:fs9gps:NearestAirportCurrentICAO', 'string', 'string');

        this.callbackDispatchedAt = this.totalDeltaTime;
        SimVar.GetSimVarArrayValues(batch, (values) => {
            const icao = values[0][0].substr(2).trim();

            if (this.nearestAirportIcao !== icao) {
                this.nearestAirportChanges++;
            }
            this.nearestAirportIcao = icao;
            this.nearestAirportSamples++;
            this.callbackDispatchedAt = null;

            // If nearestAirportChanges is more than 1, then the nearest airport has updated successfuly.
            // If nearestAirportSamples is more than 2 (experimentally found) then the airport we initially found was correct.
            if (this.nearestAirportChanges > 1 || this.nearestAirportSamples > 2) {
                this.setBaroSelectorForAirport(icao);
            }
        });
    }

    setBaroSelector(value) {
        SimVar.SetSimVarValue('L:XMLVAR_Baro_Selector_HPA_1', 'bool', value);
        this.baroSelectionCompleted = true;
    }

    setBaroSelectorForAirport(icao) {
        const inchOfMercuryRegions = ['K', 'C', 'M', 'P', 'RJ', 'RO', 'TI', 'TJ'];
        this.setBaroSelector(!inchOfMercuryRegions.some((r) => icao.startsWith(r)));
    }
}
