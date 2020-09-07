class CDUAocRequestsWeather {
    static ShowPage(mcdu, store = { "reqType": 0, "depIcao": "", "arrIcao": "", "arpt1": "", "arpt2": "", "arpt3": "", "arpt4": "", "sendStatus": ""}) {
        mcdu.clearDisplay();

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getDestination()) {
            store.arpt1 = mcdu.flightPlanManager.getOrigin().ident;
            store.arpt2 = mcdu.flightPlanManager.getDestination().ident;
        }

        const reqTypes = [
            'METAR',
            'TAF LONG',
            'SIGMET',
            'METAR + TAF'
        ];

        const updateView = () => {
            mcdu.setTemplate([
                ["AOC WEATHER REQUEST"],
                [`WX TYPE`, "AIRPORTS"],
                [`↓${reqTypes[0]}`, `${store.arpt1 != "" ? store.arpt1 : "[ ]"}[color]blue`],
                [""],
                ["", `${store["arpt2"] != "" ? store["arpt2"] : "[ ]"}[color]blue`],
                [""],
                ["", `${store["arpt3"] != "" ? store["arpt3"] : "[ ]"}[color]blue`],
                [""],
                ["", `${store["arpt4"] != "" ? store["arpt4"] : "[ ]"}[color]blue`],
                [""],
                [""],
                ["RETURN TO", `${store["sendStatus"]}`],
                ["<AOC MENU", "SEND*[color]blue"]
            ]);
        }
        updateView();

        mcdu.onRightInput[0] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            store["arpt1"] = value;
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        }

        mcdu.onRightInput[1] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            store["arpt2"] = value;
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        }

        mcdu.onRightInput[2] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            store["arpt3"] = value;
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        }

        mcdu.onRightInput[3] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            store["arpt3"] = value;
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        }

        mcdu.onRightInput[5] = async () => {
            const setSpace = (spaces) => {
                let space = "";
                for (let counter = 0; counter <= spaces; counter++) {
                      space+= " ";
                }
                return space;
            }

            store["sendStatus"] = "QUEUED"
            updateView();
            const ICAOS = [store["arpt1"], store["arpt2"], store["arpt3"]];
            mcdu.clearUserInput();
            const lines = []; // Prev Messages
            const getData = async () => {
                for (const icao of ICAOS) {
                    if (icao !== "") {
                        await fetch(`https://cors-anywhere.herokuapp.com/https://aviationweather.gov/adds/dataserver_current/httpparam?dataSource=metars&requestType=retrieve&format=xml&hoursBeforeNow=3&mostRecent=true&stationString=${icao}`)
                            .then(response => response.text())
                            .then(str => (new window.DOMParser()).parseFromString(str, "text/xml"))
                            .then((data) => {
                                const message = data.childNodes[0].childNodes[13].childNodes[1].childNodes[1].innerHTML.match(/(.*?\s){2}/g);
                                lines.push(`METAR ${message[0]}`);
                                let LineNumberBaseRatio = 1; // 3
                                const totalLines = Math.ceil(message.length - 1 / 3)
                                for (let LineCount = 0; LineCount <= totalLines; LineCount++) {
                                    const count = 3 * LineNumberBaseRatio;
                                    if (message[count - 2]) {
                                        lines.push(`${message[count - 2]}${message[count - 1] ? message[count - 1] : setSpace(12)}${message[count] ? message[count] : setSpace(8)}`)
                                    }
                                    
                                    LineNumberBaseRatio += 1;
                                }
                                lines.push(" ");
                            })
                    }
                }
                store["sendStatus"] = "SENT"
                updateView();
            }

            const newMessage = { "id": Date.now(), "type": "METAR", "time": '00:00', "opened": null, "content": lines, }

            getData().then(() => {
                setTimeout(() => {
                    newMessage["content"] = lines;
                    let timeValue = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
                    if (timeValue) {
                        const seconds = Number.parseInt(timeValue);
                        const displayTime = Utils.SecondsToDisplayTime(seconds, true, true, false);
                        timeValue = displayTime.toString();
                    }
                    newMessage["time"] = timeValue.substring(0, 5);
                    mcdu.messages.push(newMessage);
                    store["sendStatus"] = "";
                    updateView();
                }, 1000);
            });
        }

        mcdu.onLeftInput[5] = () => {
            CDUAocMenu.ShowPage(mcdu);
        }
    }
}