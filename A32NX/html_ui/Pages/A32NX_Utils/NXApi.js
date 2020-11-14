class NXApi {
    static getMetar(icao, source) {
        if (!icao) {
            throw ("No ICAO provided");
        }

        return fetch(`${NXApi.url}/metar/${icao}?source=${source}`)
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                return response.json();
            });
    }

    static getTaf(icao, source) {
        if (!icao) {
            throw ("No ICAO provided");
        }

        return fetch(`${NXApi.url}/taf/${icao}?source=${source}`)
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                return response.json();
            });
    }

    static getAtis(icao, source) {
        if (!icao) {
            throw ("No ICAO provided");
        }

        return fetch(`${NXApi.url}/atis/${icao}?source=${source}`)
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                return response.json();
            });
    }

    static connectTelex(flightNo) {
        const connectBody = NXApi.buildTelexBody(flightNo);
        const headers = {"Content-Type": "application/json"};

        return fetch(`${NXApi.url}/txcxn`, {method: "POST", body: JSON.stringify(connectBody), headers})
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                return response.json()
                    .then((data) => {
                        NXApi.accessToken = data.accessToken;
                        return data;
                    });
            });
    }

    static updateTelex() {
        // No connection
        if (!NXApi.hasTelexConnection()) {
            return Promise.reject(NXApi.disconnectedError);
        }

        const updateBody = NXApi.buildTelexBody();
        const headers = {
            "Content-Type": "application/json",
            Authorization: NXApi.buildToken()
        };

        return fetch(`${NXApi.url}/txcxn`, {method: "PUT", body: JSON.stringify(updateBody), headers})
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                return response.json();
            });
    }

    static disconnectTelex() {
        // No connection
        if (!NXApi.hasTelexConnection()) {
            return Promise.reject(NXApi.disconnectedError);
        }

        const headers = {
            Authorization: NXApi.buildToken()
        };

        return fetch(`${NXApi.url}/txcxn`, {method: "DELETE", headers})
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                NXApi.accessToken = "";
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

        return fetch(`${NXApi.url}/txmsg`, {method: "GET", headers})
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
        return !!NXApi.accessToken;
    }

    static buildToken() {
        return `Bearer ${NXApi.accessToken}`;
    }

    static buildTelexBody(flightNo) {
        const lat = SimVar.GetSimVarValue("PLANE LATITUDE", "degree latitude");
        const long = SimVar.GetSimVarValue("PLANE LONGITUDE", "degree longitude");
        const alt = SimVar.GetSimVarValue("PLANE ALTITUDE", "feet");
        const heading = SimVar.GetSimVarValue("PLANE HEADING DEGREES MAGNETIC", "degree");
        const freetext = NXDataStore.get("CONFIG_TELEX_STATUS", "DISABLED") === "ENABLED";

        return {
            location: {
                x: long,
                y: lat,
            },
            trueAltitude: alt,
            heading: heading,
            origin: "",
            destination: "",
            freetextEnabled: freetext,
            flight: flightNo,
        };
    }
}

NXApi.url = "https://api.flybywiresim.com";
NXApi.disabledError = "TELEX DISABLED";
NXApi.disconnectedError = "TELEX DISCONNECTED";
NXApi.noRecipientError = "NO RECIPIENT";
NXApi.accessToken = "";
