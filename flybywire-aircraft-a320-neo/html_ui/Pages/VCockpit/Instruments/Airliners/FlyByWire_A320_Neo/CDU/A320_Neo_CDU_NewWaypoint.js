class CDUNewWaypoint {
    /**
     * Callback when a new waypoint has been created, or aborted
     * @name NewWaypointDoneCallback
     * @function
     * @param {WayPoint | undefined} waypoint the resultant new waypoint, or undefined if aborted
     */
    /**
     * New Waypoint Page
     * @param {A320_CDU_MainDisplay} mcdu
     * @param {NewWaypointDoneCallback} doneCallback callback when the user is finished with the page
     * @param {any} _inProgressData private data used by the page
     */
    static ShowPage(mcdu, doneCallback = undefined, _inProgressData = {}) {
        mcdu.clearDisplay();
        mcdu.page.Current = mcdu.page.NewWaypoint;
        mcdu.returnPageCallback = () => {
            CDUNewWaypoint.ShowPage(mcdu, doneCallback, _inProgressData);
        };

        const template = [
            ["NEW WAYPOINT"],
            ["IDENT"],
            [_inProgressData.ident !== undefined ? `{cyan}${_inProgressData.ident}{end}` : "_______[color]amber"],
            ["LAT/LONG"],
            ["____.__|_____.__[color]amber"],
            ["PLACE/BRG /DIST"],
            ["_______|___° |___. _[color]amber"],
            ["PLACE-BRG  /PLACE-BRG"],
            ["{amber}_____-___°  |_____-___°{end}"],
            [""],
            ["", "RETURN>"],
            [""],
            ["", _inProgressData.type !== undefined ? '{amber}STORE}{end}' : '']
        ];

        switch (_inProgressData.type) {
            case StoredWaypointType.LatLon:
                template[4][0] = `{cyan}${CDUPilotsWaypoint.formatLatLong(_inProgressData.wp.infos.coordinates)}{end}`;
                template[5].length = 0;
                template[6].length = 0;
                template[7].length = 0;
                template[8].length = 0;
                break;
            case StoredWaypointType.Pbd:
                template[4][0] = `{cyan}{small}${CDUPilotsWaypoint.formatLatLong(_inProgressData.wp.infos.coordinates)}{end}{end}`;
                template[5][0] = 'PLACE\xa0\xa0/BRG\xa0/DIST';
                template[6][0] = `{cyan}${_inProgressData.place.ident.padEnd(7, '\xa0')}/${CDUPilotsWaypoint.formatBearing(_inProgressData.wp, _inProgressData.bearing)}/${_inProgressData.distance.toFixed(1)}{end}`;
                template[7].length = 0;
                template[8].length = 0;
                break;
            case StoredWaypointType.Pbx:
                template[4][0] = `{cyan}{small}${CDUPilotsWaypoint.formatLatLong(_inProgressData.wp.infos.coordinates)}{end}{end}`;
                template[5].length = 0;
                template[6].length = 0;
                template[7][0] = 'PLACE-BRG\xa0\xa0/PLACE-BRG';
                template[8][0] = `{cyan}${_inProgressData.place1.ident.padEnd(5, '\xa0')}-${CDUPilotsWaypoint.formatBearing(_inProgressData.wp, _inProgressData.bearing1)}/${_inProgressData.place2.ident.padEnd(5, '\xa0')}-${CDUPilotsWaypoint.formatBearing(_inProgressData.wp, _inProgressData.bearing2)}{end}`;
                break;
            default:
        }

        mcdu.setTemplate(template);

        // ident
        mcdu.onLeftInput[0] = (value, scratchpadCallback) => {
            if (/^[A-Z0-9]{2,7}$/.test(value)) {
                if (_inProgressData === undefined) {
                    _inProgressData = {};
                }
                _inProgressData.ident = value;
                mcdu.requestCall(() => CDUNewWaypoint.ShowPage(mcdu, doneCallback, _inProgressData));
            } else {
                mcdu.addNewMessage(NXSystemMessages.formatError);
                scratchpadCallback();
            }
        };

        // lat/lon
        mcdu.onLeftInput[1] = (value, scratchpadCallback) => {
            if (value === FMCMainDisplay.clrValue) {
                if (_inProgressData.type === StoredWaypointType.LatLon) {
                    mcdu.requestCall(CDUNewWaypoint.ShowPage(mcdu, doneCallback, { ident: _inProgressData.ident }));
                } else {
                    return scratchpadCallback();
                }
            }

            if (_inProgressData.type !== undefined) {
                return scratchpadCallback();
            }

            if (mcdu.isLatLonFormat(value)) {
                try {
                    const coordinates = mcdu.parseLatLon(value);
                    mcdu.requestCall(() => CDUNewWaypoint.ShowPage(mcdu, doneCallback, {
                        ident: _inProgressData.ident,
                        type: StoredWaypointType.LatLon,
                        wp: mcdu.dataManager.createLatLonWaypoint(coordinates, false, _inProgressData.ident),
                        coordinates,
                    }));
                } catch (err) {
                    if (err instanceof McduMessage) {
                        mcdu.addNewMessage(err);
                    } else {
                        console.error(err);
                    }
                    scratchpadCallback();
                }
            } else {
                mcdu.addNewMessage(NXSystemMessages.formatError);
                scratchpadCallback();
            }
        };

        // place/bearing/dist
        mcdu.onLeftInput[2] = (value, scratchpadCallback) => {
            if (value === FMCMainDisplay.clrValue) {
                if (_inProgressData.type === StoredWaypointType.Pbd) {
                    mcdu.requestCall(CDUNewWaypoint.ShowPage(mcdu, doneCallback, { ident: _inProgressData.ident }));
                } else {
                    return scratchpadCallback();
                }
            }

            if (_inProgressData.type !== undefined) {
                return scratchpadCallback();
            }

            if (mcdu.isPbdFormat(value)) {
                try {
                    mcdu.parsePbd(value).then(([place, bearing, distance]) => {
                        mcdu.requestCall(() => CDUNewWaypoint.ShowPage(mcdu, doneCallback, {
                            ident: _inProgressData.ident,
                            type: StoredWaypointType.Pbd,
                            wp: mcdu.dataManager.createPlaceBearingDistWaypoint(place, bearing, distance, false, _inProgressData.ident),
                            place,
                            bearing,
                            distance,
                        }));
                    });
                } catch (err) {
                    if (err instanceof McduMessage) {
                        mcdu.addNewMessage(err);
                    } else {
                        console.error(err);
                    }
                    scratchpadCallback();
                }
            } else {
                mcdu.addNewMessage(NXSystemMessages.formatError);
                scratchpadCallback();
            }
        };

        // place-bearing/place-bearing
        mcdu.onLeftInput[3] = (value, scratchpadCallback) => {
            if (value === FMCMainDisplay.clrValue) {
                if (_inProgressData.type === StoredWaypointType.Pbx) {
                    mcdu.requestCall(CDUNewWaypoint.ShowPage(mcdu, doneCallback, { ident: _inProgressData.ident }));
                } else {
                    return scratchpadCallback();
                }
            }

            if (_inProgressData.type !== undefined) {
                return scratchpadCallback();
            }

            if (mcdu.isPbxFormat(value)) {
                try {
                    mcdu.parsePbx(value).then(([place1, bearing1, place2, bearing2]) => {
                        mcdu.requestCall(() => CDUNewWaypoint.ShowPage(mcdu, doneCallback, {
                            ident: _inProgressData.ident,
                            type: StoredWaypointType.Pbx,
                            wp: mcdu.dataManager.createPlaceBearingPlaceBearingWaypoint(place1, bearing1, place2, bearing2, false, _inProgressData.ident),
                            place1,
                            bearing1,
                            place2,
                            bearing2,
                        }));
                    });
                } catch (err) {
                    if (err instanceof McduMessage) {
                        mcdu.addNewMessage(err);
                    } else {
                        console.error(err);
                    }
                    scratchpadCallback();
                }
            } else {
                mcdu.addNewMessage(NXSystemMessages.formatError);
                scratchpadCallback();
            }
        };

        if (_inProgressData !== undefined) {
            mcdu.onRightInput[5] = () => {
                let wp;
                switch (_inProgressData.type) {
                    case StoredWaypointType.LatLon:
                        wp = mcdu.dataManager.createLatLonWaypoint(_inProgressData.coordinates, true, _inProgressData.ident);
                        break;
                    case StoredWaypointType.Pbd:
                        wp = mcdu.dataManager.createPlaceBearingDistWaypoint(_inProgressData.place, _inProgressData.bearing, _inProgressData.distance, true, _inProgressData.ident);
                        break;
                    case StoredWaypointType.Pbx:
                        wp = mcdu.dataManager.createPlaceBearingPlaceBearingWaypoint(_inProgressData.place1, _inProgressData.bearing1, _inProgressData.place2, _inProgressData.bearing2, true, _inProgressData.ident);
                        break;
                    default:
                        mcdu.addNewMessage(NXFictionalMessages.notYetImplemented);
                        return;
                }
                mcdu.requestCall(() => {
                    if (doneCallback !== undefined) {
                        doneCallback(wp);
                    } else {
                        CDUPilotsWaypoint.ShowPage(mcdu, wp.additionalData.storedIndex);
                    }
                });
            };
        }

        mcdu.onRightInput[4] = () => {
            mcdu.requestCall(() => {
                if (doneCallback !== undefined) {
                    doneCallback();
                } else {
                    CDUPilotsWaypoint.ShowPage(mcdu);
                }
            });
        };
    }
}
