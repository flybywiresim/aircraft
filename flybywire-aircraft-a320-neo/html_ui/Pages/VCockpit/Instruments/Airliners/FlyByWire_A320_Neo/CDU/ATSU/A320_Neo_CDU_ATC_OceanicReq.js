class CDUAtcOceanicReq {
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

    static ShowPage1(mcdu, oclComplete = false) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.ATCOceanicReq;

        if (mcdu.oclMessage === undefined) {
            mcdu.oclMessage = new Atsu.OclMessage();
        }

        let flightNo = "______[color]amber";
        let atcStation = "----[color]white";

        const entryTime = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.oclMessage.EntryTime,
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
                    mcdu.oclMessage.EntryTime = `${value}Z`;
                } else {
                    mcdu.oclMessage.EntryTime = value;
                }
                CDUAtcOceanicReq.ShowPage1(mcdu, oclComplete);
            });
        const entryPoint = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.oclMessage.EntryPoint,
            {
                clearable: true,
                emptyValue: "_______[color]amber",
                suffix: "[color]cyan",
                maxLength: 7
            },
            (value) => {
                if (value !== mcdu.oclMessage.EntryPoint) {
                    if (value !== "" && CDUAtcOceanicReq.WaypointOnRoute(mcdu, value)) {
                        mcdu.oclMessage.EntryTime = CDUAtcOceanicReq.CalculateEntryPointETA(mcdu, value);
                        if (mcdu.oclMessage.EntryTime !== '') {
                            entryTime.setValue(mcdu.oclMessage.EntryTime);
                        } else {
                            entryTime.clearValue();
                        }
                    } else {
                        mcdu.oclMessage.EntryTime = "";
                        entryTime.clearValue();
                    }

                    mcdu.oclMessage.EntryPoint = value;
                }
                CDUAtcOceanicReq.ShowPage1(mcdu, oclComplete);
            }
        );
        const requestedMach = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.oclMessage.RequestedMach,
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
                    mcdu.oclMessage.RequestedMach = value;
                } else {
                    mcdu.oclMessage.RequestedMach = `.${value}`;
                }
                CDUAtcOceanicReq.ShowPage1(mcdu, oclComplete);
            });
        const requestedFlightlevel = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.oclMessage.RequestedFlightlevel,
            {
                clearable: true,
                emptyValue: "_____[color]amber",
                suffix: "[color]cyan",
                maxLength: 5,
                isValid: ((value) => value.length >= 3 && value.length <= 5 && /^[0-9()]*$/.test(value))
            },
            (value) => {
                if (value !== mcdu.oclMessage.RequestedFlightlevel) {
                    if (value.length === 0) {
                        mcdu.oclMessage.RequestedFlightlevel = "";
                    } else if (value.length > 3) {
                        mcdu.oclMessage.RequestedFlightlevel = `FL${Math.floor(parseInt(value) / 100)}`;
                    } else {
                        mcdu.oclMessage.RequestedFlightlevel = `FL${value}`;
                    }
                }
                CDUAtcOceanicReq.ShowPage1(mcdu, oclComplete);
            });
        const freetext = new CDU_SingleValueField(mcdu,
            "string",
            mcdu.oclMessage.Freetext0,
            {
                clearable: 0 === mcdu.oclMessage.Freetext1.length,
                emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                suffix: "[color]white",
                maxLength: 22
            },
            (value) => {
                mcdu.oclMessage.Freetext0 = value;
                CDUAtcOceanicReq.ShowPage1(mcdu, oclComplete);
            }
        );

        // "1123" is the default ATC flight number
        if (SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC") !== "1123" && mcdu.flightPlanManager.getOrigin() !== null) {
            mcdu.oclMessage.Callsign = SimVar.GetSimVarValue("ATC FLIGHT NUMBER", "string", "FMC");
            flightNo = mcdu.oclMessage.Callsign + "[color]green";
        }

        if (mcdu.atsuManager.atc().currentStation() !== "") {
            atcStation = `${mcdu.atsuManager.atc().currentStation()}[color]cyan`;
        }

        // check if all required information are available to prepare the PDC message
        let reqDisplButton = "REQ DISPL\xa0[color]cyan";
        if (mcdu.oclMessage.Callsign !== "" && mcdu.atsuManager.atc().currentStation() !== "" && mcdu.oclMessage.EntryPoint !== "" && mcdu.oclMessage.EntryTime !== "" && mcdu.oclMessage.RequestedMach !== "" && mcdu.oclMessage.RequesteFlightlevel !== "") {
            reqDisplButton = "REQ DISPL*[color]cyan";
            oclComplete = true;
        } else {
            oclComplete = false;
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
            if (0 !== mcdu.oclMessage.Freetext0.length) {
                CDUAtcOceanicReq.ShowPage2(mcdu);
            } else {
                mcdu.addNewMessage(NXSystemMessages.mandatoryFields);
            }
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
            if (mcdu.atsuManager.atc().currentStation() === '') {
                mcdu.addNewMessage(NXFictionalMessages.noAtc);
                return;
            }

            if (!oclComplete) {
                mcdu.addNewMessage(NXSystemMessages.mandatoryFields);
                return;
            }

            // publish the message
            mcdu.atsuManager.registerMessage(mcdu.oclMessage);
            mcdu.oclMessage = undefined;

            CDUAtcOceanicReq.ShowPage1(mcdu, false);
        };
    }

    static ShowPage2(mcdu) {
        mcdu.clearDisplay();

        const addionalLineTemplate = [
            ["FREE TEXT"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["\xa0DEPART REQUEST"],
            ["<RETURN"]
        ];

        // find the first empty line
        let firstEmptyLineIndex = -1;
        if (0 === mcdu.oclMessage.Freetext5.length) {
            firstEmptyLineIndex = 4;
        }
        if (0 === mcdu.oclMessage.Freetext4.length) {
            firstEmptyLineIndex = 3;
        }
        if (0 === mcdu.oclMessage.Freetext3.length) {
            firstEmptyLineIndex = 2;
        }
        if (0 === mcdu.oclMessage.Freetext2.length) {
            firstEmptyLineIndex = 1;
        }
        if (0 === mcdu.oclMessage.Freetext1.length) {
            firstEmptyLineIndex = 0;
        }

        switch (firstEmptyLineIndex) {
            case -1:
            case 4:
                const line4 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.oclMessage.Freetext5,
                    {
                        clearable: 0 !== mcdu.oclMessage.Freetext5.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.oclMessage.Freetext5 = value;
                        CDUAtcOceanicReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[10] = [line4];
            case 3:
                const line3 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.oclMessage.Freetext4,
                    {
                        clearable: 0 === mcdu.oclMessage.Freetext5.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.oclMessage.Freetext4 = value;
                        CDUAtcOceanicReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[8] = [line3];
            case 2:
                const line2 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.oclMessage.Freetext3,
                    {
                        clearable: 0 === mcdu.oclMessage.Freetext4.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.oclMessage.Freetext3 = value;
                        CDUAtcOceanicReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[6] = [line2];
            case 1:
                const line1 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.oclMessage.Freetext2,
                    {
                        clearable: 0 === mcdu.oclMessage.Freetext3.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.oclMessage.Freetext2 = value;
                        CDUAtcOceanicReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[4] = [line1];
            default:
                const line0 = new CDU_SingleValueField(mcdu,
                    "string",
                    mcdu.oclMessage.Freetext1,
                    {
                        clearable: 0 === mcdu.oclMessage.Freetext2.length,
                        emptyValue: "[\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0\xa0][color]cyan",
                        suffix: "[color]white",
                        maxLength: 22
                    },
                    (value) => {
                        mcdu.oclMessage.Freetext1 = value;
                        CDUAtcOceanicReq.ShowPage2(mcdu);
                    }
                );
                addionalLineTemplate[2] = [line0];
                break;
        }

        // define the template
        mcdu.setTemplate(addionalLineTemplate);

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcOceanicReq.ShowPage1(mcdu);
        };
    }
}
