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
        this.runwayData = null;
        this.loadRunwayData();

        /*
         * Nearest Part
         */
        this.nearestAirport = [];
        this.nearestRunwayList = [];
        this.savedNearestAirportId;
        this.needUpdate = false;
        this.nearestRunwayHowFarAway = 50000000;
        this.nearestRunwayId = null;

        this.shouldChangeNearestRunwayThings = true;

        this.nearestRunwayLength = null;
        this.nearestRunwayWidth = null;
        this.nearestRunwayMiddleLat = null;
        this.nearestRunwayMiddleLon = null;

        this.nearestRunwayName = null;
        this.nearestRunwayHeading = null;
        this.nearestRunwayLatitude = null;
        this.nearestRunwayLongitude = null;

        this.nearestoppositeRunwayName = null;
        this.nearestoppositeRunwayHeading = null;
        this.nearestoppositeRunwayLatitude = null;
        this.nearestoppositeRunwayLongitude = null;

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
        if (this.runwayData !== null) {
            this.nearestAirport = this.findNearestAirport(5, gpsLat, gpsLon);

            // If Nearest Airport changed, force update to new airport
            if (this.savedNearestAirportId !== this.nearestAirport[0].airport_id) {
                this.needUpdate = true;
                this.savedNearestAirportId = this.nearestAirport[0].airport_id;
            }
            if (this.needUpdate) {
                this.nearestRunwayList = [];
                this.updateRunwayList();
                this.needUpdate = false;
            }
        }

        this.whoIsNearestRunway(gpsLat, gpsLon);
        this.whichPartIsNearestRunway(gpsLat, gpsLon);
        this.isAircraftOnRunway();

        console.log(this.nearestRunwayName);
    }

    /*
     * JSON Load Part
     * NOTE : THIS WILL REMOVED WHEN API COMING
     */
    async loadRunwayData() {
        try {
            const location = '/Database/runway.json';
            const data = await fetch(location);
            const text = await data.text();
            this.runwayData = await JSON.parse(text);
            console.log('Loaded runway json');
        } catch(err) {
            console.log("Can't load JSON");
        }
    }

    /*
     * Search Part
     * NOTE : THIS WILL CHANGED WHEN API COMING
     */
    findNearestAirport(mile, gpsLat, gpsLon) {
        const result = this.runwayData.filter(data => {
            const dist = this.calculateDistance(gpsLat, gpsLon, data.laty, data.lonx, "nm");
            if (dist < mile) {
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
        for (let i = 0; i < this.nearestAirport.length; i++) {
            this.nearestRunwayList.push(
                [this.nearestAirport[i].length, this.nearestAirport[i].width, this.nearestAirport[i].laty, this.nearestAirport[i].lonx,
                this.nearestAirport[0].primary_name, this.nearestAirport[0].primary_heading, this.nearestAirport[0].primary_laty, this.nearestAirport[0].primary_lonx,
                this.nearestAirport[0].secondary_name, this.nearestAirport[0].secondary_heading, this.nearestAirport[0].secondary_laty, this.nearestAirport[0].secondary_lonx]
            );
        }
    }

    whoIsNearestRunway(gpsLat, gpsLon) {
        for(let i = 0; i < this.nearestRunwayList.length; i++) {
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
        if (this.nearestRunwayId === null) {
            return;
        }

        const i = this.nearestRunwayId;
        const primaryLon = this.nearestRunwayList[i][6];
        const primaryLat = this.nearestRunwayList[i][7];
        const secondaryLon = this.nearestRunwayList[i][10];
        const secondaryLat = this.nearestRunwayList[i][11];

        const primaryDistance = this.calculateDistance(gpsLat, gpsLon, primaryLon, primaryLat, "m");
        const secondaryDistance = this.calculateDistance(gpsLat, gpsLon, secondaryLon, secondaryLat, "m");

        if(this.shouldChangeNearestRunwayThings) {
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
        const theta = lon1-lon2;
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
