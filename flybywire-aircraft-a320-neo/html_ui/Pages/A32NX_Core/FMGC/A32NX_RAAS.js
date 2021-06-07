class A32NX_RAAS {
    constructor(_fmc) {
        this.fmc = _fmc;
        this.fpm = this.fmc.flightPlanManager;
    }

    init() {
        console.log('A32NX_RAAS init');

        this.airportData;
        this.runwayData;
        this.runwayEndData;

        this.loadJSON();

        this.nearestAirportId = NaN;
        this.needUpdate = false;

        this.nearestRunwayData;
        this.nearestRunway = [[]];

        this.aircraftOnRunway;
    }

    update() {
        this.updateAirportInfo();

        if (this.needUpdate) {
            this.updateNearestRunway();
            this.needUpdate = false;
        }

        //this.isAircraftOnRunway();

        console.log(this.aircraftOnRunway);
        console.log(this.nearestRunway);
        //console.log(this.nearestRunwayId(this.nearestAirportId).length);
        /*console.log(this.nearestAirport()[0].icao)
        for (let i = 0; i < this.nearestRunwayId(this.nearestAirportId).length; i++) {
            console.log(this.searchRunway(this.nearestRunwayId(this.nearestAirportId)[i].primary_end_id)[0].name);
        }*/
    }

    isAircraftOnRunway() {
        const gpsLat = SimVar.GetSimVarValue("A:GPS POSITION LAT", "degrees");
        const gpsLon = SimVar.GetSimVarValue("A:GPS POSITION LON", "degrees");
        for (let i = 0; i < this.nearestRunway.length; i += 2) {
            const diffLon = Math.abs(this.nearestRunway[i][1] - this.nearestRunway[i+1][1]);
            const diffLat = Math.abs(this.nearestRunway[i][2] - this.nearestRunway[i+1][2]);
            const inLonRange = Math.abs(this.nearestRunway[i][1] - gpsLon) < diffLon ? true : false;
            const inLatRange = Math.abs(this.nearestRunway[i][2] - gpsLat) < diffLat ? true : false;
            if (inLonRange && inLatRange) {
                this.aircraftOnRunway = true;
            } else {
                this.aircraftOnRunway = false;
            }
        }
    }

    updateNearestRunway() {
        if (this.nearestAirportId !== NaN) {
            for(let i = 0; i < this.nearestRunwayData.length; i++) {
                if (!this.nearestRunway.includes(this.nearestRunwayData[i].primary_end_id)) {
                    const primary = this.searchRunway(this.nearestRunwayData[i].primary_end_id);
                    const secondary = this.searchRunway(this.nearestRunwayData[i].secondary_end_id);
                    this.nearestRunway.push([this.nearestRunwayData[i].primary_end_id, primary[0].lonx, primary[0].laty]);
                    this.nearestRunway.push([this.nearestRunwayData[i].secondary_end_id, secondary[0].lonx, secondary[0].laty]);
                }
            }
        }
    }

    updateAirportInfo() {
        try {
            if (this.nearestAirportId !== this.nearestAirport()[0].airport_id){
                this.nearestAirportId = this.nearestAirport()[0].airport_id;
                this.needUpdate = true;
            }

            if (this.nearestAirportId !== NaN) {
                this.nearestRunwayData = this.nearestRunwayId(this.nearestAirportId);
            }
            if (this.nearestPrimaryRunwayId !== NaN) {
            }
        } catch(err) {
            console.log("Not Searched Yet");
        }
    }

    async loadJSON() {
        const data1 = await fetch('/Database/airport.json');
        const text1 = await data1.text();
        this.airportData = await JSON.parse(text1);

        const data2 = await fetch('/Database/runway.json');
        const text2 = await data2.text();
        this.runwayData = await JSON.parse(text2);

        const data3 = await fetch('/Database/runway_end.json');
        const text3 = await data3.text();
        this.runwayEndData = await JSON.parse(text3);
    }

    nearestAirport() {
        const gpsLat = SimVar.GetSimVarValue("A:GPS POSITION LAT", "degrees");
        const gpsLon = SimVar.GetSimVarValue("A:GPS POSITION LON", "degrees");
        const result = this.airportData.filter(data => {
            const dist = this.calculateDistance(gpsLat, gpsLon, data.laty, data.lonx)
            if (dist < 5) {
                return data;
            }
        });
        return result;
    }

    nearestRunwayId(id) {
        const result = this.runwayData.filter(data => {
            if (id === data.airport_id) {
                return data;
            }
        });
        return result;
    }

    searchRunway(id) {
        const result = this.runwayEndData.filter(data => {
            if (id === data.runway_end_id) {
                return data;
            }
        });
        return result;
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
