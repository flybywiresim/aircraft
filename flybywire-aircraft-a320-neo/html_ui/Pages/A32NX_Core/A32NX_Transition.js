class A32NX_Transition {
    init() {
        console.log('A32NX_TransitionAltitude init');

        /*
        *   This file build manually by hand & some python crawling on each airport charts from their EAIP.
        *   So it may contain error. Please fix errors if you find it.
        */
        this.transitionSource;
        this.loadJSON('/Database/transitionAltitude.json');

        // Initial Airport
        this.originAirport = "";
        this.destinationAirport = "";

        // Saved Airport
        this.savedOriginAirport = "NULL";
        this.savedDestinationAirport = "NULL";
    }

    update() {
        if (this.remote) {
            this.trySetTA("Origin", this.originAirport);
            this.trySetTA("Destination", this.destinationAirport);
            this.remote = false;
        }
        this.TAUpdate();
    }

    async loadJSON(location) {
        const data = await fetch(location);
        const text = await data.text();
        this.transitionSource = await JSON.parse(text);
        console.log("JSON IMPORT COMPLETE");
    }

    search(icao) {
        const result = this.transitionSource.filter(data => {
            if (data.icao === icao) {
                return icao;
            }
        });
        return result;
    }

    TAUpdate() {
        if (this.originAirport !== "" && this.destinationAirport !== "") {
            if (this.originAirport !== this.savedOriginAirport) {
                this.trySetTA("Origin", this.originAirport);
                this.savedOriginAirport = this.originAirport;
            }
            if (this.destinationAirport !== this.savedDestinationAirport) {
                this.trySetTA("Destination", this.destinationAirport);
                this.savedDestinationAirport = this.destinationAirport;
            }
        }
    }

    trySetTA(mode, icao) {
        if (mode === "Origin") {
            const varName = "L:AIRLINER_TRANS_ALT";
            const ta = this.search(icao)[0].transitionAltitude;
            this.setTransitonAltitude(varName, ta);
        } else if (mode === "Destination") {
            const varName = "L:AIRLINER_APPR_TRANS_ALT";
            const ta = this.search(icao)[0].transitionLevel;
            this.setTransitonAltitude(varName, ta);
        }
    }

    setTransitonAltitude(varName, ta) {
        if (ta !== null) {
            SimVar.SetSimVarValue(varName, "Number", ta);
        } else {
            SimVar.SetSimVarValue(varName, "Number", 18000);
        }
    }
}
