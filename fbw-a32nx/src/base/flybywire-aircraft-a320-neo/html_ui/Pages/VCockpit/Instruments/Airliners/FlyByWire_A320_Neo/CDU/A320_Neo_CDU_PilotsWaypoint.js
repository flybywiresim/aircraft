class CDUPilotsWaypoint {
    static ShowPage(mcdu, index = 0, confirmDeleteAll = false) {
        if (mcdu.dataManager.numberOfStoredWaypoints() < 1) {
            return CDUNewWaypoint.ShowPage(mcdu, () => CDUDataIndexPage.ShowPage2(mcdu));
        }
        if (mcdu.dataManager.storedWaypoints[index] === undefined) {
            index = mcdu.dataManager.prevStoredWaypointIndex(index);
        }
        const number = mcdu.dataManager.storedWaypointNumber(index);

        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.PilotsWaypoint;

        const template = [
            [`STORED WAYPOINT\xa0{small}${number}/99{end}\xa0`],
            ['\xa0IDENT'],
            [''],
            ['\xa0\xa0\xa0\xa0LAT/LONG'],
            [''],
            [''],
            [''],
            [''],
            [''],
            ['', 'NEW\xa0'],
            ['', 'WAYPOINT>'],
            ['', confirmDeleteAll ? '{amber}CONFIRM\xa0{end}' : ''],
            ['', `{${confirmDeleteAll ? 'amber' : 'cyan'}}DELETE ALL${confirmDeleteAll ? '*' : '}'}{end}`]
        ];

        const storedWp = mcdu.dataManager.storedWaypoints[index];
        if (storedWp !== undefined) {
            template[2][0] = `{green}${storedWp.waypoint.ident}{end}`;

            switch (storedWp.type) {
                case StoredWaypointType.LatLon:
                    template[4][0] = `{green}${CDUPilotsWaypoint.formatLatLong(storedWp.waypoint.location)}{end}`;
                    break;
                case StoredWaypointType.Pbd:
                    template[4][0] = `{green}{small}${CDUPilotsWaypoint.formatLatLong(storedWp.waypoint.location)}{end}{end}`;
                    template[5][0] = 'PLACE\xa0\xa0/BRG\xa0/DIST';
                    template[6][0] = `{green}${storedWp.pbdPlace.padEnd(7, '\xa0')}/${CDUPilotsWaypoint.formatBearing(storedWp.pbdBearing)}/${storedWp.pbdDistance.toFixed(1)}{end}`;
                    break;
                case StoredWaypointType.Pbx:
                    template[4][0] = `{green}{small}${CDUPilotsWaypoint.formatLatLong(storedWp.waypoint.location)}{end}{end}`;
                    template[7][0] = 'PLACE-BRG\xa0\xa0/PLACE-BRG';
                    template[8][0] = `{green}${storedWp.pbxPlace1.substr(0, 5).padStart(5, '\xa0')}-${CDUPilotsWaypoint.formatBearing(storedWp.pbxBearing1)}\xa0/${storedWp.pbxPlace2.substr(0, 5).padStart(5, '\xa0')}-${CDUPilotsWaypoint.formatBearing(storedWp.pbxBearing2)}{end}`;
                    break;
                default:
            }
        }

        mcdu.setTemplate(template);

        // delete the waypoint on ident LSK
        mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
            if (value === FMCMainDisplay.clrValue) {
                mcdu.dataManager.deleteStoredWaypoint(index).then((deleted) => {
                    if (!deleted) {
                        mcdu.setScratchpadMessage(NXSystemMessages.fplnElementRetained);
                    } else if (mcdu.dataManager.numberOfStoredWaypoints() < 1) {
                        CDUNewWaypoint.ShowPage(mcdu, () => CDUDataIndexPage.ShowPage2(mcdu));
                    } else {
                        CDUPilotsWaypoint.ShowPage(mcdu, mcdu.dataManager.nextStoredWaypointIndex());
                    }
                });
            } else {
                mcdu.setScratchpadMessage(NXSystemMessages.notAllowed);
                scratchpadCallback();
            }
        };

        mcdu.rightInputDelay[4] = () => {
            return mcdu.getDelaySwitchPage();
        };

        mcdu.onRightInput[4] = () => {
            CDUNewWaypoint.ShowPage(mcdu);
        };

        // DELETE ALL
        mcdu.onRightInput[5] = () => {
            if (confirmDeleteAll) {
                mcdu.dataManager.deleteAllStoredWaypoints().then((allDeleted) => {
                    if (!allDeleted) {
                        mcdu.setScratchpadMessage(NXSystemMessages.fplnElementRetained);
                    }

                    CDUPilotsWaypoint.ShowPage(mcdu, index);
                });
            } else {
                CDUPilotsWaypoint.ShowPage(mcdu, index, true);
            }
        };

        const canScroll = mcdu.dataManager.numberOfStoredWaypoints() > 1;
        mcdu.setArrows(false, false, canScroll, canScroll);
        if (canScroll) {
            mcdu.onPrevPage = () => {
                CDUPilotsWaypoint.ShowPage(mcdu, mcdu.dataManager.prevStoredWaypointIndex(index));
            };
            mcdu.onNextPage = () => {
                CDUPilotsWaypoint.ShowPage(mcdu, mcdu.dataManager.nextStoredWaypointIndex(index));
            };
        }
    }

    static formatAngle(angle, digits) {
        const mins = (Math.abs(angle) % 1) * 60;
        return `${Math.abs(Math.trunc(angle)).toFixed(0).padStart(digits, '0')}${Math.trunc(mins).toFixed(0).padStart(2, '0')}.${((mins % 1) * 10).toFixed(0)}`;
    }

    // TODO is this already existing?
    static formatLatLong(coordinates) {
        return `${CDUPilotsWaypoint.formatAngle(coordinates.lat, 2)}${coordinates.lat < 0 ? 'S' : 'N'}/${CDUPilotsWaypoint.formatAngle(coordinates.long, 3)}${coordinates.long < 0 ? 'W' : 'E'}`;
    }

    static formatBearing(bearing) {
        return `${bearing.toFixed(0).padStart(3, '0')}°`;
    }
}
