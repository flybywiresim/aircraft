class A32NX_RAAS {
    constructor(_fmc) {
        this.fmc = _fmc;
        this.fpm = this.fmc.flightPlanManager;
    }

    init() {
        console.log('A32NX_RAAS init');

        /*
         * JSON Load Part
         */
        this.airportData;
        this.runwayData;
        this.runwayEndData;

        const needToLoad = ['airport', 'runway', 'runway_end'];
        this.loadJSON(needToLoad);

        /*
         * Nearest Part
         */
        this.nearestAirport;
        this.savedNearestAirportId;
        this.needUpdate = false;
        this.nearestRunwayList = [];
        this.nearestRunwayId = NaN;

        this.isAircraftOnRunwayBool;
        this.isAircraftOnRunwayValue;
    }

    update() {

        this.nearestAirport = this.updateNearestAirport(5);
        this.nearestAirportRunwayList = this.findRunwayListByAirportId(this.nearestAirport[0].airport_id);

        if (this.savedNearestAirportId !== this.nearestAirport[0].airport_id) {
            this.needUpdate = true;
            this.savedNearestAirportId = this.nearestAirport[0].airport_id
        }

        if (this.needUpdate) {
            this.nearestRunwayList = [];
            this.updateRunwayList();
            this.needUpdate = false;
        }

        if (this.nearestRunwayList !== null) {
            this.isAircraftOnRunway();
        }

        console.log(this.isAircraftOnRunwayBool);
        console.log(this.isAircraftOnRunwayValue);
    }

    async loadJSON(name) {
        try {
            for (let i = 0; i < name.length; i++) {
                const location = `/Database/${name[i]}.json`;
                const data = await fetch(location);
                const text = await data.text();
                if (name[i] === `airport`) {
                    this.airportData = await JSON.parse(text);
                } else if (name[i] === 'runway') {
                    this.runwayData = await JSON.parse(text);
                } else if (name[i] === 'runway_end') {
                    this.runwayEndData = await JSON.parse(text);
                }
                console.log(`Loaded ${name[i]} json`);
            }
        } catch(err) {
            console.log("Can't load JSON");
        }
    }

    updateNearestAirport(mile) {
        const gpsLat = SimVar.GetSimVarValue("A:GPS POSITION LAT", "degrees");
        const gpsLon = SimVar.GetSimVarValue("A:GPS POSITION LON", "degrees");
        const result = this.airportData.filter(data => {
            const dist = this.calculateDistance(gpsLat, gpsLon, data.laty, data.lonx)
            if (dist < mile) {
                return data;
            }
        });
        return result;
    }

    findRunwayListByAirportId(id) {
        const result = this.runwayData.filter(data => {
            if (id === data.airport_id) {
                return data;
            }
        });
        return result;
    }

    searchRunwayFromRunwayId(id) {
        const result = this.runwayEndData.filter(data => {
            if (id === data.runway_end_id) {
                return data;
            }
        });
        return result;
    }

    updateRunwayList() {
        const id = this.savedNearestAirportId;
        const runwayList = this.findRunwayListByAirportId(id);
        for (let i = 0; i < runwayList.length; i++) {
            // ID
            const primaryId = runwayList[i].primary_end_id;
            const secondaryId = runwayList[i].secondary_end_id;

            // Data
            const primaryData = this.searchRunwayFromRunwayId(primaryId);
            const secondaryData = this.searchRunwayFromRunwayId(secondaryId);
            this.nearestRunwayList.push([primaryData[0].name, primaryData[0].heading, primaryData[0].laty, primaryData[0].lonx, secondaryData[0].name, secondaryData[0].heading, secondaryData[0].laty, secondaryData[0].lonx])
        }
    }

    isAircraftOnRunway() {
        const gpsLat = SimVar.GetSimVarValue("A:GPS POSITION LAT", "degrees");
        const gpsLon = SimVar.GetSimVarValue("A:GPS POSITION LON", "degrees");
        for (let i = 0; i < this.nearestRunwayList.length; i++) {
            const runwayVectorX = this.nearestRunwayList[i][2] - this.nearestRunwayList[i][6];
            const runwayVectorY = this.nearestRunwayList[i][3] - this.nearestRunwayList[i][7];
            const currentVectorX = this.nearestRunwayList[i][2] - gpsLat;
            const currentVectorY = this.nearestRunwayList[i][3] - gpsLon;
            const angle = this.getAngle(runwayVectorX, runwayVectorY, currentVectorX, currentVectorY);

            console.log(angle);

            if (Math.abs(angle) <= 0.025) {
                this.nearestRunwayId = i;
                this.isAircraftOnRunwayBool = true;
                if (Math.abs(this.nearestRunwayList[i][2] - gpsLat) >= Math.abs(this.nearestRunwayList[i][6] - gpsLat)) {
                    this.isAircraftOnRunwayValue = this.nearestRunwayList[i][4];
                } else {
                    this.isAircraftOnRunwayValue = this.nearestRunwayList[i][0];
                }
            }
        }

        if (!isNaN(this.nearestRunwayId)) {
            const runwayVectorX = this.nearestRunwayList[this.nearestRunwayId][2] - this.nearestRunwayList[this.nearestRunwayId][6];
            const runwayVectorY = this.nearestRunwayList[this.nearestRunwayId][3] - this.nearestRunwayList[this.nearestRunwayId][7];
            const currentVectorX = this.nearestRunwayList[this.nearestRunwayId][2] - gpsLat;
            const currentVectorY = this.nearestRunwayList[this.nearestRunwayId][3] - gpsLon;
            const angle = this.getAngle(runwayVectorX, runwayVectorY, currentVectorX, currentVectorY);

            if (Math.abs(angle) > 0.025) {
                this.nearestRunwayId = NaN;
                this.isAircraftOnRunwayBool = false;
                this.isAircraftOnRunwayValue = "";
            }
        }
    }
    getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2, x2) - Math.atan2(y1, x1);
    }

    calculateDistance(lat1, lon1, lat2, lon2) {
        const theta = lon1 - lon2;
        let dist = Math.sin(this.degToRad(lat1)) * Math.sin(this.degToRad(lat2)) + Math.cos(this.degToRad(lat1)) * Math.cos(this.degToRad(lat2)) * Math.cos(this.degToRad(theta));
        dist = Math.acos(dist);
        dist = this.radToDeg(dist);
        dist = dist * 60 * 1.1515;
        dist = dist * 0.8689762419;
        return dist;
    }

    degToRad(deg) {
        return (deg * Math.PI / 180);
    }

    radToDeg(rad) {
        return (rad * 180 / Math.PI);
    }
}
