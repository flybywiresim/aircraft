NXApi.url = "https://api.flybywiresim.com";
NXApi.telexNotEnabledError = "TELEX NOT ENABLED";
NXApi.noRecipientError = "NO RECIPIENT SET";

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
        // TELEX disabled
        if (NXDataStore.get("CONFIG_TELEX_STATUS", "DISABLED") !== "ENABLED") {
            throw (NXApi.telexNotEnabledError);
        }

        const connectBody = NXApi.buildTelexBody(flightNo);
        const headers = { "Content-Type": "application/json" };

        return fetch(`${NXApi.url}/txcxn`, { method: "POST", body: JSON.stringify(connectBody), headers })
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                const data = response.json();
                NXDataStore.set("TELEX_KEY", data["accessToken"]);
                NXDataStore.set("TELEX_FLIGHT_NUMBER", data["flight"]);

                return data;
            });
    }

    static updateTelex() {
        // TELEX disabled
        if (NXDataStore.get("CONFIG_TELEX_STATUS", "DISABLED") !== "ENABLED") {
            throw (NXApi.telexNotEnabledError);
        }

        const updateBody = NXApi.buildTelexBody();
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${NXDataStore.get("TELEX_KEY", "")}`
        };

        return fetch(`${NXApi.url}/txcxn`, { method: "PUT", body: JSON.stringify(updateBody), headers })
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                return response.json();
            });
    }

    static disconnectTelex() {
        const headers = {
            Authorization: `Bearer ${NXDataStore.get("TELEX_KEY", "")}`
        };

        return fetch(`${NXApi.url}/txcxn`, { method: "DELETE", headers })
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }

                const data = response.json();
                NXDataStore.delete("TELEX_KEY");
                NXDataStore.delete("TELEX_FLIGHT_NUMBER");

                return data;
            });
    }

    static getTelexMessages() {
        // TELEX disabled
        if (NXDataStore.get("CONFIG_TELEX_STATUS", "DISABLED") !== "ENABLED") {
            throw (NXApi.telexNotEnabledError);
        }

        const headers = {
            Authorization: `Bearer ${NXDataStore.get("TELEX_KEY", "")}`
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
        if (!recipient) {
            throw (NXApi.noRecipientError);
        }

        const body = {
            to: recipient,
            message
        };
        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${NXDataStore.get("TELEX_KEY", "")}`
        };

        return fetch(`${NXApi.url}/txmsg`, {method: "POST", body: JSON.stringify(body), headers})
            .then((response) => {
                if (!response.ok) {
                    throw (response);
                }
            });
    }

    static hasTelexConnection() {
        return NXDataStore.get("TELEX_KEY", "") && NXDataStore.get("TELEX_FLIGHT_NUMBER", "");
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