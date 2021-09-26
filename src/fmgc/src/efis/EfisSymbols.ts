// Copyright (c) 2021 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanManager } from '@fmgc/flightplanning/FlightPlanManager';
import { RunwaySurface, VorType, WaypointConstraintType } from '@fmgc/types/fstypes/FSEnums';
import { OneWayRunway, RawAirport, VORInfo, WayPoint } from '@fmgc/types/fstypes/FSTypes';
import { EfisOption, Mode, NdSymbol, NdSymbolTypeFlags, RangeSetting, rangeSettings } from '@shared/NavigationDisplay';
import { LatLongData } from '@typings/fs-base-ui';
import { NearbyFacilities } from './NearbyFacilities';

export class EfisSymbols {
    private blockUpdate = false;

    private flightPlanManager: FlightPlanManager;

    private nearby: NearbyFacilities;

    private listener = RegisterViewListener('JS_LISTENER_SIMVARS');

    private static sides = ['L', 'R'];

    private lastMode = { L: -1, R: -1 };

    private lastRange = { L: 0, R: 0 };

    private lastEfisOption = { L: 0, R: 0 };

    private lastPlanCentre = undefined;

    private lastPpos: LatLongData = { lat: 0, long: 0 };

    private lastTrueHeading: number = -1;

    private lastNearbyFacilitiesVersion;

    private lastFpVersion;

    constructor(flightPlanManager) {
        this.flightPlanManager = flightPlanManager;
        this.nearby = new NearbyFacilities();
    }

    init(): void {
        this.nearby.init();
    }

    async update(deltaTime: number): Promise<void> {
        this.nearby.update(deltaTime);

        if (this.blockUpdate) {
            return;
        }

        // TODO use FMGC position
        const ppos = {
            lat: SimVar.GetSimVarValue('PLANE LATITUDE', 'degree latitude'),
            long: SimVar.GetSimVarValue('PLANE LONGITUDE', 'degree longitude'),
        };
        const trueHeading = SimVar.GetSimVarValue('PLANE HEADING DEGREES TRUE', 'degrees');

        const pposChanged = Avionics.Utils.computeDistance(this.lastPpos, ppos) > 2;
        if (pposChanged) {
            this.lastPpos = ppos;
        }
        const trueHeadingChanged = Avionics.Utils.diffAngle(trueHeading, this.lastTrueHeading) > 2;
        if (trueHeadingChanged) {
            this.lastTrueHeading = trueHeading;
        }

        const nearbyFacilitiesChanged = this.nearby.version !== this.lastNearbyFacilitiesVersion;
        this.lastNearbyFacilitiesVersion = this.nearby.version;
        const fpChanged = this.lastFpVersion !== this.flightPlanManager.currentFlightPlanVersion;
        this.lastFpVersion = this.flightPlanManager.currentFlightPlanVersion;
        const planCentreIndex = SimVar.GetSimVarValue('L:A32NX_SELECTED_WAYPOINT', 'number');
        const planCentre = this.flightPlanManager.getWaypoint(planCentreIndex)?.infos.coordinates;
        const planCentreChanged = planCentre?.lat !== this.lastPlanCentre?.lat || planCentre?.long !== this.lastPlanCentre?.long;
        this.lastPlanCentre = planCentre;

        const activeFp = this.flightPlanManager.getCurrentFlightPlan();
        // TODO temp f-pln

        const hasSuitableRunway = (airport: RawAirport): boolean => {
            for (const runway of airport.runways) {
                switch (runway.surface) {
                case RunwaySurface.Asphalt:
                case RunwaySurface.Bituminous:
                case RunwaySurface.Concrete:
                case RunwaySurface.Tarmac:
                    if (runway.length >= 1300) {
                        return true;
                    }
                    break;
                default:
                    break;
                }
            }
            return false;
        };

        EfisSymbols.sides.forEach(async (side) => {
            const range = rangeSettings[SimVar.GetSimVarValue(`L:A32NX_EFIS_${side}_ND_RANGE`, 'number')];
            const mode: Mode = SimVar.GetSimVarValue(`L:A32NX_EFIS_${side}_ND_MODE`, 'number');
            const efisOption = SimVar.GetSimVarValue(`L:A32NX_EFIS_${side}_OPTION`, 'enum');

            const rangeChange = this.lastRange[side] !== range;
            this.lastRange[side] = range;
            const modeChange = this.lastMode[side] !== mode;
            this.lastMode[side] = mode;
            const efisOptionChange = this.lastEfisOption[side] !== efisOption;
            this.lastEfisOption[side] = efisOption;
            const nearbyOverlayChanged = efisOption !== EfisOption.Constraints && efisOption !== EfisOption.None && nearbyFacilitiesChanged;

            if (!pposChanged && !trueHeadingChanged && !rangeChange && !modeChange && !efisOptionChange && !nearbyOverlayChanged && !fpChanged && !planCentreChanged) {
                return;
            }

            const [editAhead, editBehind, editBeside] = this.calculateEditArea(range, mode);

            const withinEditArea = (ll): boolean => {
                const dist = Avionics.Utils.computeGreatCircleDistance(mode === Mode.PLAN ? planCentre : ppos, ll);
                let bearing = Avionics.Utils.computeGreatCircleHeading(mode === Mode.PLAN ? planCentre : ppos, ll);
                if (mode !== Mode.PLAN) {
                    bearing = Avionics.Utils.clampAngle(bearing - trueHeading);
                }
                bearing = bearing * Math.PI / 180;
                const dx = dist * Math.sin(bearing);
                const dy = dist * Math.cos(bearing);
                return Math.abs(dx) < editBeside && dy > -editBehind && dy < editAhead;
            };

            const symbols: NdSymbol[] = [];

            // symbols most recently inserted always end up at the end of the array
            // we reverse the array at the end to make sure symbols are drawn in the correct order
            const upsertSymbol = (symbol: NdSymbol): void => {
                const symbolIdx = symbols.findIndex((s) => s.databaseId === symbol.databaseId);
                if (symbolIdx !== -1) {
                    const oldSymbol = symbols.splice(symbolIdx, 1)[0];
                    symbol.constraints = symbol.constraints ?? oldSymbol.constraints;
                    symbol.direction = symbol.direction ?? oldSymbol.direction;
                    symbol.length = symbol.length ?? oldSymbol.length;
                    symbol.location = symbol.location ?? oldSymbol.location;
                    symbol.type |= oldSymbol.type;
                }
                symbols.push(symbol);
            };

            // TODO ADIRs aligned (except in plan mode...?)
            if (efisOption === EfisOption.VorDmes) {
                for (const vor of this.nearby.nearbyVhfNavaids.values()) {
                    if (vor.type !== VorType.VORDME && vor.type !== VorType.VOR && vor.type !== VorType.DME && vor.type !== VorType.VORTAC && vor.type !== VorType.TACAN) {
                        continue;
                    }
                    const ll = { lat: vor.lat, long: vor.lon };
                    if (withinEditArea(ll)) {
                        upsertSymbol({
                            databaseId: vor.icao,
                            ident: vor.icao.substring(7, 12),
                            location: ll,
                            type: this.vorDmeTypeFlag(vor.type) | NdSymbolTypeFlags.EfisOption,
                        });
                    }
                }
            } else if (efisOption === EfisOption.Ndbs) {
                for (const ndb of this.nearby.nearbyNdbNavaids.values()) {
                    const ll = { lat: ndb.lat, long: ndb.lon };
                    if (withinEditArea(ll)) {
                        upsertSymbol({
                            databaseId: ndb.icao,
                            ident: ndb.icao.substring(7, 12),
                            location: ll,
                            type: NdSymbolTypeFlags.Ndb | NdSymbolTypeFlags.EfisOption,
                        });
                    }
                }
            } else if (efisOption === EfisOption.Airports) {
                for (const ap of this.nearby.nearbyAirports.values()) {
                    const ll = { lat: ap.lat, long: ap.lon };
                    if (withinEditArea(ll) && hasSuitableRunway(ap)) {
                        upsertSymbol({
                            databaseId: ap.icao,
                            ident: ap.icao.substring(7, 12),
                            location: ll,
                            type: NdSymbolTypeFlags.Airport | NdSymbolTypeFlags.EfisOption,
                        });
                    }
                }
            } else if (efisOption === EfisOption.Waypoints) {
                for (const wp of this.nearby.nearbyWaypoints.values()) {
                    const ll = { lat: wp.lat, long: wp.lon };
                    if (withinEditArea(ll)) {
                        upsertSymbol({
                            databaseId: wp.icao,
                            ident: wp.icao.substring(7, 12),
                            location: ll,
                            type: NdSymbolTypeFlags.Waypoint | NdSymbolTypeFlags.EfisOption,
                        });
                    }
                }
            }

            for (let i = 0; i < 4; i++) {
                const fixInfo = this.flightPlanManager.getFixInfo(i);
                const refFix = fixInfo?.getRefFix();
                if (refFix !== undefined) {
                    upsertSymbol({
                        databaseId: refFix.icao,
                        ident: refFix.ident,
                        location: refFix.infos.coordinates,
                        type: NdSymbolTypeFlags.FixInfo | this.symbolTypeFlags(refFix),
                        radials: fixInfo.getRadialTrueBearings(),
                        radius: fixInfo.getRadiusValue(),
                    });
                }
            }

            const formatConstraintAlt = (alt: number, descent: boolean, prefix: string = '') => {
                const transAlt = activeFp?.originTransitionAltitudePilot ?? activeFp?.originTransitionAltitudeDb;
                const transFl = activeFp?.destinationTransitionLevelPilot ?? activeFp?.destinationTransitionLevelDb;
                if (descent) {
                    const fl = Math.round(alt / 100);
                    if (transFl && fl >= transFl) {
                        return `${prefix}FL${fl}`;
                    }
                } else if (transAlt && alt >= transAlt) {
                    return `${prefix}FL${Math.round(alt / 100)}`;
                }
                return `${prefix}${Math.round(alt)}`;
            };

            const formatConstraintSpeed = (speed: number, prefix: string = '') => `${prefix}${Math.floor(speed)} KT`;

            // TODO don't send the waypoint before active once FP sequencing is properly implemented
            // (currently sequences with guidance which is too early)
            for (let i = activeFp.length - 1; i >= (activeFp.activeWaypointIndex - 1) && i >= 0; i--) {
                const wp = activeFp.getWaypoint(i);
                if (wp.type === 'A') {
                    // we pick these up later
                    continue;
                }
                // if range >= 160, don't include terminal waypoints
                if (range >= 160 && wp.icao.match(/^[A-Z][A-Z0-9 ]{2}[A-Z0-9]{4}/) !== null) {
                    continue;
                }

                if (!withinEditArea(wp.infos.coordinates)) {
                    continue;
                }

                let type = NdSymbolTypeFlags.FlightPlan;
                const constraints = [];

                if (i === activeFp.activeWaypointIndex) {
                    type |= NdSymbolTypeFlags.ActiveLegTermination;
                }

                if (wp.legAltitudeDescription !== 0) {
                    // TODO vnav to predict
                    type |= NdSymbolTypeFlags.ConstraintUnknown;
                }

                if (efisOption === EfisOption.Constraints) {
                    const descent = wp.constraintType === WaypointConstraintType.DES;
                    switch (wp.legAltitudeDescription) {
                    case 1:
                        constraints.push(formatConstraintAlt(wp.legAltitude1, descent));
                        break;
                    case 2:
                        constraints.push(formatConstraintAlt(wp.legAltitude1, descent, '+'));
                        break;
                    case 3:
                        constraints.push(formatConstraintAlt(wp.legAltitude1, descent, '-'));
                        break;
                    case 4:
                        constraints.push(formatConstraintAlt(wp.legAltitude1, descent, '-'));
                        constraints.push(formatConstraintAlt(wp.legAltitude2, descent, '+'));
                        break;
                    default:
                        break;
                    }

                    if (wp.speedConstraint > 0) {
                        constraints.push(formatConstraintSpeed(wp.speedConstraint));
                    }
                }

                upsertSymbol({
                    databaseId: wp.icao,
                    ident: wp.ident,
                    location: wp.infos.coordinates,
                    type,
                    constraints: constraints.length > 0 ? constraints : undefined,
                });
            }

            const airports: [WayPoint, OneWayRunway][] = [
                [activeFp.originAirfield, activeFp.getOriginRunway()],
                [activeFp.destinationAirfield, activeFp.getDestinationRunway()],
            ];
            for (const [airport, runway] of airports) {
                if (!airport) {
                    continue;
                }
                if (runway) {
                    if (withinEditArea(runway.beginningCoordinates)) {
                        upsertSymbol({
                            databaseId: airport.icao,
                            ident: `${airport.ident}${Avionics.Utils.formatRunway(runway.designation)}`,
                            location: runway.beginningCoordinates,
                            direction: runway.direction,
                            length: runway.length / 1852,
                            type: NdSymbolTypeFlags.Runway,
                        });
                    }
                } else if (withinEditArea(airport.infos.coordinates)) {
                    upsertSymbol({
                        databaseId: airport.icao,
                        ident: airport.ident,
                        location: airport.infos.coordinates,
                        type: NdSymbolTypeFlags.Airport,
                    });
                }
            }

            const wordsPerSymbol = 6;
            const maxSymbols = 640 / wordsPerSymbol;
            if (symbols.length > maxSymbols) {
                symbols.splice(0, symbols.length - maxSymbols);
                SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_MAP_PARTLY_DISPLAYED`, 'boolean', 1);
            } else {
                SimVar.SetSimVarValue(`L:A32NX_EFIS_${side}_MAP_PARTLY_DISPLAYED`, 'boolean', 0);
            }

            this.listener.triggerToAllSubscribers(`A32NX_EFIS_${side}_SYMBOLS`, symbols);

            // make sure we don't run too often
            this.blockUpdate = true;
            setTimeout(() => {
                this.blockUpdate = false;
            }, 200);
        });
    }

    private vorDmeTypeFlag(type: VorType): NdSymbolTypeFlags {
        switch (type) {
        case VorType.VORDME:
        case VorType.VORTAC:
            return NdSymbolTypeFlags.VorDme;
        case VorType.VOR:
            return NdSymbolTypeFlags.Vor;
        case VorType.DME:
        case VorType.TACAN:
            return NdSymbolTypeFlags.Dme;
        default:
            return 0;
        }
    }

    private symbolTypeFlags(fix: WayPoint): NdSymbolTypeFlags {
        switch (fix.icao.charAt(0)) {
        case 'V':
            return this.vorDmeTypeFlag((fix.infos as VORInfo).type);
        case 'N':
            return NdSymbolTypeFlags.Ndb;
        case 'A':
            return NdSymbolTypeFlags.Airport;
        case 'W':
            return NdSymbolTypeFlags.Waypoint;
        default:
            break;
        }
        return 0;
    }

    private calculateEditArea(range: RangeSetting, mode: Mode): [number, number, number] {
        switch (mode) {
        case Mode.ARC:
            if (range <= 10) {
                return [10.5, 3.5, 8.3];
            }
            if (range <= 20) {
                return [20.5, 7, 16.6];
            }
            if (range <= 40) {
                return [40.5, 14, 33.2];
            }
            if (range <= 80) {
                return [80.5, 28, 66.4];
            }
            if (range <= 160) {
                return [160.5, 56, 132.8];
            }
            return [320.5, 112, 265.6];
        case Mode.ROSE_NAV:
            if (range <= 10) {
                return [7.6, 7.1, 7.1];
            }
            if (range <= 20) {
                return [14.7, 14.2, 14.2];
            }
            if (range <= 40) {
                return [28.9, 28.4, 28.4];
            }
            if (range <= 80) {
                return [57.3, 56.8, 56.8];
            }
            if (range <= 160) {
                return [114.1, 113.6, 113.6];
            }
            return [227.7, 227.2, 227.2];
        case Mode.PLAN:
            if (range <= 10) {
                return [7, 7, 7];
            }
            if (range <= 20) {
                return [14, 14, 14];
            }
            if (range <= 40) {
                return [28, 28, 28];
            }
            if (range <= 80) {
                return [56, 56, 56];
            }
            if (range <= 160) {
                return [112, 112, 112];
            }
            return [224, 224, 224];
        default:
            return [0, 0, 0];
        }
    }
}
