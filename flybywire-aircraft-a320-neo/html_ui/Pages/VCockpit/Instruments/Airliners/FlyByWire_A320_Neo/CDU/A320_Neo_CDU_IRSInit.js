class CDUIRSInit {
    static ShowPage(mcdu, lon, originAirportLat, originAirportLon, referenceName, originAirportCoordinates, alignMsg = "ALIGN ON REF}[color]cyan") {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.IRSInit;
        mcdu.setTitle('IRS INIT');

        const adiru1State = SimVar.GetSimVarValue("L:A32NX_ADIRS_ADIRU_1_STATE", "Enum");
        const adiru2State = SimVar.GetSimVarValue("L:A32NX_ADIRS_ADIRU_2_STATE", "Enum");
        const adiru3State = SimVar.GetSimVarValue("L:A32NX_ADIRS_ADIRU_3_STATE", "Enum");
        const areAllAligned = adiru1State === 2 && adiru2State === 2 && adiru3State === 2;

        if (adiru1State === 0 || adiru2State === 0 || adiru3State === 0) {
            SimVar.SetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum", 0);
            alignMsg = "ALIGN ON REF}[color]cyan";
        }
        const emptyIRSGpsString = "--°--.--/---°--.--";
        const arrowupdwn = "↑↓";
        let larrowupdwn = arrowupdwn;
        let rarrowupdwn = "";
        if (lon) {
            rarrowupdwn = arrowupdwn;
            larrowupdwn = "";
        }
        let statusIRS1;
        let statusIRS2;
        let statusIRS3;
        let alignType = "---";
        // Ref coordinates are taken based on origin airport
        if (!originAirportLat && !originAirportLon) {
            const airportCoordinates = mcdu.flightPlanManager.getOrigin().infos.coordinates;
            originAirportLat = CDUInitPage.ConvertDDToDMS(airportCoordinates['lat'], false);
            originAirportLon = CDUInitPage.ConvertDDToDMS(airportCoordinates['long'], true);
            originAirportLat['sec'] = Math.ceil(Number(originAirportLat['sec'] / 100));
            originAirportLon['sec'] = Math.ceil(Number(originAirportLon['sec'] / 100));
            // Must be string for consistency since leading 0's are not allowed in Number
            originAirportLat['min'] = originAirportLat['min'].toString();
            originAirportLon['min'] = originAirportLon['min'].toString();
            referenceName = mcdu.flightPlanManager.getOrigin().ident + " [color]green";
            originAirportCoordinates = JSON.stringify(originAirportLat) + JSON.stringify(originAirportLon);
        }
        if (originAirportCoordinates === JSON.stringify(originAirportLat) + JSON.stringify(originAirportLon)) {
            referenceName = mcdu.flightPlanManager.getOrigin().ident + " [color]green";
        }
        const currentGPSLat = CDUInitPage.ConvertDDToDMS(SimVar.GetSimVarValue("GPS POSITION LAT", "degree latitude"), false);
        const currentGPSLon = CDUInitPage.ConvertDDToDMS(SimVar.GetSimVarValue("GPS POSITION LON", "degree longitude"), true);
        let GPSPosAlign;
        let originAirportTitle;
        let GPSPosTitle;
        let originAirportString;

        if (!areAllAligned) {
            GPSPosTitle = ["LAT", "LONG", "GPS POSITION"];
            originAirportTitle = ["LAT" + larrowupdwn , rarrowupdwn + "LONG", "REFERENCE"];
            GPSPosAlign = ["--°--.--", "--°--.--", " "];
            originAirportString = [originAirportLat['deg'] + "°{small}" + originAirportLat['min'] + "." + originAirportLat['sec'] + "{end}" + originAirportLat['dir'] + "[color]cyan", originAirportLon['deg'] + "°{small}" + originAirportLon['min'] + "." + originAirportLon['sec'] + "{end}" + originAirportLon['dir'] + "[color]cyan", referenceName];
            if (SimVar.GetSimVarValue("L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB", "Enum") || SimVar.GetSimVarValue("L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB", "Enum") || SimVar.GetSimVarValue("L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB", "Enum")) {
                GPSPosAlign = [currentGPSLat['deg'] + "°{small}" + currentGPSLat['min'] + "." + Math.ceil(Number(currentGPSLat['sec'] / 100)) + "{end}" + currentGPSLat['dir'] + '[color]green', currentGPSLon['deg'] + "°{small}" + currentGPSLon['min'] + "." + Math.ceil(Number(currentGPSLon['sec'] / 100)) + "{end}" + currentGPSLon['dir'] + "[color]green", ""];
                alignType = "GPS";
            }
        }

        let IRSAlignOnPos = currentGPSLat['deg'] + "°{small}" + currentGPSLat['min'] + "." + Math.ceil(Number(currentGPSLat['sec'] / 100)) + "{end}" + currentGPSLat['dir'] + "/" + currentGPSLon['deg'] + "°{small}" + currentGPSLon['min'] + "." + Math.ceil(Number(currentGPSLon['sec'] / 100)) + "{end}" + currentGPSLon['dir'];
        if (SimVar.GetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum") === 1) {
            alignMsg = "";
            alignType = "REF";
            if (!areAllAligned) {
                IRSAlignOnPos = originAirportLat['deg'] + "°{small}" + originAirportLat['min'] + "." + originAirportLat['sec'] + "{end}" + originAirportLat['dir'] + "/" + originAirportLon['deg'] + "°{small}" + originAirportLon['min'] + "." + originAirportLon['sec'] + "{end}" + originAirportLon['dir'];
            }
        }

        if (areAllAligned) {
            alignMsg = "";
            if (SimVar.GetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum") === 0) {
                alignType = "GPS";
            }
        }

        let IRS1GpsString = emptyIRSGpsString;
        if (SimVar.GetSimVarValue("L:A32NX_OVHD_ADIRS_IR_1_MODE_SELECTOR_KNOB", "Enum") === 1) {
            if (adiru1State === 2) {
                statusIRS1 = "IRS1 ALIGNED ON " + alignType;
            } else {
                statusIRS1 = "IRS1 ALIGNING ON " + alignType;
            }
            IRS1GpsString = IRSAlignOnPos + "[color]green";
        } else {
            statusIRS1 = "IRS1 OFF";
        }
        let IRS2GpsString = emptyIRSGpsString;
        if (SimVar.GetSimVarValue("L:A32NX_OVHD_ADIRS_IR_2_MODE_SELECTOR_KNOB", "Enum") === 1) {
            if (adiru2State === 2) {
                statusIRS2 = "IRS2 ALIGNED ON " + alignType;
            } else {
                statusIRS2 = "IRS2 ALIGNING ON " + alignType;
            }
            IRS2GpsString = IRSAlignOnPos + "[color]green";
        } else {
            statusIRS2 = "IRS2 OFF";
        }
        let IRS3GpsString = emptyIRSGpsString;
        if (SimVar.GetSimVarValue("L:A32NX_OVHD_ADIRS_IR_3_MODE_SELECTOR_KNOB", "Enum") === 1) {
            if (adiru3State === 2) {
                statusIRS3 = "IRS3 ALIGNED ON " + alignType;
            } else {
                statusIRS3 = "IRS3 ALIGNING ON " + alignType;
            }
            IRS3GpsString = IRSAlignOnPos + "[color]green";
        } else {
            statusIRS3 = "IRS3 OFF";
        }

        mcdu.setTemplate([
            ["IRS INIT"],
            originAirportTitle,
            originAirportString,
            GPSPosTitle,
            GPSPosAlign,
            ["", "", statusIRS1],
            ["", "", IRS1GpsString],
            ["", "", statusIRS2],
            ["", "", IRS2GpsString],
            ["", "", statusIRS3],
            ["", "", IRS3GpsString],
            [],
            ["<RETURN", alignMsg]
        ]);

        mcdu.onLeftInput[0] = () => {
            lon = false;
        };

        mcdu.onRightInput[0] = () => {
            lon = true;
        };

        mcdu.leftInputDelay[5] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onLeftInput[5] = () => {
            CDUInitPage.ShowPage1(mcdu);
        };

        mcdu.onRightInput[5] = () => {
            if (!areAllAligned) {
                if (alignMsg.includes("CONFIRM")) {
                    SimVar.SetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum", 1);
                } else {
                    alignMsg = "CONFIRM ALIGN* [color]amber";
                }
            }
        };

        mcdu.onUp = () => {
            if (!areAllAligned && SimVar.GetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum") !== 1) {
                referenceName = "----";
                let activeReference = originAirportLat;
                if (lon) {
                    activeReference = originAirportLon;
                }
                if (activeReference['deg'] >= 90 && !lon || activeReference['deg'] >= 180 && lon) {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                } else {
                    activeReference['sec'] = activeReference['sec'] + 1;
                    if (activeReference['sec'] >= 9) {
                        activeReference['min'] = (Number(activeReference['min']) + 1).toString().padStart(2, "0");
                        activeReference['sec'] = 0;
                    }
                    if (activeReference['min'] >= 60) {
                        activeReference['min'] = (0).toString().padStart(2, "0");
                        activeReference['deg'] = (!lon) ? activeReference['deg'] + 1 : (Number(activeReference['deg']) + 1).toString().padStart(3, "0");
                    }
                }
            }
        };

        mcdu.onDown = () => {
            if (!areAllAligned && SimVar.GetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum") !== 1) {
                referenceName = "----";
                let activeReference = originAirportLat;
                if (lon) {
                    activeReference = originAirportLon;
                }
                if (activeReference['deg'] <= -90 && !lon || activeReference['deg'] <= -180 && lon) {
                    mcdu.addNewMessage(NXSystemMessages.entryOutOfRange);
                } else {
                    activeReference['sec'] = activeReference['sec'] - 1;
                    if (activeReference['sec'] < 0) {
                        activeReference['min'] = (Number(activeReference['min']) - 1).toString().padStart(2, "0");
                        activeReference['sec'] = 9;
                    }
                    if (activeReference['min'] < 0) {
                        activeReference['min'] = 59;
                        activeReference['deg'] = (!lon) ? activeReference['deg'] - 1 : (Number(activeReference['deg']) - 1).toString().padStart(3, "0");
                    }
                }
            }
        };

        // This page auto-refreshes based on source material. Function will stop auto-refreshing when page has been changed.
        autoRefresh();
        function autoRefresh() {
            setTimeout(() => {
                if (mcdu.page.Current === mcdu.page.IRSInit) {
                    CDUIRSInit.ShowPage(mcdu, lon = lon,
                        originAirportLat = originAirportLat, originAirportLon = originAirportLon,
                        referenceName = referenceName, originAirportCoordinates = originAirportCoordinates,
                        alignMsg = alignMsg);
                }
            }, 1000);
        }

    }
}
