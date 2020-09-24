class CDUAirportsMonitor {
    static ShowPage(mcdu, reset=false) {

        // one delta t unit is about 1.5 ms it seems
        var update_ival_ms = 1000

        this.total_delta_t += mcdu._deltaTime

        if (reset) {
            this.user_ap = undefined
            this.frozen = false
            this.total_delta_t = 0
        }

        // we want the closest 4 APs with unlimited distance
        var max_num_ap = 4
        var max_dist_miles = 100000

        if (this.total_delta_t >= update_ival_ms || !this.icao1) {
            var ap_line_batch = new SimVar.SimVarBatch("C:fs9gps:NearestAirportItemsNumber", "C:fs9gps:NearestAirportCurrentLine")
            ap_line_batch.add("C:fs9gps:NearestAirportSelectedLatitude", "degree latitude")
            ap_line_batch.add("C:fs9gps:NearestAirportSelectedLongitude", "degree longitude")
            ap_line_batch.add("C:fs9gps:NearestAirportCurrentICAO", "string", "string")
            ap_line_batch.add("C:fs9gps:NearestAirportCurrentDistance", "nautical miles", "number")
            ap_line_batch.add("C:fs9gps:NearestAirportCurrentTrueBearing", "degrees", "number")

            this.lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
            this.lon = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
            SimVar.SetSimVarValue("C:fs9gps:NearestAirportCurrentLatitude", "degree latitude", this.lat)
            SimVar.SetSimVarValue("C:fs9gps:NearestAirportCurrentLongitude", "degree longitude", this.lon)
            SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumItems", "number", max_num_ap)
            SimVar.SetSimVarValue("C:fs9gps:NearestAirportMaximumDistance", "nautical miles", max_dist_miles)

            SimVar.GetSimVarArrayValues(ap_line_batch, function (_Values) {
                // sometimes we get only one value,
                // in which case the display will not be cleared and redrawn
                if (_Values.length === 4) {
                    this.icao1 = _Values[0][2].substr(2).trim()
                    this.icao2 = _Values[1][2].substr(2).trim()
                    this.icao3 = _Values[2][2].substr(2).trim()
                    this.icao4 = _Values[3][2].substr(2).trim()
                    this.dist1 = Math.round(parseFloat(_Values[0][3]))
                    this.dist2 = Math.round(parseFloat(_Values[1][3]))
                    this.dist3 = Math.round(parseFloat(_Values[2][3]))
                    this.dist4 = Math.round(parseFloat(_Values[3][3]))
                    // values are jumpy! mitigated by slow update rate, as only about every 30th value is erroneous
                    this.magvar = SimVar.GetSimVarValue("MAGVAR", "degree")
                    this.brng1 = Math.round(parseFloat(_Values[0][4]) - this.magvar)
                    this.brng2 = Math.round(parseFloat(_Values[1][4]) - this.magvar)
                    this.brng3 = Math.round(parseFloat(_Values[2][4]) - this.magvar)
                    this.brng4 = Math.round(parseFloat(_Values[3][4]) - this.magvar)
                    this.ll1 = new LatLong(_Values[0][0], _Values[0][1])
                    this.ll2 = new LatLong(_Values[1][0], _Values[1][1])
                    this.ll3 = new LatLong(_Values[2][0], _Values[2][1])
                    this.ll4 = new LatLong(_Values[3][0], _Values[3][1])
                }
            }.bind(this))

            // logic from FlightPlanManager.js
            this.gs = SimVar.GetSimVarValue("GPS GROUND SPEED", "knots")
            if (this.gs < 50) {
                this.gs = 50
            }

            this.total_delta_t = 0
        }

        const s_per_h = 3600
        const s_per_d = s_per_h * 24

        // ETA offset in seconds
        var eta1_s = Math.round(this.dist1 / this.gs * s_per_h)
        var eta2_s = Math.round(this.dist2 / this.gs * s_per_h)
        var eta3_s = Math.round(this.dist3 / this.gs * s_per_h)
        var eta4_s = Math.round(this.dist4 / this.gs * s_per_h)

        // absolute ETA in seconds
        var utc_s  = Math.floor(SimVar.GetGlobalVarValue("ZULU TIME", "seconds"))
        var utc1_s = (utc_s + eta1_s) % s_per_d
        var utc2_s = (utc_s + eta2_s) % s_per_d
        var utc3_s = (utc_s + eta3_s) % s_per_d
        var utc4_s = (utc_s + eta4_s) % s_per_d

        // components for ETAs in HHMM format
        var h1 = Math.floor(utc1_s / s_per_h) || 0
        var h2 = Math.floor(utc2_s / s_per_h) || 0
        var h3 = Math.floor(utc3_s / s_per_h) || 0
        var h4 = Math.floor(utc4_s / s_per_h) || 0
        var m1 = Math.floor(utc1_s % s_per_h / 60) || 0
        var m2 = Math.floor(utc2_s % s_per_h / 60) || 0
        var m3 = Math.floor(utc3_s % s_per_h / 60) || 0
        var m4 = Math.floor(utc4_s % s_per_h / 60) || 0

        // ETA HHMM strings
        this.eta1 = `${h1.toString().padStart(2, "0") || "00"}${m1.toString().padStart(2, "0") || "00"}`
        this.eta2 = `${h2.toString().padStart(2, "0") || "00"}${m2.toString().padStart(2, "0") || "00"}`
        this.eta3 = `${h3.toString().padStart(2, "0") || "00"}${m3.toString().padStart(2, "0") || "00"}`
        this.eta4 = `${h4.toString().padStart(2, "0") || "00"}${m4.toString().padStart(2, "0") || "00"}`

        if (!this.user_ap) {
            this.user_ap_line = ["[][color]blue", ""]
        } else if (this.total_delta_t === 0) {
            // calculate values for user selected airport
            SimVar.SetSimVarValue("C:fs9gps:GeoCalcLatitude1", "degree", this.lat)
            SimVar.SetSimVarValue("C:fs9gps:GeoCalcLongitude1", "degree", this.lon)
            SimVar.SetSimVarValue("C:fs9gps:GeoCalcLatitude2", "degree", this.user_ap.infos.lat)
            SimVar.SetSimVarValue("C:fs9gps:GeoCalcLongitude2", "degree", this.user_ap.infos.long)
            this.brng5 = Math.round(SimVar.GetSimVarValue("C:fs9gps:GeoCalcBearing", "degree") - this.magvar)
            this.dist5 = Math.round(SimVar.GetSimVarValue("C:fs9gps:GeoCalcDistance", "nautical miles"))
            var eta5_s = Math.round(this.dist5 / this.gs * s_per_h)
            var utc5_s = (utc_s + eta5_s) % s_per_d
            var h5 = Math.floor(utc5_s / s_per_h) || 0
            var m5 = Math.floor(utc5_s % s_per_h / 60) || 0
            this.eta5 = `${h5.toString().padStart(2, "0") || "00"}${m5.toString().padStart(2, "0") || "00"}`
            this.user_ap_line = [
                `${this.user_ap.infos.ident}[color]green`,
                `${this.eta5}[color]green`,
                `${this.brng5.toString().padStart(3, "0")}°_${this.dist5.toString().padStart(5, "_")}[color]green`]
        }

        // display data on MCDU
        if (this.icao1) {
            mcdu.clearDisplay()
            mcdu.setTemplate([
                ["CLOSEST AIRPORTS"],
                ["", "UTC", "BRG DIST"],
                [`${this.icao1}[color]green`,
                `${this.eta1}[color]green`,
                `${this.brng1.toString().padStart(3, "0")}°_${this.dist1.toString().padStart(5, "_")}[color]green`],
                [""],
                [`${this.icao2}[color]green`,
                `${this.eta2}[color]green`,
                `${this.brng2.toString().padStart(3, "0")}°_${this.dist2.toString().padStart(5, "_")}[color]green`],
                [""],
                [`${this.icao3}[color]green`,
                `${this.eta3}[color]green`,
                `${this.brng3.toString().padStart(3, "0")}°_${this.dist3.toString().padStart(5, "_")}[color]green`],
                [""],
                [`${this.icao4}[color]green`,
                `${this.eta4}[color]green`,
                `${this.brng4.toString().padStart(3, "0")}°_${this.dist4.toString().padStart(5, "_")}[color]green`],
                [""],
                this.user_ap_line,
                ["", "", this.frozen ? "LIST FROZEN" : ""],
                [this.frozen ? "←UNFREEZE[color]blue" : "←FREEZE[color]blue", "EFOB/WIND>"]
            ])

            // force spaces to emulate 4 columns
            mcdu._labelElements[0][2].innerHTML = "BRG&nbsp;&nbsp;&nbsp;DIST"
            for (var i = 0; i < (this.user_ap ? 5 : 4); i++) {
                mcdu._lineElements[i][2].innerHTML = mcdu._lineElements[i][2].innerHTML.replace(/_/g, "&nbsp;")
            }
        }

        // page refresh
        if (!this.frozen || !this.icao1) {
            mcdu.refreshPageCallback = () => {
                this.ShowPage(mcdu)
            }
            SimVar.SetSimVarValue("L:FMC_UPDATE_CURRENT_PAGE", "number", 1)
        }

        // user-selected 5th airport
        mcdu.onLeftInput[4] = () => {
            if (!this.user_ap && mcdu.inOut !== '' && mcdu.inOut !== mcdu.clrValue) {
                let ap = mcdu.inOut
                // GetAirportByIdent returns a Waypoint in the callback,
                // which interally uses FacilityLoader (and further down calls Coherence)
                mcdu.dataManager.GetAirportByIdent(ap).then((ap_data) => {
                    if (ap_data) {
                        this.user_ap = ap_data
                        mcdu.clearUserInput()
                        // trigger data update next frame
                        this.total_delta_t = update_ival_ms
                        this.ShowPage(mcdu)
                    } else {
                        mcdu.showErrorMessage("NOT IN DATABASE")
                    }
                })
            }
        }

        // toggle freeze
        mcdu.onLeftInput[5] = () => {
            this.frozen = !this.frozen
            // trigger data update next frame
            this.total_delta_t = update_ival_ms
            this.ShowPage(mcdu)
        }

        // TODO EFOB/WIND
        mcdu.onRightInput[5] = () => {}
    }
}
