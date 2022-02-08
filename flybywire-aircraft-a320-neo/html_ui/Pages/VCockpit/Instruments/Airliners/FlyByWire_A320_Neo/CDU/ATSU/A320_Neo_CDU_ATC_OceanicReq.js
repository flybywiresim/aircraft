class CDUAtcOceanicReq {
    static CreateDataBlock() {
        return {
            entryPoint: null,
            entryTime: null,
            requestedMach: null,
            requestedFlightlevel: null,
            freetext: [ '', '', '', '', '', '' ]
        };
    }

    static CanSendData(mcdu, data) {
        if (!SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") || SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC").length === 0) {
            return false;
        }
        if (!mcdu.flightPlanManager.getDestination() || mcdu.flightPlanManager.getDestination().ident === "") {
            return false;
        }
        return data.entryPoint && data.entryTime && data.requestedMach && data.requestedFlightlevel;
    }

    static CreateMessage(mcdu, data) {
        const retval = new Atsu.OclMessage();

        retval.Callsign = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC");
        retval.OceanicAtc = mcdu.atsuManager.atc.currentStation();
        retval.Destination = mcdu.flightPlanManager.getDestination().ident;
        retval.EntryPoint = data.entryPoint;
        retval.EntryTime = data.entryTime;
        retval.RequestedMach = data.requestedMach;
        retval.RequestedFlightlevel = data.requestedFlightlevel;
        retval.Freetext = data.freetext.filter((n) => n);

        return retval;
    }

    static WaypointOnRoute(mcdu, ident) {
        const totalWaypointsCount = mcdu.flightPlanManager.getWaypointsCount() + mcdu.flightPlanManager.getArrivalWaypointsCount() + mcdu.flightPlanManager.getApproachWaypoints().length;
        const wptsListIndex = mcdu.flightPlanManager.getActiveWaypointIndex();
        let i = 0;

        while (i < totalWaypointsCount && i + wptsListIndex < totalWaypointsCount) {
            const waypoint = mcdu.flightPlanManager.getWaypoint(i + wptsListIndex, NaN, true);

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
            lat: NaN,
            long: NaN
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
        mcdu.page.Current = mcdu.page.ATCOceanicReq;

        let flightNo = "______[color]amber";
        let atcStation = "----[color]white";

        const entryTime = new CDU_SingleValueField(mcdu,
            "string",
            store.entryTime,
            {
                clearable: true,
                emptyValue: "_____[color]amber",
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
                emptyValue: "_______[color]amber",
                suffix: "[color]cyan",
                maxLength: 7
            },
            (value) => {
                if (value !== store.entryPoint) {
                    if (value !== "" && CDUAtcOceanicReq.WaypointOnRoute(mcdu, value)) {
                        store.entryTime = CDUAtcOceanicReq.CalculateEntryPointETA(mcdu, value);
                        if (store.entryTime !== '') {
                            entryTime.setValue(store.entryTime);
                        } else {
                            entryTime.clearValue();
                        }
                    } else {
                        store.entryTime = "";
                        entryTime.clearValue();
                    }

                    store.entryPoint = value;
                }
                CDUAtcOceanicReq.ShowPage1(mcdu, store);
            }
        );
        const requestedMach = new CDU_SingleValueField(mcdu,
            "string",
            store.requestedMach,
            {
                clearable: true,
                emptyValue: "___[color]amber",
                suffix: "[color]cyan",
                maxLength: 3,
                isValid: ((value) => {
                    let valid = value.length === 3 && value[0] === "." && /^[0-9()]*$/.test(value.substring(1, value.length));
                    valid |= value.length === 2 && /^[0-9()]*$/.test(value);
                    return valid;
                })
            },
            (value) => {
                if (value[0] === ".") {
                    store.requestedMach = value;
                } else {
                    store.requestedMach = `.${value}`;
                }
                CDUAtcOceanicReq.ShowPage1(mcdu, store);
            });
        const requestedFlightlevel = new CDU_SingleValueField(mcdu,
            "string",
            store.requestedFlightlevel,
            {
                clearable: true,
                emptyValue: "_____[color]amber",
                suffix: "[color]cyan",
                maxLength: 5,
                isValid: ((value) => value.length >= 3 && value.length <= 5 && /^[0-9()]*$/.test(value))
            },
            (value) => {
                if (value !== store.requestedFlightlevel) {
                    if (value.length === 0) {
                        store.requestedFlightlevel = "";
                    } else if (value.length > 3) {
                        store.requestedFlightlevel = `FL${Math.floor(parseInt(value) / 100)}`;
                    } else {
                        store.requestedFlightlevel = `FL${value}`;
                    }
                }
                CDUAtcOceanicReq.ShowPage1(mcdu, store);
            });
        const freetext = new CDU_SingleValueField(mcdu,
            "string",
            store.freetext[0],
            {
                clearable: store.freetext[0].length !== 0,
                emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                suffix: "[color]white",
                maxLength: 22
            },
            (value) => {
                store.freetext[0] = value;
                CDUAtcOceanicReq.ShowPage1(mcdu, store);
            }
        );

        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC").length !== 0 && mcdu.flightPlanManager.getOrigin() !== null) {
            flightNo = `${SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC")}[color]green`;
        }

        if (mcdu.atsuManager.atc.currentStation() !== "") {
            atcStation = `${mcdu.atsuManager.atc.currentStation()}[color]cyan`;
        }

        // check if all required information are available to prepare the PDC message
        let reqDisplButton = "REQ DISPL\xa0[color]cyan";
        if (CDUAtcOceanicReq.CanSendData(mcdu, store)) {
            reqDisplButton = "REQ DISPL*[color]cyan";
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
            ["", "FREE TEXT>[color]white"],
            ["\xa0ATC MENU", "ATC OCEAN\xa0[color]cyan"],
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
            CDUAtcMenu.ShowPage2(mcdu);
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcOceanicReq.CanSendData(mcdu, store)) {
                mcdu.atsuManager.registerMessage(CDUAtcOceanicReq.CreateMessage(mcdu, store));
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
                    emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
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
