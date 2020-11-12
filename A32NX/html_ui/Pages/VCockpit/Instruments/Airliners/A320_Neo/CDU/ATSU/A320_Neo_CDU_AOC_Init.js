class CDUAocInit {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'ATSU';

        const store = mcdu.simbrief;

        const simbriefUsername = NXDataStore.get("CONFIG_SIMBRIEF_USERNAME", "");

        let fromTo = "----|----[color]white";
        let block = "---.-[color]white";
        let payload = "---.-[color]white";
        let estZfw = "---.-[color]white";
        let cruiseAltitude = "-----[color]white";
        let costIndex = "--[color]white";
        let fltNbr = '-----';

        if (store["originIcao"] && store["destinationIcao"]) {
            fromTo = `${store["originIcao"]}/${store["destinationIcao"]}[color]green`;
        }
        if (store["block"]) {
            block = `${(+store["block"] / 1000).toFixed(1)}[color]green`;
        }
        if (store["payload"]) {
            payload = `${(+store["payload"] / 1000).toFixed(1)}[color]green`;
        }
        if (store["estZfw"]) {
            estZfw = `${(+store["estZfw"] / 1000).toFixed(1)}[color]green`;
        }
        if (store["cruiseAltitude"]) {
            cruiseAltitude = `${store["cruiseAltitude"]}[color]green`;
        }
        if (store["costIndex"]) {
            costIndex = `${store["costIndex"]}[color]green`;
        }
        if (store["icao_airline"] && store["flight_number"]) {
            fltNbr = `${store.icao_airline}${store.flight_number}[color]green`;
        }

        const display = [
            ["AOC INIT DATA REQUEST"],
            ["SIMBRIEF USERNAME", ""],
            [ `${simbriefUsername != "" ? simbriefUsername : "-----"}[color]white`, store.navlog.length ? "ROUTE>" : "ROUTE>[color]inop"],
            ["FLT NBR", "FROM/TO"],
            [fltNbr, fromTo],
            ["BLOCK", "CRZ FL"],
            [block, cruiseAltitude],
            ["PAYLOAD", "CI"],
            [payload, costIndex],
            ["ZFW", ""],
            [estZfw, ""],
            ["RETURN TO", store["sendStatus"]],
            ["<AOC MENU", "REQUEST*[color]blue"]
        ];
        mcdu.setTemplate(display);

        mcdu.onRightInput[0] = () => {
            CDUAocInitRoute.ShowPage(mcdu);
        };

        mcdu.onRightInput[5] = () => {
            getSimbrief();
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        function showError(error) {
            store["sendStatus"] = error;

            CDUAocInit.ShowPage(mcdu);
            setTimeout(() => {
                store["sendStatus"] = "";
                CDUAocInit.ShowPage(mcdu);
            }, 3000);
        }

        function getSimbrief() {
            if (!simbriefUsername) {
                showError("NO USERNAME");
                throw ("No simbrief username provided");
            }

            store["sendStatus"] = "REQUESTING";
            CDUAocInit.ShowPage(mcdu);

            return fetch(`http://www.simbrief.com/api/xml.fetcher.php?username=${simbriefUsername}&json=1`)
                .then(response => response.json())
                .then(data => {
                    store["route"] = data.general.route;
                    store["cruiseAltitude"] = data.general.initial_altitude;
                    store["originIcao"] = data.origin.icao_code;
                    store["destinationIcao"] = data.destination.icao_code;
                    store["block"] = data.fuel.plan_ramp;
                    store["payload"] = data.weights.payload;
                    store["estZfw"] = data.weights.est_zfw;
                    store["costIndex"] = data.general.costindex;
                    store["navlog"] = data.navlog.fix;
                    store["icao_airline"] = data.general.icao_airline;
                    store["flight_number"] = data.general.flight_number;
                    store["sendStatus"] = "DONE";

                    CDUAocInit.ShowPage(mcdu);
                    setTimeout(() => {
                        store["sendStatus"] = "";
                        CDUAocInit.ShowPage(mcdu);
                    }, 3000);
                })
                .catch(_err => {
                    console.log(_err.message);
                    showError("ERROR");
                });
        }
    }
}
