class NXApi {
    static getMetar(icao, source) {
        if (!icao) {
            throw ("No ICAO provided");
        }

        console.log('GET METAR');
        return fetch(`${NXApi.url}/metar/${icao}?source=${source}`)
            .then((response) => {
                if (!response.ok) {
                    console.error('METAR RESPONSE ERROR');
                    throw (response);
                }

                console.log('METAR RESPONSE OK');
                return response.json();
            });
    }

    static getTaf(icao, source) {
        if (!icao) {
            throw ("No ICAO provided");
        }

        console.log('GET TAF');
        return fetch(`${NXApi.url}/taf/${icao}?source=${source}`)
            .then((response) => {
                if (!response.ok) {
                    console.error('TAF RESPONSE ERROR');
                    throw (response);
                }

                console.error('TAF RESPONSE OK');
                return response.json();
            });
    }

    static getAtis(icao, source) {
        if (!icao) {
            throw ("No ICAO provided");
        }

        console.log('GET ATIS');
        return fetch(`${NXApi.url}/atis/${icao}?source=${source}`)
            .then((response) => {
                if (!response.ok) {
                    console.error('ATIS RESPONSE ERROR');
                    throw (response);
                }

                console.log('ATIS RESPONSE OK');
                return response.json();
            });
    }

    static connectTelex(flightNo) {
        // TELEX disabled
        if (NXDataStore.get("CONFIG_TELEX_STATUS", "DISABLED") !== "ENABLED") {
            return Promise.reject(NXApi.disabledError);
        }

        const connectBody = NXApi.buildTelexBody(flightNo);
        const headers = { "Content-Type": "application/json" };

        console.log("CONNECTING TO TELEX");
        return fetch(`${NXApi.url}/txcxn`, { method: "POST", body: JSON.stringify(connectBody), headers })
            .then((response) => {
                if (!response.ok) {
                    console.error("TELEX CONNECTION ERROR");
                    throw (response);
                }

                console.log("TELEX CONNECTION OK");
                const data = response.json();

                NXDataStore.set("TELEX_KEY", data.accessToken);
                NXDataStore.set("TELEX_FLIGHT_NUMBER", data.flight);

                return data;
            });
    }

    static updateTelex() {
        // TELEX disabled
        if (NXDataStore.get("CONFIG_TELEX_STATUS", "DISABLED") !== "ENABLED") {
            return Promise.reject(NXApi.disabledError);
        }

        // No connection
        if (!NXApi.hasTelexConnection()) {
            return Promise.reject(NXApi.disconnectedError);
        }

        const updateBody = NXApi.buildTelexBody();
        const headers = {
            "Content-Type": "application/json",
            Authorization: NXApi.buildToken()
        };

        console.log('UPDATING TELEX');
        return fetch(`${NXApi.url}/txcxn`, { method: "PUT", body: JSON.stringify(updateBody), headers })
            .then((response) => {
                if (!response.ok) {
                    console.error("TELEX UPDATE ERROR");
                    throw (response);
                }

                console.log("TELEX UPDATE OK");
                return response.json();
            });
    }

    static disconnectTelex() {
        // No connection
        if (!NXApi.hasTelexConnection()) {
            return Promise.reject(NXApi.disabledError);
        }

        const headers = {
            Authorization: NXApi.buildToken()
        };

        return fetch(`${NXApi.url}/txcxn`, { method: "DELETE", headers })
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                NXDataStore.delete("TELEX_KEY");
                NXDataStore.delete("TELEX_FLIGHT_NUMBER");

                return response.json();
            });
    }

    static getTelexMessages() {
        // TELEX disabled
        if (NXDataStore.get("CONFIG_TELEX_STATUS", "DISABLED") !== "ENABLED") {
            return Promise.reject(NXApi.disabledError);
        }

        // No connection
        if (!NXApi.hasTelexConnection()) {
            return Promise.reject(NXApi.disconnectedError);
        }

        const headers = {
            Authorization: NXApi.buildToken()
        };

        return fetch(`${NXApi.url}/txmsg`, { method: "GET", headers })
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                return response.json();
            });
    }

    static sendTelexMessage(recipient, message) {
        // TELEX disabled
        if (NXDataStore.get("CONFIG_TELEX_STATUS", "DISABLED") !== "ENABLED") {
            return Promise.reject(NXApi.disabledError);
        }

        // No connection
        if (!NXApi.hasTelexConnection()) {
            return Promise.reject(NXApi.disconnectedError);
        }

        // No recipient
        if (!recipient) {
            return Promise.reject(NXApi.noRecipientError);
        }

        const body = {
            to: recipient,
            message
        };
        const headers = {
            "Content-Type": "application/json",
            Authorization: NXApi.buildToken()
        };

        return fetch(`${NXApi.url}/txmsg`, {method: "POST", body: JSON.stringify(body), headers})
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }
            });
    }

    static hasTelexConnection() {
        const txKey = NXDataStore.get("TELEX_KEY", "");
        console.log("KEY." + txKey);

        const txFlight = NXDataStore.get("TELEX_FLIGHT_NUMBER", "");
        console.log("FLT." + txFlight);

        return txKey && txFlight;
    }

    static buildToken() {
        const txKey = NXDataStore.get("TELEX_KEY", "");
        return `Bearer ${txKey}`;
    }

    static buildTelexBody(flightNo) {
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        const alt = SimVar.GetSimVarValue("PLANE ALTITUDE", "feet");
        const heading = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");

        return {
            location: {
                x: long,
                y: lat,
            },
            trueAltitude: alt,
            heading: heading,
            origin: "",
            destination: "",
            flight: flightNo
        };
    }
}

NXApi.url = "https://fbw.stonelabs.io";
NXApi.disabledError = "TELEX DISABLED";
NXApi.disconnectedError = "TELEX DISCONNECTED";
NXApi.noRecipientError = "NO RECIPIENT";