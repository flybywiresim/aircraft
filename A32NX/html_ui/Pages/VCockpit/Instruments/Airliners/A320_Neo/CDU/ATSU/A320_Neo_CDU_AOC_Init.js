class CDUAocMisc {
    static ShowPage(mcdu) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'ATSU';

        const store = mcdu.simbrief;

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
            ["", `${store["username"] != "" ? store["username"] : "[ ]"}[color]blue`],
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

        mcdu.onRightInput[0] = () => {
            const value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["username"] = "";
            } else {
                store["username"] = value;
            }
            CDUAocMisc.ShowPage(mcdu);
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
            if (!store["username"]) {
                showError("NO USERNAME");
                throw ("No simbrief username provided");
            }

            store["sendStatus"] = "REQUESTING";
            CDUAocMisc.ShowPage(mcdu);

            return fetch(`http://www.simbrief.com/api/xml.fetcher.php?username=${store["username"]}`)
                .then(response => response.text())
                .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
                .then(data => {
                    console.log('Got data from SimBrief');

                    store["route"] = data.getElementsByTagName("route")[0].childNodes[0].nodeValue;
                    store["cruiseAltitude"] = data.getElementsByTagName("initial_altitude")[0].childNodes[0].nodeValue;
                    store["originIcao"] = data.getElementsByTagName("icao_code")[0].childNodes[0].nodeValue;
                    store["destinationIcao"] = data.getElementsByTagName("icao_code")[1].childNodes[0].nodeValue;
                    store["block"] = data.getElementsByTagName("plan_ramp")[0].childNodes[0].nodeValue;
                    store["payload"] = data.getElementsByTagName("payload")[0].childNodes[0].nodeValue;
                    store["estZfw"] = data.getElementsByTagName("est_zfw")[0].childNodes[0].nodeValue;
                    store["costIndex"] = data.getElementsByTagName("costindex")[0].childNodes[0].nodeValue;
                    store["sendStatus"] = "DONE";

                    CDUAocMisc.ShowPage(mcdu);
                    setTimeout(() => {
                        store["sendStatus"] = "";
                        CDUAocMisc.ShowPage(mcdu);
                    }, 3000);
                })
                .catch(err => {
                    showError("ERROR");
                });
        }
    }
}