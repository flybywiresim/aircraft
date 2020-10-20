class CDUAocRequestsWeather {
    static ShowPage(mcdu, store = { "reqType": 0, "depIcao": "", "arrIcao": "", "arpt1": "", "arpt2": "", "arpt3": "", "arpt4": "", "sendStatus": ""}) {
        mcdu.clearDisplay();
        let labelTimeout;

        let fplanArptColor = "[color]blue";
        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getDestination()) {
            store.arpt1 = mcdu.flightPlanManager.getOrigin().ident;
            store.arpt2 = mcdu.flightPlanManager.getDestination().ident;
            fplanArptColor = "[color]green";
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
                [`↓${reqTypes[0]}[color]blue`, `${store.arpt1 != "" ? store.arpt1 : "[ ]"}${fplanArptColor}`],
                [""],
                ["", `${store["arpt2"] != "" ? store["arpt2"] : "[ ]"}${fplanArptColor}`],
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
            if (value === FMCMainDisplay.clrValue) {
                store["arpt1"] = "";
            } else {
                store["arpt1"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        }

        mcdu.onRightInput[1] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["arpt2"] = "";
            } else {
                store["arpt2"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        }

        mcdu.onRightInput[2] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["arpt3"] = "";
            } else {
                store["arpt3"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        }

        mcdu.onRightInput[3] = () => {
            let value = mcdu.inOut;
            mcdu.clearUserInput();
            if (value === FMCMainDisplay.clrValue) {
                store["arpt4"] = "";
            } else {
                store["arpt4"] = value;
            }
            CDUAocRequestsWeather.ShowPage(mcdu, store);
        }

        mcdu.onRightInput[5] = async () => {
            store["sendStatus"] = "QUEUED"
            updateView();
            const ICAOS = [store["arpt1"], store["arpt2"], store["arpt3"], store["arpt4"]];
            mcdu.clearUserInput();
            const lines = []; // Prev Messages
            let errors = 0;
            const storedMetarSrc = GetStoredData("A32NX_CONFIG_METAR_SRC");
            let endpoint = "https://api.flybywiresim.com/metar";
            switch(storedMetarSrc) {
                case "VATSIM":
                    endpoint += "?source=vatsim&icao=";
                    break;
                case "PILOTEDGE":
                    endpoint += "?source=pilotedge&icao=";
                    break;
                case "IVAO":
                    endpoint += "?source=ivao&icao=";
                    break;
                default:
                    endpoint += "?source=ms&icao=";
            }
            const getData = async () => {
                for (const icao of ICAOS) {
                    if (icao !== "") {
                        await fetch(`${endpoint}${icao}`)
                                .then((response) => response.text())
                                .then((data) => {
                                    let error = data.slice(0, 9) == "FBW_ERROR";
                                    
                                    if (!error) {
                                        lines.push(`METAR ${icao}[color]blue`);

                                        function wordWrapToStringList(text, maxLength) {
                                            let result = [], line = [];
                                            let length = 0;
                                            text.split(" ").forEach(function (word) {
                                                if ((length + word.length) >= maxLength) {
                                                    result.push(line.join(" "));
                                                    line = []; length = 0;
                                                }
                                                length += word.length + 1;
                                                line.push(word);
                                            });
                                            if (line.length > 0) {
                                                result.push(line.join(" "));
                                            }
                                            return result;
                                        };
                                        
                                        const newLines = wordWrapToStringList(data, 25);
                                        newLines.forEach(l => lines.push(l.concat("[color]green")));
                                        lines.push('---------------------------[color]white');
                                    } else {
                                        lines.push(`METAR ${icao}[color]blue`);
                                        lines.push('STATION NOT AVAILABLE[color]red');
                                        lines.push('---------------------------[color]white');
                                        errors += 1;
                                    }
                                })
                    }
                }
                store["sendStatus"] = "SENT"
                updateView();
            }
            
            const newMessage = { "id": Date.now(), "type": "METAR", "time": '00:00', "opened": null, "content": errors > 0 ? ["ILLEGAL STATION IDENT"] : lines, }

            getData().then(() => {
                setTimeout(() => {
                    let timeValue = SimVar.GetGlobalVarValue("ZULU TIME", "seconds");
                    if (timeValue) {
                        const seconds = Number.parseInt(timeValue);
                        const displayTime = Utils.SecondsToDisplayTime(seconds, true, true, false);
                        timeValue = displayTime.toString();
                    }
                    newMessage["time"] = timeValue.substring(0, 5);
                    mcdu.addMessage(newMessage);
                }, Math.floor(Math.random() * 10000) + 10000);
                labelTimeout = setTimeout(() => {
                    store["sendStatus"] = "";
                    updateView();
                }, 3000);
            });
        }

        mcdu.onLeftInput[5] = () => {
            clearTimeout(labelTimeout);
            CDUAocMenu.ShowPage(mcdu);
        }
    }
}