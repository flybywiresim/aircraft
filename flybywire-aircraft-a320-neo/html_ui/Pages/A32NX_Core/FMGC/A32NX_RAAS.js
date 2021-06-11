class A32NX_RAAS {
    constructor(_fmc) {
        this.fmc = _fmc;
        this.fpm = this.fmc.flightPlanManager;
    }

    init() {
        console.log('A32NX_RAAS init');

        // Enable?
        this.useRaas = parseInt(NXDataStore.get("CONFIG_USE_RAAS", "1"));

        // If disable, do not start
        if (!this.useRaas) {
            return;
        }

        /*
         * JSON Load Part
         * NOTE : THIS WILL REMOVED WHEN API COMING
         */
        this.airportData = null;
        this.runwayData = null;
        this.runwayEndData = null;

        const needToLoad = ['airport', 'runway', 'runway_end'];
        this.loadJSON(needToLoad);

        /*
         * Nearest Part
         */
        this.nearestAirport;
        this.savedNearestAirportId;
        this.needUpdate = false;
        this.nearestRunwayList = [];
        this.nearestRunwayHowFarAway = 50000000;
        this.nearestRunwayId = NaN;

        this.shouldChangeNearestRunwayThings = true;

        this.nearestRunwayMiddleLat = NaN;
        this.nearestRunwayMiddleLon = NaN;

        this.nearestRunwayName = NaN;
        this.nearestRunwayHeading = NaN;
        this.nearestRunwayLatitude = NaN;
        this.nearestRunwayLongitude = NaN;

        this.nearestoppositeRunwayName = NaN;
        this.nearestoppositeRunwayHeading = NaN;
        this.nearestoppositeRunwayLatitude = NaN;
        this.nearestoppositeRunwayLongitude = NaN;

        // 90sec timer
        this.runwayHoldingTimer = new NXLogic_ConfirmNode(90, false);

        this.minimumRequireTakeoffRunwayLength = 7400; // ft
        this.minimumRequireLandingRunwayLength = 4500; // ft

        this.maximumGroundSpeed = 0;
    }

    update(_deltaTime) {
        // If disable, do not start
        if (!this.useRaas) {
            return;
        }

        const gpsLat = SimVar.GetSimVarValue("A:GPS POSITION LAT", "degrees");
        const gpsLon = SimVar.GetSimVarValue("A:GPS POSITION LON", "degrees");

        // Search Nearest Airport
        if (this.airportData !== null) {
            this.nearestAirport = this.findNearestAirport(5);

            // If Nearest Airport changed, force update to new airport
            if (this.savedNearestAirportId !== this.nearestAirport[0].airport_id) {
                this.needUpdate = true;
                this.savedNearestAirportId = this.nearestAirport[0].airport_id;
            }
            if (this.needUpdate) {
                this.nearestRunwayList = [];
                if (this.runwayEndData !== null) {
                    this.updateRunwayList();
                    this.needUpdate = false;
                }
            }
        }

        // Add Runway List
        if (this.runwayData !== null) {
            this.nearestAirportRunwayList = this.findRunwayListByAirportId(this.nearestAirport[0].airport_id);
        }

        this.whoIsNearestRunway(gpsLat, gpsLon);
        this.whichPartIsNearestRunway(gpsLat, gpsLon);
        this.isAircraftOnRunway();
    }

    /*
     * JSON Load Part
     * NOTE : THIS WILL REMOVED WHEN API COMING
     */
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
        } catch (err) {
            console.log("Can't load JSON");
        }
    }

    /*
     * Search Part
     * NOTE : THIS WILL CHANGED WHEN API COMING
     */
    findNearestAirport(mile) {
        const gpsLat = SimVar.GetSimVarValue("A:GPS POSITION LAT", "degrees");
        const gpsLon = SimVar.GetSimVarValue("A:GPS POSITION LON", "degrees");
        const result = this.airportData.filter(data => {
            const dist = this.calculateDistance(gpsLat, gpsLon, data.laty, data.lonx, "nm");
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

    findRunwayFromRunwayId(id) {
        const result = this.runwayEndData.filter(data => {
            if (id === data.runway_end_id) {
                return data;
            }
        });
        return result;
    }

    /*
     * this.nearestRunwayList[i][0] = Middle of runway, length
     * this.nearestRunwayList[i][1] = Middle of runway, width
     * this.nearestRunwayList[i][2] = Middle of runway, Latitude
     * this.nearestRunwayList[i][3] = Middle of runway, Longitude
     *
     * NOTE : Primary is one side of runway
     *        Secondary is otherside of primary point
     *
     * this.nearestRunwayList[i][4] = Primary Runway Name
     * this.nearestRunwayList[i][5] = Primary Runway Heading
     * this.nearestRunwayList[i][6] = Primary Runway Latitude
     * this.nearestRunwayList[i][7] = Primary Runway Longitude
     *
     * this.nearestRunwayList[i][8] = Secondary Runway Name
     * this.nearestRunwayList[i][9] = Secondary Runway Heading
     * this.nearestRunwayList[i][10] = Secondary Runway Latitude
     * this.nearestRunwayList[i][11] = Secondary Runway Longitude
     */
    updateRunwayList() {
        const id = this.savedNearestAirportId;
        const runwayList = this.findRunwayListByAirportId(id);
        for (let i = 0; i < runwayList.length; i++) {
            // ID
            const primaryId = runwayList[i].primary_end_id;
            const secondaryId = runwayList[i].secondary_end_id;

            // Data
            const primaryData = this.findRunwayFromRunwayId(primaryId);
            const secondaryData = this.findRunwayFromRunwayId(secondaryId);
            this.nearestRunwayList.push([runwayList[i].length, runwayList[i].width, runwayList[i].laty, runwayList[i].lonx, primaryData[0].name, primaryData[0].heading, primaryData[0].laty, primaryData[0].lonx, secondaryData[0].name, secondaryData[0].heading, secondaryData[0].laty, secondaryData[0].lonx]);
        }
    }

    whoIsNearestRunway(gpsLat, gpsLon) {
        for (let i = 0; i < this.nearestRunwayList.length; i++) {
            const middleOfRunwayLat = this.nearestRunwayList[i][2];
            const middleOfRunwayLon = this.nearestRunwayList[i][3];
            const howFarAway = this.calculateDistance(gpsLat, gpsLon, middleOfRunwayLat, middleOfRunwayLon, "m");

            if (this.nearestRunwayHowFarAway > howFarAway) {
                this.nearestRunwayHowFarAway = howFarAway;
                this.nearestRunwayId = i;
                this.shouldChangeNearestRunwayThings = true;
            }
        }
    }

    whichPartIsNearestRunway(gpsLat, gpsLon) {
        if (this.nearestRunwayId === NaN) {
            return;
        }

        const i = this.nearestRunwayId;
        const primaryLon = this.nearestRunwayList[i][6];
        const primaryLat = this.nearestRunwayList[i][7];
        const secondaryLon = this.nearestRunwayList[i][10];
        const secondaryLat = this.nearestRunwayList[i][11];

        const primaryDistance = this.calculateDistance(gpsLat, gpsLon, primaryLon, primaryLat, "m");
        const secondaryDistance = this.calculateDistance(gpsLat, gpsLon, secondaryLon, secondaryLat, "m");

        if (this.shouldChangeNearestRunwayThings) {
            this.nearestRunwayLength = this.nearestRunwayList[i][0];
            this.nearestRunwayWidth = this.nearestRunwayList[i][1];
            this.nearestRunwayMiddleLat = this.nearestRunwayList[i][2];
            this.nearestRunwayMiddleLon = this.nearestRunwayList[i][3];

            if (primaryDistance > secondaryDistance) {
                this.nearestRunwayName = this.nearestRunwayList[i][4];
                this.nearestRunwayHeading = this.nearestRunwayList[i][5];
                this.nearestRunwayLatitude = this.nearestRunwayList[i][6];
                this.nearestRunwayLongitude = this.nearestRunwayList[i][7];

                this.nearestoppositeRunwayName = this.nearestRunwayList[i][8];
                this.nearestoppositeRunwayHeading = this.nearestRunwayList[i][9];
                this.nearestoppositeRunwayLatitude = this.nearestRunwayList[i][10];
                this.nearestoppositeRunwayLongitude = this.nearestRunwayList[i][11];
            } else {
                this.nearestRunwayName = this.nearestRunwayList[i][8];
                this.nearestRunwayHeading = this.nearestRunwayList[i][9];
                this.nearestRunwayLatitude = this.nearestRunwayList[i][10];
                this.nearestRunwayLongitude = this.nearestRunwayList[i][11];

                this.nearestoppositeRunwayName = this.nearestRunwayList[i][4];
                this.nearestoppositeRunwayHeading = this.nearestRunwayList[i][5];
                this.nearestoppositeRunwayLatitude = this.nearestRunwayList[i][6];
                this.nearestoppositeRunwayLongitude = this.nearestRunwayList[i][7];
            }
            this.shouldChangeNearestRunwayThigs = false;
        }
    }

    isAircraftOnRunway() {
        const onRwy = SimVar.GetSimVarValue("ON ANY RUNWAY", "BOOL");
        console.log(onRwy);
    }

    /*
     * Use Haversine formula
     * https://en.wikipedia.org/wiki/Haversine_formula
     * DO NOT TOUCH UNDER VALUES
     */
    calculateDistance(lat1, lon1, lat2, lon2, unit) {
        if (lat1 == lat2 && lon1 == lon2) {
            return 0;
        }
        const theta = lon1 - lon2;
        const lat1ToRad = this.degToRad(lat1);
        const lat2ToRad = this.degToRad(lat2);
        const thetaToRad = this.degToRad(theta);
        let dist = Math.sin(lat1ToRad) * Math.sin(lat2ToRad) + Math.cos(lat1ToRad) * Math.cos(lat2ToRad) * Math.cos(thetaToRad);
        if (dist > 1) {
            dist = 1;
        }
        dist = Math.acos(dist);
        dist = this.radToDeg(dist);
        dist = dist * 60 * 1.1515;
        if (unit === "m") {
            dist = dist * 1609.344;
        }
        if (unit === "km") {
            dist = dist * 1.609344;
        }
        if (unit === "nm") {
            dist = dist * 0.8684;
        }
        if (unit === "ft") {
            dist = dist * 5280;
        }
        // If there is no unit, it return Statute Mile
        return dist;
    }

    degToRad(deg) {
        return (deg * Math.PI / 180);
    }

    radToDeg(rad) {
        return (rad * 180 / Math.PI);
    }

    getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2, x2) - Math.atan2(y1, x1);
    }
}
