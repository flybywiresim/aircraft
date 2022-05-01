class CDUAtcPositionReport {
    static SecondsToString(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor(seconds / 60) % 60;
        return `${hours.toString().padStart(2, '0')}${minutes.toString().padStart(2, '0')}`;
    }

    static CreateDataBlock(mcdu, autoFill) {
        const retval = {
            passedWaypoint: [null, null, null],
            activeWaypoint: [null, null],
            nextWaypoint: null,
            currentPosition: null,
            currentUtc: null,
            currentAltitude: null,
            windDirection: null,
            windSpeed: null,
            sat: null,
            icing: null,
            turbulence: null,
            eta: null,
            endurance: null,
            indicatedAirspeed: null,
            groundSpeed: null,
            verticalSpeed: null,
            deviating: null,
            heading: null,
            track: null,
            descending: null,
            climbing: null,
        };

        if (autoFill === true) {
            const current = mcdu.atsu.currentFlightState();
            const target = mcdu.atsu.targetFlightState();
            const lastWp = mcdu.atsu.lastWaypoint();
            const activeWp = mcdu.atsu.activeWaypoint();
            const nextWp = mcdu.atsu.nextWaypoint();

            if (lastWp) {
                retval.passedWaypoint[0] = lastWp.ident;
                retval.passedWaypoint[1] = CDUAtcPositionReport.SecondsToString(lastWp.utc);
                retval.passedWaypoint[2] = lastWp.altitude;
            }

            retval.currentPosition = new LatLong(current.lat, current.lon).toShortDegreeString();
            retval.currentUtc = CDUAtcPositionReport.SecondsToString(SimVar.GetSimVarValue('E:ZULU TIME', 'seconds'));
            retval.currentAltitude = current.altitude;

            if (activeWp) {
                retval.activeWaypoint[0] = activeWp.ident;
                retval.activeWaypoint[1] = CDUAtcPositionReport.SecondsToString(activeWp.utc);
            }
            if (nextWp) {
                retval.nextWaypoint = nextWp.ident;
            }

            // TODO add wind
            // TODO add SAT
            // TODO add ETA

            retval.indicatedAirspeed = current.indicatedAirspeed;
            retval.groundSpeed = current.groundSpeed;
            retval.verticalSpeed = current.verticalSpeed;
            // TODO add deviating
            retval.heading = current.heading;
            retval.track = current.track;
            if (current.altitude > target.altitude) {
                retval.descending = target.altitude;
            } else if (current.altitude < target.altitude) {
                retval.climbing = target.altitude;
            }
        }

        return retval;
    }

    static CanEraseData(data) {
        return data.passedWaypoint[0] || data.passedWaypoint[1] || data.passedWaypoint[2] || data.activeWaypoint[0] || data.activeWaypoint[1] || data.nextWaypoint ||
            data.currentPosition || data.currentUtc || data.currentAltitude || data.windDirection || data.windSpeed || data.sat || data.icing || data.turbulence ||
            data.eta || data.endurance || data.indicatedAirspeed || data.groundSpeed || data.verticalSpeed || data.deviating || data.heading || data.track ||
            data.descending || data.climbing;
    }

    static CanSendData(data) {
        return data.currentPosition && data.currentUtc && data.currentAltitude;
    }

    static CreateReport(mcdu, data) {

    }

    static ShowPage1(mcdu, data = CDUAtcPositionReport.CreateDataBlock(mcdu, true)) {
        mcdu.clearDisplay();

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcReports.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        const overhead = ["[    ]", "[  ]", "[    ]"];
        if (data.passedWaypoint[0]) {
            overhead[0] = data.passedWaypoint[0];
        }
        if (data.passedWaypoint[1] && data.passedWaypoint[2]) {
            overhead[1] = data.passedWaypoint[1];
            overhead[2] = data.passedWaypoint[2];
        }

        const ppos = ["_______[color]amber", "____/______[color]amber"];
        if (data.currentPosition) {
            ppos[0] = `{cyan}${data.currentPosition}{end}`;
        }
        if (data.currentUtc && data.currentAltitude) {
            // TODO convert Altitude the FL if STD is used
            ppos[1] = `{cyan}${data.currentUtc}/${data.currentAltitude}{end}`;
        }

        const to = ["[    ]", "[  ]"];
        if (data.activeWaypoint[0]) {
            to[0] = data.activeWaypoint[0];
        }
        if (data.activeWaypoint[1]) {
            to[1] = data.activeWaypoint[1];
        }

        let next = "[    ]";
        if (data.nextWaypoint) {
            next = data.nextWaypoint;
        }

        mcdu.setTemplate([
            ["POSITION REPORT", "1", "3"],
            ["\xa0OVHD-----------UTC/ALT"],
            [`{cyan}${overhead[0]}{end}`, `{cyan}${overhead[1]}/${overhead[2]}`],
            ["\xa0PPOS-----------UTC/ALT"],
            [ppos[0], ppos[1]],
            ["\xa0TO-----------------UTC"],
            [`{cyan}${to[0]}{end}`, `{cyan}${to[1]}{end}`],
            ["\xa0NEXT"],
            [`{cyan}${next}{end}`],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC REPORTS", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcPositionReport.ShowPage(mcdu);
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcReports.ShowPage(mcdu, CDUAtcPositionReport.CreateDataBlock(mcdu, false));
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                CDUAtcTextFansA.ShowPage1(mcdu, [report]);
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                    mcdu.atsu.registerMessages([report]);
                    CDUAtcPositionReport.ShowPage(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcPositionReport.ShowPage3(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcPositionReport.ShowPage2(mcdu, data);
        };
    }

    static ShowPage2(mcdu, data = CDUAtcPositionReport.CreateDataBlock(mcdu, true)) {
        mcdu.clearDisplay();

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcReports.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["POSITION REPORT", "2", "3"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC REPORTS", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcPositionReport.ShowPage(mcdu, CDUAtcPositionReport.CreateDataBlock(mcdu, false));
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcReports.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                CDUAtcTextFansA.ShowPage1(mcdu, [report]);
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                    mcdu.atsu.registerMessages([report]);
                    CDUAtcPositionReport.ShowPage(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcPositionReport.ShowPage1(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcPositionReport.ShowPage3(mcdu, data);
        };
    }

    static ShowPage3(mcdu, data = CDUAtcPositionReport.CreateDataBlock(mcdu, true)) {
        mcdu.clearDisplay();

        let text = "ADD TEXT\xa0";
        let erase = "\xa0ERASE";
        let reqDisplay = "DCDU\xa0[color]cyan";
        if (CDUAtcReports.CanSendData(data)) {
            reqDisplay = "DCDU*[color]cyan";
            text = "ADD TEXT>";
            erase = "*ERASE";
        }

        mcdu.setTemplate([
            ["POSITION REPORT", "3", "3"],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            [""],
            ["\xa0ALL FIELDS"],
            [erase, text],
            ["\xa0ATC REPORTS", "XFR TO\xa0[color]cyan"],
            ["<RETURN", reqDisplay]
        ]);

        mcdu.leftInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[4] = () => {
            CDUAtcPositionReport.ShowPage(mcdu, CDUAtcPositionReport.CreateDataBlock(mcdu, false));
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onLeftInput[5] = () => {
            CDUAtcReports.ShowPage(mcdu);
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[4] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                CDUAtcTextFansA.ShowPage1(mcdu, [report]);
            }
        };

        mcdu.rightInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };
        mcdu.onRightInput[5] = () => {
            if (CDUAtcPositionReport.CanSendData(data)) {
                if (mcdu.atsu.atc.currentStation() === "") {
                    mcdu.setScratchpadMessage(NXSystemMessages.noAtc);
                } else {
                    const report = CDUAtcPositionReport.CreateReport(mcdu, data);
                    mcdu.atsu.registerMessages([report]);
                    CDUAtcPositionReport.ShowPage(mcdu);
                }
            }
        };

        mcdu.onPrevPage = () => {
            CDUAtcPositionReport.ShowPage2(mcdu, data);
        };
        mcdu.onNextPage = () => {
            CDUAtcPositionReport.ShowPage1(mcdu, data);
        };
    }
}
