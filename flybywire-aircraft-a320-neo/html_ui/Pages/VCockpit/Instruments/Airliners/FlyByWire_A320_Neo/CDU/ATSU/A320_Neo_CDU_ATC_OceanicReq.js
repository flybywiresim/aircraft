class CDUAtcOceanicReq {
    static CreateDataBlock() {
        return {
            firstCall: true,
            callsign: null,
            entryPoint: null,
            entryTime: null,
            requestedMach: null,
            requestedFlightlevel: null,
            freetext: [ '', '', '', '', '', '' ]
        };
    }

    static CanSendData(mcdu, data) {
        if (!data.callsign) {
            return false;
        }
        if (!mcdu.flightPlanManager.getDestination() || mcdu.flightPlanManager.getDestination().ident === "") {
            return false;
        }
        if (mcdu.atsu.atc.currentStation() === "") {
            return false;
        }
        return data.entryPoint && data.entryTime && data.requestedMach && data.requestedFlightlevel;
    }

    static CreateMessage(mcdu, data) {
        const retval = new Atsu.OclMessage();

        retval.Callsign = data.callsign;
        retval.Destination = mcdu.flightPlanManager.getDestination().ident;
        retval.EntryPoint = data.entryPoint;
        retval.EntryTime = data.entryTime;
        retval.RequestedMach = data.requestedMach;
        retval.RequestedFlightlevel = data.requestedFlightlevel;
        retval.Freetext = data.freetext.filter((n) => n);
        retval.Station = mcdu.atsu.atc.currentStation();

        return retval;
    }

    static WaypointOnRoute(mcdu, ident) {
        const totalWaypointsCount = mcdu.flightPlanManager.getWaypointsCount() + mcdu.flightPlanManager.getArrivalWaypointsCount() + mcdu.flightPlanManager.getApproachWaypoints().length;
        const wptsListIndex = mcdu.flightPlanManager.getActiveWaypointIndex();
        let i = 0;

        while (i < totalWaypointsCount && i + wptsListIndex < totalWaypointsCount) {
            const waypoint = mcdu.flightPlanManager.getWaypoint(i + wptsListIndex, undefined, true);

            if (waypoint && !waypoint.isVectors && waypoint.ident === ident) {
                return true;
            }

            i++;
        }

        return false;
    }

    static CalculateEntryPointETA(mcdu, ident) {
        const adirLat = ADIRS.getLatitude();
        const adirLong = ADIRS.getLongitude();
        const ppos = (adirLat.isNormalOperation() && adirLong.isNormalOperation()) ? {
            lat: ADIRS.getLatitude().value,
            long: ADIRS.getLongitude().value,
        } : {
            lat: undefined,
            long: undefined
        };

        let retval = "";
        const stats = mcdu.flightPlanManager.getCurrentFlightPlan().computeWaypointStatistics(ppos);
        stats.forEach((value) => {
            if (value.ident === ident && retval === "") {
                const eta = value.etaFromPpos;
                const hours = Math.floor(eta / 3600);
                const minutes = Math.floor(eta / 60) % 60;
                retval = `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}Z`;
            }
        });

        return retval;
    }

    static ShowPage1(mcdu, store = CDUAtcOceanicReq.CreateDataBlock()) {
        mcdu.clearDisplay();

        let flightNo = "{white}-------{end}";
        let atcStation = "{white}----{end}";

        const entryTime = new CDU_SingleValueField(mcdu,
            "string",
            store.entryTime,
            {
                clearable: true,
                emptyValue: "{amber}_____{end}",
                suffix: "[color]cyan",
                maxLength: 5,
                isValid: ((value) => {
                    if (value.length !== 4 && value.length !== 5) {
                        return false;
                    }

                    let check = value;
                    if (value.length === 5) {
                        if (value[4] !== "Z") {
                            return false;
                        }
                        check = value.substring(0, 4);
                    }
                    if (!/^[0-9()]*$/.test(check)) {
                        return false;
                    }

                    const asInt = parseInt(check);
                    return asInt <= 2359 && asInt >= 0;
                })
            },
            (value) => {
                if (value.length === 4) {
                    store.entryTime = `${value}Z`;
                } else {
                    store.entryTime = value;
                }
                CDUAtcOceanicReq.ShowPage1(mcdu, store);
            });
        const entryPoint = new CDU_SingleValueField(mcdu,
            "string",
            store.entryPoint,
            {
                clearable: true,
                emptyValue: "{amber}_______{end}",
                suffix: "[color]cyan"
            },
            (value) => {
                mcdu.waypointType(mcdu, value).then((type) => {
                    if (type[0] === -1) {
                        mcdu.setScratchpadMessage(type[1]);
                    } else if (type[0] === 1) {
                        mcdu.setScratchpadMessage(NXSystemMessages.formatError);
                    } else {
                        store.entryPoint = value;
                        if (CDUAtcOceanicReq.WaypointOnRoute(mcdu, value)) {
                            store.entryTime = CDUAtcOceanicReq.CalculateEntryPointETA(mcdu, value);
                            if (store.entryTime !== "") {
                                entryTime.setValue(store.entryTime);
                            } else {
                                entryTime.clearValue();
                            }
                        } else {
                            store.entryTime = "";
                            entryTime.clearValue();
                        }
                    }

                    CDUAtcOceanicReq.ShowPage1(mcdu, store);
                });
            }
        );
        const requestedMach = new CDU_SingleValueField(mcdu,
            "string",
            store.requestedMach,
            {
                clearable: true,
                emptyValue: "{amber}___{end}",
                suffix: "[color]cyan",
                maxLength: 3,
                isValid: ((value) => {
                    if (value && /^M*.[0-9]{1,2}$/.test(value)) {
                        const split = value.split('.');
                        let number = parseInt(split.length > 0 && split[1]);
                        if (number < 10) {
                            number *= 10;
                        }
                        return number >= 61 && number <= 92;
                    }
                    return false;
                })
            },
            (value) => {
                if (value) {
                    const split = value.split('.');
                    let number = parseInt(split.length > 0 && split[1]);
                    if (number < 10) {
                        number *= 10;
                    }
                    store.requestedMach = `M.${number}`;
                    CDUAtcOceanicReq.ShowPage1(mcdu, store);
                }
            });
        const requestedFlightlevel = new CDU_SingleValueField(mcdu,
            "string",
            store.requestedFlightlevel,
            {
                clearable: true,
                emptyValue: "{amber}_____{end}",
                suffix: "[color]cyan",
                maxLength: 5,
                isValid: ((value) => {
                    if (/^(FL)*[0-9]{2,3}$/.test(value)) {
                        let level = 0;
                        if (value.startsWith("FL")) {
                            level = parseInt(value.substring(2, value.length));
                        } else {
                            level = parseInt(value);
                        }
                        return level >= 30 && level <= 410;
                    }
                    return false;
                })
            },
            (value) => {
                if (value.startsWith("FL")) {
                    store.requestedFlightlevel = value;
                } else {
                    const zeroPad = (str, places) => str.padStart(places, '0');
                    store.requestedFlightlevel = `FL${zeroPad(value, 3)}`;
                }
                CDUAtcOceanicReq.ShowPage1(mcdu, store);
            });
        const freetext = new CDU_SingleValueField(mcdu,
            "string",
            store.freetext[0],
            {
                clearable: store.freetext[0].length !== 0,
                emptyValue: "{cyan}[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0]{end}",
                suffix: "[color]white",
                maxLength: 22
            },
            (value) => {
                store.freetext[0] = value;
                CDUAtcOceanicReq.ShowPage1(mcdu, store);
            }
        );

        if (store.firstCall && !store.callsign) {
            if (mcdu.atsu.flightNumber().length !== 0) {
                store.callsign = mcdu.atsu.flightNumber();
            }
        }
        store.firstCall = false;

        if (store.callsign) {
            flightNo = `{green}${store.callsign}{end}`;
        }
        if (mcdu.atsu.atc.currentStation() !== "") {
            atcStation = `{cyan}${mcdu.atsu.atc.currentStation()}{end}`;
        }

        // check if all required information are available to prepare the PDC message
        let reqDisplButton = "{cyan}DCDU\xa0{end}";
        if (CDUAtcOceanicReq.CanSendData(mcdu, store)) {
            reqDisplButton = "{cyan}DCDU*{end}";
        }

        mcdu.setTemplate([
            ["OCEANIC REQ"],
            ["\xa0ATC FLT NBR", "OCEAN ATC\xa0"],
            [flightNo, atcStation],
            ["\xa0ENTRY-POINT", "AT TIME\xa0"],
            [entryPoint, entryTime],
            ["\xa0REQ MACH", "REQ FL\xa0"],
            [requestedMach, requestedFlightlevel],
            ["---------FREE TEXT---------"],
            [freetext],
            ["", "MORE\xa0"],
            ["", "FREE TEXT>"],
            ["\xa0FLIGHT REQ", "{cyan}XFR TO\xa0{end}"],
            ["<RETURN", reqDisplButton]
        ]);

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            CDUAtcOceanicReq.ShowPage2(mcdu, store);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcFlightReq.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcOceanicReq.CanSendData(mcdu, store)) {
                mcdu.atsu.registerMessages([CDUAtcOceanicReq.CreateMessage(mcdu, store)]);
                CDUAtcOceanicReq.ShowPage1(mcdu);
            }
        };
    }

    static ShowPage2(mcdu, store) {
        mcdu.clearDisplay();

        const freetextLines = [];
        for (let i = 0; i < 5; ++i) {
            freetextLines.push(new CDU_SingleValueField(mcdu,
                "string",
                store.freetext[i + 1],
                {
                    clearable: store.freetext[i + 1].length !== 0,
                    emptyValue: "{cyan}[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0]{end}",
                    suffix: "[color]white",
                    maxLength: 22
                },
                (value) => {
                    store.freetext[i + 1] = value;
                    CDUAtcOceanicReq.ShowPage2(mcdu, store);
                }
            ));
        }

        // define the template
        mcdu.setTemplate([
            ["FREE TEXT"],
            [""],
            [freetextLines[0]],
            [""],
            [freetextLines[1]],
            [""],
            [freetextLines[2]],
            [""],
            [freetextLines[3]],
            [""],
            [freetextLines[4]],
            ["\xa0OCEANIC REQ"],
            ["<RETURN"]
        ]);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcOceanicReq.ShowPage1(mcdu, store);
        };
    }
}
