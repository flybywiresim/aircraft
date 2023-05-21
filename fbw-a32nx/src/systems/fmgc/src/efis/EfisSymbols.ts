// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { FlightPlanManager, WaypointConstraintType } from '@fmgc/flightplanning/FlightPlanManager';
import { EfisOption, EfisNdMode, NdSymbol, NdSymbolTypeFlags, EfisNdRangeValue, rangeSettings } from '@shared/NavigationDisplay';
import { GuidanceManager } from '@fmgc/guidance/GuidanceManager';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { GuidanceController } from '@fmgc/guidance/GuidanceController';
import { SegmentType } from '@fmgc/wtsdk';
import { GenericDataListenerSync } from '@shared/GenericDataListenerSync';
import { LnavConfig } from '@fmgc/guidance/LnavConfig';
import { NearbyFacilities } from '@fmgc/navigation/NearbyFacilities';
import { NavaidTuner } from '@fmgc/navigation/NavaidTuner';
import { getFlightPhaseManager } from '@fmgc/flightphase';
import { FmgcFlightPhase } from '@shared/flightphase';
import { LegType, RunwaySurface, TurnDirection, VorType } from '../types/fstypes/FSEnums';

export class EfisSymbols {
    /** these types of legs are current not integrated into the normal symbol drawing routines */
    static readonly LEG_MANAGED_TYPES = [LegType.CA, LegType.CR, LegType.CI, LegType.FM, LegType.PI, LegType.VA, LegType.VI, LegType.VM];

    private blockUpdate = false;

    private flightPlanManager: FlightPlanManager;

    private guidanceController: GuidanceController;

    private guidanceManager: GuidanceManager;

    private nearby: NearbyFacilities;

    private syncer: GenericDataListenerSync = new GenericDataListenerSync();

    private static sides = ['L', 'R'];

    private lastMode = { L: -1, R: -1 };

    private lastRange = { L: 0, R: 0 };

    private lastEfisOption = { L: 0, R: 0 };

    private lastPlanCentre = undefined;

    private lastPpos: Coordinates = { lat: 0, long: 0 };

    private lastTrueHeading: number = -1;

    private lastNearbyFacilitiesVersion;

    private lastFpVersion;

    private lastNavaidVersion = -1;

    private lastVnavDriverVersion: number = -1;

    constructor(flightPlanManager: FlightPlanManager, guidanceController: GuidanceController, private readonly navaidTuner: NavaidTuner) {
        this.flightPlanManager = flightPlanManager;
        this.guidanceController = guidanceController;
        this.guidanceManager = guidanceController.guidanceManager;
        this.nearby = NearbyFacilities.getInstance();
    }

    init(): void {
        this.nearby.init();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async update(deltaTime: number): Promise<void> {
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
        // FIXME map reference point should be per side
        const planCentreIndex = SimVar.GetSimVarValue('L:A32NX_SELECTED_WAYPOINT', 'number');
        const planCentre = this.flightPlanManager.getWaypoint(planCentreIndex)?.infos.coordinates;
        const planCentreChanged = planCentre?.lat !== this.lastPlanCentre?.lat || planCentre?.long !== this.lastPlanCentre?.long;
        this.lastPlanCentre = planCentre;
        const navaidsChanged = this.lastNavaidVersion !== this.navaidTuner.navaidVersion;
        this.lastNavaidVersion = this.navaidTuner.navaidVersion;
        const vnavPredictionsChanged = this.lastVnavDriverVersion !== this.guidanceController.vnavDriver.version;
        this.lastVnavDriverVersion = this.guidanceController.vnavDriver.version;

        const activeFp = this.flightPlanManager.getCurrentFlightPlan();
        // TODO temp f-pln

        const hasSuitableRunway = (airport: RawAirport): boolean => {
            for (const runway of airport.runways) {
                switch (runway.surface) {
                case RunwaySurface.Asphalt:
                case RunwaySurface.Bituminous:
                case RunwaySurface.Concrete:
                case RunwaySurface.Tarmac:
                    if (runway.length >= 1500 && runway.width >= 30) {
                        return true;
                    }
                    break;
                default:
                    break;
                }
            }
            return false;
        };

        for (const side of EfisSymbols.sides) {
            const range = rangeSettings[SimVar.GetSimVarValue(`L:A32NX_EFIS_${side}_ND_RANGE`, 'number')];
            const mode: EfisNdMode = SimVar.GetSimVarValue(`L:A32NX_EFIS_${side}_ND_MODE`, 'number');
            const efisOption = SimVar.GetSimVarValue(`L:A32NX_EFIS_${side}_OPTION`, 'Enum');

            const rangeChange = this.lastRange[side] !== range;
            this.lastRange[side] = range;
            const modeChange = this.lastMode[side] !== mode;
            this.lastMode[side] = mode;
            const efisOptionChange = this.lastEfisOption[side] !== efisOption;
            this.lastEfisOption[side] = efisOption;
            const nearbyOverlayChanged = efisOption !== EfisOption.Constraints && efisOption !== EfisOption.None && nearbyFacilitiesChanged;

            if (!pposChanged
                && !trueHeadingChanged
                && !rangeChange
                && !modeChange
                && !efisOptionChange
                && !nearbyOverlayChanged
                && !fpChanged
                && !planCentreChanged
                && !navaidsChanged
                && !vnavPredictionsChanged) {
                continue;
            }

            if (mode === EfisNdMode.PLAN && !planCentre) {
                this.syncer.sendEvent(`A32NX_EFIS_${side}_SYMBOLS`, []);
                return;
            }

            const [editAhead, editBehind, editBeside] = this.calculateEditArea(range, mode);

            // eslint-disable-next-line no-loop-func
            const withinEditArea = (ll): boolean => {
                const dist = Avionics.Utils.computeGreatCircleDistance(mode === EfisNdMode.PLAN ? planCentre : ppos, ll);
                let bearing = Avionics.Utils.computeGreatCircleHeading(mode === EfisNdMode.PLAN ? planCentre : ppos, ll);
                if (mode !== EfisNdMode.PLAN) {
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
            // eslint-disable-next-line no-loop-func
            const upsertSymbol = (symbol: NdSymbol): void => {
                if (DEBUG) {
                    console.time(`upsert symbol ${symbol.databaseId}`);
                }
                const symbolIdx = symbols.findIndex((s) => s.databaseId === symbol.databaseId);
                if (symbolIdx !== -1) {
                    const oldSymbol = symbols.splice(symbolIdx, 1)[0];
                    symbol.constraints = symbol.constraints ?? oldSymbol.constraints;
                    symbol.direction = symbol.direction ?? oldSymbol.direction;
                    symbol.length = symbol.length ?? oldSymbol.length;
                    symbol.location = symbol.location ?? oldSymbol.location;
                    symbol.type |= oldSymbol.type;
                    if (oldSymbol.radials) {
                        if (symbol.radials) {
                            symbol.radials.push(...oldSymbol.radials);
                        } else {
                            symbol.radials = oldSymbol.radials;
                        }
                    }
                    if (oldSymbol.radii) {
                        if (symbol.radii) {
                            symbol.radii.push(...oldSymbol.radii);
                        } else {
                            symbol.radii = oldSymbol.radii;
                        }
                    }
                }
                symbols.push(symbol);
            };

            // TODO ADIRs aligned (except in plan mode...?)
            if (efisOption === EfisOption.VorDmes) {
                for (const vor of this.nearby.getVhfNavaids()) {
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
                for (const ndb of this.nearby.getNdbNavaids()) {
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
                for (const ap of this.nearby.getAirports()) {
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
                for (const wp of this.nearby.getWaypoints()) {
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
                const fixInfo = this.flightPlanManager.getFixInfo(i as 0 | 1 | 2 | 3);
                const refFix = fixInfo?.getRefFix();
                if (refFix !== undefined) {
                    upsertSymbol({
                        databaseId: refFix.icao,
                        ident: refFix.ident,
                        location: refFix.infos.coordinates,
                        type: NdSymbolTypeFlags.FixInfo,
                        radials: fixInfo.getRadialTrueBearings(),
                        radii: [fixInfo.getRadiusValue()],
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

            const formatConstraintSpeed = (speed: number, prefix: string = '') => `${prefix}${Math.floor(speed)}KT`;

            for (const [index, leg] of this.guidanceController.activeGeometry.legs.entries()) {
                if (!leg.isNull && leg.terminationWaypoint && leg.displayedOnMap) {
                    if (!(leg.terminationWaypoint instanceof WayPoint)) {
                        const isActive = index === this.guidanceController.activeLegIndex;

                        let type = NdSymbolTypeFlags.FlightPlan;

                        if (isActive) {
                            type |= NdSymbolTypeFlags.ActiveLegTermination;
                        }

                        const ident = leg.ident;
                        const cutIdent = leg.ident.substring(0, 4).padEnd(5, ' ');
                        const id = (Math.random() * 10_000_000).toString().substring(0, 5);

                        upsertSymbol({
                            databaseId: `X${id}${cutIdent}`,
                            ident,
                            type,
                            location: leg.terminationWaypoint,
                        });
                    }
                }
            }

            const isInLatAutoControl = this.guidanceController.vnavDriver.isLatAutoControlActive();
            const waypointPredictions = this.guidanceController.vnavDriver.mcduProfile?.waypointPredictions;
            const isSelectedVerticalModeActive = this.guidanceController.vnavDriver.isSelectedVerticalModeActive();
            const flightPhase = getFlightPhaseManager().phase;

            // TODO don't send the waypoint before active once FP sequencing is properly implemented
            // (currently sequences with guidance which is too early)
            // eslint-disable-next-line no-lone-blocks
            {
                for (let i = activeFp.length - 1; i >= (activeFp.activeWaypointIndex - 1) && i >= 0; i--) {
                    const wp = activeFp.getWaypoint(i);
                    if (!wp) {
                        continue;
                    }

                    const isFromWp = i < activeFp.activeWaypointIndex;

                    // FIXME these should integrate with the normal algorithms to pick up contraints, not be drawn in enroute ranges, etc.
                    const legType = wp.additionalData.legType;
                    if (EfisSymbols.LEG_MANAGED_TYPES.includes(legType)) {
                        continue;
                    }

                    if (wp.type === 'A') {
                    // we pick these up later
                        continue;
                    }
                    // if range >= 160, don't include terminal waypoints, except at enroute boundary
                    if (range >= 160) {
                        const segment = activeFp.findSegmentByWaypointIndex(i);
                        if (segment.type === SegmentType.Departure) {
                            // keep the last waypoint from the SID as it is the enroute boundary
                            if (!activeFp.isLastWaypointInSegment(i)) {
                                continue;
                            }
                        } else if (segment.type !== SegmentType.Enroute) {
                            continue;
                        }
                    }

                    if (!withinEditArea(wp.infos.coordinates)) {
                        continue;
                    }

                    let type = NdSymbolTypeFlags.FlightPlan;
                    const constraints = [];
                    let direction;

                    const isCourseReversal = wp.additionalData.legType === LegType.HA
                        || wp.additionalData.legType === LegType.HF
                        || wp.additionalData.legType === LegType.HM
                        || wp.additionalData.legType === LegType.PI;

                    if (i === activeFp.activeWaypointIndex) {
                        type |= NdSymbolTypeFlags.ActiveLegTermination;
                    } else if (isCourseReversal && i > (activeFp.activeWaypointIndex + 1) && range <= 80 && !LnavConfig.DEBUG_FORCE_INCLUDE_COURSE_REVERSAL_VECTORS) {
                        if (wp.turnDirection === TurnDirection.Left) {
                            type |= NdSymbolTypeFlags.CourseReversalLeft;
                        } else {
                            type |= NdSymbolTypeFlags.CourseReversalRight;
                        }
                        direction = wp.additionalData.course;
                    }

                    if (isInLatAutoControl && !isFromWp && wp.legAltitudeDescription > 0 && wp.legAltitudeDescription < 6) {
                        if (!isSelectedVerticalModeActive && shouldShowConstraintCircleInPhase(flightPhase, wp)) {
                            type |= NdSymbolTypeFlags.Constraint;

                            const predictionAtWaypoint = waypointPredictions.get(i);
                            if (predictionAtWaypoint?.isAltitudeConstraintMet) {
                                type |= NdSymbolTypeFlags.MagentaColor;
                            } else if (predictionAtWaypoint) {
                                type |= NdSymbolTypeFlags.AmberColor;
                            }
                        } else if (i === activeFp.activeWaypointIndex) {
                            type |= NdSymbolTypeFlags.Constraint;
                        }
                    }

                    if (efisOption === EfisOption.Constraints && !isFromWp) {
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
                        direction,
                    });
                }
            }

            // we can only send 2 constraint predictions, so filter out any past the 2 close to the AC
            let constraintPredictions = 0;
            const constraintFlags = NdSymbolTypeFlags.Constraint | NdSymbolTypeFlags.MagentaColor | NdSymbolTypeFlags.AmberColor;
            for (let i = symbols.length - 1; i >= 0; i--) {
                if ((symbols[i].type & constraintFlags) === 0) {
                    continue;
                }
                if (constraintPredictions >= 2) {
                    symbols[i].type &= ~constraintFlags;
                } else {
                    constraintPredictions++;
                }
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

            // Pseudo waypoints

            for (const pwp of this.guidanceController.currentPseudoWaypoints.filter((it) => it && it.displayedOnNd)) {
                upsertSymbol({
                    databaseId: `W      ${pwp.ident}`,
                    ident: pwp.ident,
                    location: pwp.efisSymbolLla,
                    type: pwp.efisSymbolFlag,
                    distanceFromAirplane: pwp.distanceFromStart,
                });
            }

            for (const ndb of this.navaidTuner.tunedNdbs) {
                upsertSymbol({
                    databaseId: ndb.icao,
                    ident: WayPoint.formatIdentFromIcao(ndb.icao),
                    location: { lat: ndb.lat, long: ndb.lon },
                    type: NdSymbolTypeFlags.Ndb | NdSymbolTypeFlags.Tuned,
                });
            }

            for (const vor of this.navaidTuner.tunedVors) {
                upsertSymbol({
                    databaseId: vor.icao,
                    ident: WayPoint.formatIdentFromIcao(vor.icao),
                    location: { lat: vor.lat, long: vor.lon },
                    type: this.vorDmeTypeFlag(vor.type) | NdSymbolTypeFlags.Tuned,
                });
            }

            const wordsPerSymbol = 6;
            const maxSymbols = 640 / wordsPerSymbol;
            if (symbols.length > maxSymbols) {
                symbols.splice(0, symbols.length - maxSymbols);
                this.guidanceController.efisStateForSide[side].dataLimitReached = true;
            } else {
                this.guidanceController.efisStateForSide[side].dataLimitReached = false;
            }

            this.syncer.sendEvent(`A32NX_EFIS_${side}_SYMBOLS`, symbols);

            // make sure we don't run too often
            this.blockUpdate = true;
            setTimeout(() => {
                this.blockUpdate = false;
            }, 200);
        }
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

    private calculateEditArea(range: EfisNdRangeValue, mode: EfisNdMode): [number, number, number] {
        switch (mode) {
        case EfisNdMode.ARC:
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
        case EfisNdMode.ROSE_NAV:
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
        case EfisNdMode.PLAN:
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

const shouldShowConstraintCircleInPhase = (phase: FmgcFlightPhase, waypoint: WayPoint) => (
    (phase === FmgcFlightPhase.Takeoff || phase === FmgcFlightPhase.Climb) && waypoint.additionalData.constraintType === WaypointConstraintType.CLB
) || (
    (phase === FmgcFlightPhase.Cruise || phase === FmgcFlightPhase.Descent || phase === FmgcFlightPhase.Approach) && waypoint.additionalData.constraintType === WaypointConstraintType.DES
);
