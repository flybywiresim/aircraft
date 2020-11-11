class CDUAocMisc {
    static ShowPage(mcdu, store = {
        username: "subcomandante",
        route: "",
        cruiseAltitude: "",
        originIcao: "",
        destinationIcao: "",
        block: ""
    }) {
        mcdu.clearDisplay();
        mcdu.activeSystem = 'ATSU';

        let fromTo = "____|____[color]red";
        let block = "___._[color]red";

        if (store["originIcao"] && store["destinationIcao"]) {
            fromTo = `${store["originIcao"]}/${store["destinationIcao"]}[color]blue`;
        }
        if (store["block"]) {
            block = `${(+store["block"] / 1000).toFixed(1)}[color]blue`;
        }

        const display = [
            ["ATSU MISC SIMBRIEF"],
            ["", "USERNAME"],
            ["", `${store["username"] != "" ? store["username"] : "[ ]"}[color]blue`],
            ["FROM/TO"],
            [fromTo],
            ["ROUTE"],
            [`${store["route"] != "" ? store["route"] : "-----"}`],
            ["CRZ FL"],
            [`${store["cruiseAltitude"] != "" ? store["cruiseAltitude"] : "-----"}`],
            ["BLOCK"],
            [block],
            [""],
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
            CDUAocMisc.ShowPage(mcdu, store);
        };

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        };

        function getSimbrief() {
            if (!store["username"]) {
                throw ("No simbrief username provided");
            }

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

                    console.log('route', store["route"]);
                    CDUAocMisc.ShowPage(mcdu, store);
                });
        }
    }
}