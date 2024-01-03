import { TurnDirection } from '@flybywiresim/fbw-sdk';
import { HoldType } from '@fmgc/flightplanning/data/flightplan';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { FlightPlanIndex } from '@fmgc/index';
import { MfdFmsFpln } from 'instruments/src/MFD/pages/FMS/F-PLN/F-PLN';
import { ContextMenuElement } from 'instruments/src/MFD/pages/common/ContextMenu';

export enum FplnRevisionsMenuType {
    Waypoint,
    PseudoWaypoint,
    Discontinuity,
    Runway,
    Departure,
    Arrival,
    TooSteepPath
}

export function getRevisionsMenu(fpln: MfdFmsFpln, type: FplnRevisionsMenuType): ContextMenuElement[] {
    const legIndex = fpln.props.fmService.revisedWaypointIndex.get();
    const planIndex = fpln.props.fmService.revisedWaypointPlanIndex.get();
    const altnFlightPlan = fpln.props.fmService.revisedWaypointIsAltn.get();

    return [
        {
            title: 'FROM P.POS DIR TO',
            disabled: altnFlightPlan
                || legIndex >= fpln.loadedFlightPlan.firstMissedApproachLegIndex
                || planIndex === FlightPlanIndex.Temporary
                || [FplnRevisionsMenuType.Discontinuity
                || FplnRevisionsMenuType.TooSteepPath].includes(type)
                || !fpln.loadedFlightPlan.legElementAt(legIndex).isXF(),
            onSelectCallback: () => {
                fpln.props.fmService.flightPlanService.directToLeg(
                    fpln.props.fmService.navigation.getPpos(),
                    SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree'),
                    legIndex,
                    true,
                    planIndex,
                );
                fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-direct-to`);
            },
        },
        {
            title: 'INSERT NEXT WPT',
            disabled: false, // always enabled?
            onSelectCallback: () => fpln.openInsertNextWptFromWindow(),
        },
        {
            title: 'DELETE *',
            disabled: [FplnRevisionsMenuType.Runway || FplnRevisionsMenuType.TooSteepPath].includes(type),
            onSelectCallback: () => {
                fpln.props.fmService.flightPlanService.deleteElementAt(legIndex, false, planIndex, altnFlightPlan);
            },
        },
        {
            title: 'DEPARTURE',
            disabled: (type !== FplnRevisionsMenuType.Departure && type !== FplnRevisionsMenuType.Runway),
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-departure`),
        },
        {
            title: 'ARRIVAL',
            disabled: (type !== FplnRevisionsMenuType.Arrival && type !== FplnRevisionsMenuType.Runway),
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-arrival`),
        },
        {
            title: '(N/A) OFFSET',
            disabled: true,
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-hold`),
        },
        {
            title: 'HOLD',
            disabled: [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type),
            onSelectCallback: async () => {
                const waypoint = fpln.props.fmService.flightPlanService.active.legElementAt(legIndex);
                if (!waypoint.isHX()) {
                    const alt = waypoint.definition.altitude1 ? waypoint.definition.altitude1 : SimVar.GetSimVarValue('INDICATED ALTITUDE', 'feet');

                    const previousLeg = fpln.props.fmService.flightPlanService.active.maybeElementAt(legIndex - 1);

                    let inboundMagneticCourse = 100;
                    if (previousLeg && previousLeg.isDiscontinuity === false && previousLeg.isXF()) {
                        inboundMagneticCourse = Avionics.Utils.computeGreatCircleHeading(
                            previousLeg.terminationWaypoint().location,
                            waypoint.terminationWaypoint().location,
                        );
                    }

                    const defaultHold = {
                        inboundMagneticCourse,
                        turnDirection: TurnDirection.Right,
                        time: alt <= 14000 ? 1 : 1.5,
                        type: HoldType.Computed,
                    };
                    await fpln.props.fmService.flightPlanService.addOrEditManualHold(
                        legIndex,
                        { ...defaultHold },
                        undefined,
                        defaultHold,
                        planIndex,
                        altnFlightPlan,
                    );

                    fpln.props.fmService.revisedWaypointIndex.set(legIndex + 1); // We just inserted a new HOLD leg
                } else {
                    console.warn('Tried to hold on already existing Hx leg');
                }
                fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-hold`);
            },
        },
        {
            title: 'AIRWAYS',
            disabled: [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type),
            onSelectCallback: () => {
                fpln.props.fmService.flightPlanService.startAirwayEntry(legIndex);
                fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-airways`);
            },
        },
        {
            title: (!altnFlightPlan
                && ![FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type)
                && fpln.loadedFlightPlan.legElementAt(legIndex).definition.overfly === true) ? 'DELETE OVERFLY *' : 'OVERFLY *',
            disabled: altnFlightPlan || [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type),
            onSelectCallback: () => fpln.props.fmService.flightPlanService.toggleOverfly(legIndex, planIndex),
        },
        {
            title: 'ENABLE ALTN *',
            disabled: false,
            onSelectCallback: () => fpln.props.fmService.flightPlanService.enableAltn(legIndex, planIndex),
        },
        {
            title: 'NEW DEST',
            disabled: false,
            onSelectCallback: () => fpln.openNewDestWindow(),
        },
        {
            title: 'CONSTRAINTS',
            disabled: altnFlightPlan || [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type),
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-vert-rev/alt`),
        },
        {
            title: 'CMS',
            disabled: altnFlightPlan || [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type),
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-vert-rev/cms`),
        },
        {
            title: 'STEP ALTs',
            disabled: altnFlightPlan || [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type),
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-vert-rev/step-alts`),
        },
        {
            title: '(N/A) WIND',
            disabled: true,
            onSelectCallback: () => {
                // Find out whether waypoint is CLB, CRZ or DES waypoint and direct to appropriate WIND sub-page
                if (fpln.loadedFlightPlan?.legElementAt(legIndex)?.segment?.class === SegmentClass.Arrival) {
                    fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/wind/des`);
                } else if (fpln.loadedFlightPlan?.legElementAt(legIndex)?.segment?.class === SegmentClass.Enroute) {
                    fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/wind/crz`);
                } else {
                    fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/wind/clb`);
                }
            },
        },
    ];
}
