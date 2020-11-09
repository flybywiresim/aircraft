class CDUIRSInit {
    static ShowPage(mcdu, lon, originAirportLat, originAirportLon, referenceName, originAirportCoordinates, alignMsg = "ALIGN ON REF  }[color]blue") {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.IRSInit;
        mcdu.setTitle('IRS INIT');
        const checkAligned = SimVar.GetSimVarValue("L:A320_Neo_ADIRS_STATE", "Number");
        if (checkAligned === 0) {
            SimVar.SetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum", 0);
            alignMsg = "ALIGN ON REF }[color]blue";
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
        if (checkAligned !== 2) {
            GPSPosTitle = ["LAT", "LONG", "GPS POSITION"];
            originAirportTitle = ["LAT" + larrowupdwn , rarrowupdwn + "LONG", "REFERENCE"];
            GPSPosAlign = ["--°--.--", "--°--.--", " "];
            originAirportString = ['{IrsInitFont}' + originAirportLat['deg'] + '°{IrsInitFontEnd}' + originAirportLat['min'] + '.' + originAirportLat['sec'] + '[s-text]{IrsInitFont}' + originAirportLat['dir'] + "{IrsInitFontEnd} [color]blue", '{IrsInitFont}' + originAirportLon['deg'] + '°{IrsInitFontEnd}' + originAirportLon['min'] + '.' + originAirportLon['sec'] + '[s-text]{IrsInitFont}' + originAirportLon['dir'] + "{IrsInitFontEnd} [color]blue", referenceName];
            if (SimVar.GetSimVarValue("L:A32NX_ADIRS_KNOB_1", "Enum") || SimVar.GetSimVarValue("L:A32NX_ADIRS_KNOB_2", "Enum") || SimVar.GetSimVarValue("L:A32NX_ADIRS_KNOB_3", "Enum")) {
                GPSPosAlign = ['{IrsInitFont}' + currentGPSLat['deg'] + '°{IrsInitFontEnd}' + currentGPSLat['min'] + '.' + Math.ceil(Number(currentGPSLat['sec'] / 100)) + '[s-text]{IrsInitFont}' + currentGPSLat['dir'] + "{IrsInitFontEnd} [color]green", '{IrsInitFont}' + currentGPSLon['deg'] + '°{IrsInitFontEnd}' + currentGPSLon['min'] + '.' + Math.ceil(Number(currentGPSLon['sec'] / 100)) + '[s-text]{IrsInitFont}' + currentGPSLon['dir'] + "{IrsInitFontEnd} [color]green", ""];
                alignType = "GPS";
            }
        }

        let IRSAlignOnPos = "{IrsInitFont}" + currentGPSLat['deg'] + '°{IrsInitFontEnd}' + currentGPSLat['min'] + '.' + Math.ceil(Number(currentGPSLat['sec'] / 100)) + '[s-text]{IrsInitFont}' + currentGPSLat['dir'] + '/{IrsInitFontEnd}{IrsInitFont}' + currentGPSLon['deg'] + '°{IrsInitFontEnd}' + currentGPSLon['min'] + '.' + Math.ceil(Number(currentGPSLon['sec'] / 100)) + '{IrsInitFont}' + currentGPSLon['dir'] + '{IrsInitFontEnd}';
        if (SimVar.GetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum") === 1) {
            alignMsg = "";
            alignType = "REF";
            if (checkAligned !== 2) {
                IRSAlignOnPos = "{IrsInitFont}" + originAirportLat['deg'] + '°{IrsInitFontEnd}' + originAirportLat['min'] + '.' + originAirportLat['sec'] + '[s-text]{IrsInitFont}' + originAirportLat['dir'] + '/{IrsInitFontEnd}{IrsInitFont}' + originAirportLon['deg'] + '°{IrsInitFontEnd}' + originAirportLon['min'] + '.' + originAirportLon['sec'] + '{IrsInitFont}' + originAirportLon['dir'] + '{IrsInitFontEnd}';
            }
        }

        if (checkAligned === 2) {
            alignMsg = "";
            if (SimVar.GetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum") === 0) {
                alignType = "GPS";
            }
        }

        let IRS1GpsString = emptyIRSGpsString;
        if (SimVar.GetSimVarValue("L:A32NX_ADIRS_KNOB_1", "Enum") === 1) {
            if (checkAligned === 2) {
                statusIRS1 = "IRS1 ALIGNED ON " + alignType;
            } else {
                statusIRS1 = "IRS1 ALIGNING ON " + alignType;
            }
            IRS1GpsString = IRSAlignOnPos + "[color]green";
        } else {
            statusIRS1 = "IRS1 OFF";
        }
        let IRS2GpsString = emptyIRSGpsString;
        if (SimVar.GetSimVarValue("L:A32NX_ADIRS_KNOB_2", "Enum") === 1) {
            if (checkAligned === 2) {
                statusIRS2 = "IRS2 ALIGNED ON " + alignType;
            } else {
                statusIRS2 = "IRS2 ALIGNING ON " + alignType;
            }
            IRS2GpsString = IRSAlignOnPos + "[color]green";
        } else {
            statusIRS2 = "IRS2 OFF";
        }
        let IRS3GpsString = emptyIRSGpsString;
        if (SimVar.GetSimVarValue("L:A32NX_ADIRS_KNOB_3", "Enum") === 1) {
            if (checkAligned === 2) {
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

        // IRS Font is different we loop over keywords to set correct font since at the moment we cannot adapt FMCMainDisplay.js to allow for extra keywords
        mcdu._lineElements.forEach(function (ele) {
            ele.forEach(function (el) {
                if (el != null) {
                    let newHtml = el;
                    if (newHtml != null) {
                        newHtml = newHtml.innerHTML.replace(/{IrsInitFont}/g, '<span class=\'irs-text\'>');
                        newHtml = newHtml.replace(/{IrsInitFontEnd}/g, '</span>');
                        el.innerHTML = newHtml;
                    }
                }
            });
        });

        mcdu.onLeftInput[0] = () => {
            lon = false;
        };

        mcdu.onRightInput[0] = () => {
            lon = true;
        };

        mcdu.onLeftInput[5] = () => {
            CDUInitPage.ShowPage1(mcdu);
        };

        mcdu.onRightInput[5] = () => {
            if (checkAligned !== 2) {
                if (alignMsg.includes("CONFIRM")) {
                    SimVar.SetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum", 1);
                } else {
                    alignMsg = "CONFIRM ALIGN* [color]red";
                }
            }
        };

        mcdu.onUp = () => {
            if (checkAligned !== 2 && SimVar.GetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum") !== 1) {
                referenceName = "----";
                let activeReference = originAirportLat;
                if (lon) {
                    activeReference = originAirportLon;
                }
                if (activeReference['deg'] >= 90 && !lon || activeReference['deg'] >= 180 && lon) {
                    mcdu.showErrorMessage("INVALID ENTRY");
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
            if (checkAligned !== 2 && SimVar.GetSimVarValue("L:A32XN_Neo_ADIRS_ALIGN_TYPE_REF", "Enum") !== 1) {
                referenceName = "----";
                let activeReference = originAirportLat;
                if (lon) {
                    activeReference = originAirportLon;
                }
                if (activeReference['deg'] <= -90 && !lon || activeReference['deg'] <= -180 && lon) {
                    mcdu.showErrorMessage("INVALID ENTRY");
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
                if (mcdu.getTitle() === 'IRS INIT') {
                    CDUIRSInit.ShowPage(mcdu, lon = lon,
                        originAirportLat = originAirportLat, originAirportLon = originAirportLon,
                        referenceName = referenceName, originAirportCoordinates = originAirportCoordinates,
                        alignMsg = alignMsg);
                }
            }, 1000);
        }

    }
}