class GeoCalcInfo {
    constructor(_instrument) {
        this.useMagVar = false;
        this.instrument = _instrument;
    }
    LoadData() {
        const instrId = this.instrument.instrumentIdentifier;
        switch (this.loadState) {
            case 0:
                SimVar.SetSimVarValue("C:fs9gps:GeoCalcLatitude1", "degree", this.lat1, instrId);
                SimVar.SetSimVarValue("C:fs9gps:GeoCalcLongitude1", "degree", this.lon1, instrId);
                SimVar.SetSimVarValue("C:fs9gps:GeoCalcLatitude2", "degree", this.lat2, instrId);
                SimVar.SetSimVarValue("C:fs9gps:GeoCalcLongitude2", "degree", this.lon2, instrId).then(function () {
                    this.bearing = SimVar.GetSimVarValue("C:fs9gps:GeoCalcBearing", "degree", instrId);
                    if (this.useMagVar) {
                        this.bearing -= SimVar.GetSimVarValue("MAGVAR", "degree", instrId);
                    }
                    this.distance = SimVar.GetSimVarValue("C:fs9gps:GeoCalcDistance", "nautical miles", instrId);
                    this.loadState++;
                }.bind(this));
                this.loadState++;
                break;
        }
    }
    IsUpToDate() {
        return this.loadState == 2;
    }
    EndLoad() {
        if (this.endCallBack) {
            this.endCallBack();
        }
    }
    SetParams(_lat1, _lon1, _lat2, _lon2, _useMagVar = false) {
        this.lat1 = _lat1;
        this.lon1 = _lon1;
        this.lat2 = _lat2;
        this.lon2 = _lon2;
        this.useMagVar = _useMagVar;
    }
    Compute(_callback = null) {
        if (GeoCalcInfo.readManager.AddToQueue(this.instrument, this)) {
            this.loadState = 0;
            this.endCallBack = _callback;
        }
    }
}
GeoCalcInfo.readManager = new InstrumentDataReadManager();
//# sourceMappingURL=GeoCalc.js.map