class CDUAocMisc {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'ATSU';

        const store = mcdu.simbrief;

        const simbriefUsername = NXDataStore.get("CONFIG_SIMBRIEF_USERNAME", "");

        let fromTo = "____|____[color]red";
        let block = "___._[color]red";
        let payload = "___._[color]red";
        let estZfw = "___._[color]red";

        if (store["originIcao"] && store["destinationIcao"]) {
            fromTo = `${store["originIcao"]}/${store["destinationIcao"]}[color]blue`;
        }
        if (store["block"]) {
            block = `${(+store["block"] / 1000).toFixed(1)}[color]blue`;
        }
        if (store["payload"]) {
            payload = `${(+store["payload"] / 1000).toFixed(1)}[color]blue`;
        }
        if (store["estZfw"]) {
            estZfw = `${(+store["estZfw"] / 1000).toFixed(1)}[color]blue`;
        }

        const display = [
            ["AOC INIT DATA REQUEST"],
            ["", "SIMBRIEF USERNAME"],
            ["", `${simbriefUsername != "" ? simbriefUsername : "[ ]"}[color]blue`],
            ["FROM/TO", "PAYLOAD"],
            [fromTo, payload],
            ["ROUTE"],
            [store["route"].substr(0, 24) || "[", !store["route"] && "]"],
            ["CRZ FL", "CI"],
            [store["cruiseAltitude"] || "-----", store["costIndex"] || "--"],
            ["BLOCK", "ZFW"],
            [block, estZfw],
            ["", store["sendStatus"]],
            ["<RETURN", "REQUEST*[color]blue"]
        ];
        mcdu.setTemplate(display);

        mcdu.onRightInput[5] = () => {
            getSimbrief();
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        function showError(error) {
            store["sendStatus"] = error;

            CDUAocMisc.ShowPage(mcdu);
            setTimeout(() => {
                store["sendStatus"] = "";
                CDUAocMisc.ShowPage(mcdu);
            }, 3000);
        }

        function getSimbrief() {
            if (!simbriefUsername) {
                showError("NO USERNAME");
                throw ("No simbrief username provided");
            }

            store["sendStatus"] = "REQUESTING";
            CDUAocMisc.ShowPage(mcdu);

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
                    store["sendStatus"] = "DONE";

                    CDUAocMisc.ShowPage(mcdu);
                    setTimeout(() => {
                        store["sendStatus"] = "";
                        CDUAocMisc.ShowPage(mcdu);
                    }, 3000);
                })
                .catch(_err => {
                    showError("ERROR");
                });
        }
    }
}