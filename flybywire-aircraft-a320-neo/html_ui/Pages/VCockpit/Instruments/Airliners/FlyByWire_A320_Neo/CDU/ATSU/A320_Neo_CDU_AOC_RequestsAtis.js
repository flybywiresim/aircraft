/*
 * A32NX
 * Copyright (C) 2020-2021 FlyByWire Simulations and its contributors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

class CDUAocRequestsAtis {
    static ShowPage(mcdu, store = {"reqID": 0, "formatID": 1, "arrIcao": "", "arpt1": "", "sendStatus": ""}) {
        mcdu.clearDisplay();
        let labelTimeout;
        let formatString;

        if (store.formatID === 0) {
            formatString = "PRINTER*[color]cyan";
        } else {
            formatString = "MCDU*[color]cyan";
        }

        let arrivalText = "{ARRIVAL[color]cyan";
        let departureText = "{DEPARTURE[color]cyan";
        let enrouteText = "ENROUTE}[color]cyan";

        if (mcdu.flightPlanManager.getOrigin() && mcdu.flightPlanManager.getDestination()) {
            store['arrIcao'] = mcdu.flightPlanManager.getDestination().ident;
        }

        if (store.reqID === 0) {
            arrivalText = "ARRIVAL[color]cyan";
        } else if (store.reqID === 1) {
            departureText = "DEPARTURE[color]cyan";
        } else {
            enrouteText = "ENROUTE[color]cyan";
        }

        let arrText;
        if (store.arpt1 !== "") {
            arrText = store.arpt1;
        } else if (store.arrIcao !== "") {
            arrText = store.arrIcao + "[s-text]";
        } else {
            arrText = "[ ]";
        }
        const updateView = () => {
            mcdu.setTemplate([
                ["AOC ATIS REQUEST"],
                ["AIRPORT", "↓FORMAT FOR"],
                [`${arrText}[color]cyan`, formatString],
                ["", "", "-------SELECT ONE-------"],
                [arrivalText, enrouteText],
                [""],
                [departureText],
                [""],
                ["{ARRIVAL/AUTO UPDATE[color]inop"],
                [""],
                ["{TERMINATE AUTO UPDATE[color]inop"],
                ["RETURN TO", `${store["sendStatus"]}`],
                ["<AOC MENU", "SEND*[color]cyan"]
            ]);
        };
        updateView();

        mcdu.leftInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[0] = (value) => {
            if (value === FMCMainDisplay.clrValue) {
                store["arpt1"] = "";
            } else {
                store["arpt1"] = value;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.leftInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[1] = () => {
            if (store.reqID !== 0) {
                store["reqID"] = 0;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.leftInputDelay[2] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[2] = () => {
            if (store.reqID !== 1) {
                store["reqID"] = 1;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            clearTimeout(labelTimeout);
            CDUAocMenu.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[0] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[0] = () => {
            store["formatID"] = (store.formatID + 1) % 2;
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.rightInputDelay[1] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[1] = () => {
            if (store.reqID !== 2) {
                store["reqID"] = 2;
            }
            CDUAocRequestsAtis.ShowPage(mcdu, store);
        };
        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = async () => {
            const icao = store["arpt1"] || store["arrIcao"];
            if (icao === "") {
                mcdu.addNewMessage(NXFictionalMessages.noAirportSpecified);
                return;
            }
            store["sendStatus"] = "QUEUED";
            updateView();

            const lines = [];
            const newMessage = { "id": Date.now(), "type": "ATIS", "time": '00:00', "opened": null, "content": lines, };
            mcdu.clearUserInput();

            getATIS(icao, lines, store.reqID, store, updateView).then(() => {
                store["sendStatus"] = "SENT";
                setTimeout(() => {
                    newMessage["time"] = fetchTimeValue();
                    // Messages go straight to the printer if FORMAT FOR PRINTER is selected.
                    if (store.formatID === 0) {
                        mcdu.printPage([lines.join(' ')]);
                    } else {
                        mcdu.addMessage(newMessage);
                    }
                }, Math.floor(Math.random() * 10000) + 10000);
                labelTimeout = setTimeout(() => {
                    store["sendStatus"] = "";
                    store["arpt1"] = "";
                    CDUAocRequestsAtis.ShowPage(mcdu, store);
                }, 3000);
            });
        };

    }
}
