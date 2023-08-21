import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { FSComponent } from '@microsoft/msfs-sdk';
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

export function getRevisionsMenu(fpln: MfdFmsFpln, type: FplnRevisionsMenuType, legIndex: number, planIndex: FlightPlanIndex, altnFlightPlan: boolean): ContextMenuElement[] {
    let realLegIndex = legIndex;
    if (altnFlightPlan === true) {
        realLegIndex = legIndex - fpln.loadedFlightPlan.allLegs.length;
    }
    return [
        {
            title: 'FROM P.POS DIR TO',
            disabled: [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type),
            onSelectCallback: () => {
                fpln.props.fmService.flightPlanService.directTo(
                    fpln.props.fmService.navigationProvider.getPpos(),
                    SimVar.GetSimVarValue('GPS GROUND TRUE TRACK', 'degree'),
                    fpln.loadedFlightPlan?.legElementAt(realLegIndex).definition.waypoint,
                    true,
                    planIndex,
                );
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
                console.log(`realLegIndex: ${realLegIndex}`);
                console.log(`Removing ${fpln.loadedFlightPlan.legElementAt(realLegIndex).ident}`);
                fpln.props.fmService.flightPlanService.deleteElementAt(realLegIndex, planIndex);
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
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-offset`),
        },
        {
            title: '(N/A) HOLD',
            disabled: true,
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-hold`),
        },
        {
            title: '(N/A) AIRWAYS',
            disabled: true,
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-airways`),
        },
        {
            title: 'OVERFLY *',
            disabled: [FplnRevisionsMenuType.Discontinuity || FplnRevisionsMenuType.TooSteepPath].includes(type),
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
            title: '(N/A) CONSTRAINTS',
            disabled: true,
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-vert-rev/alt`),
        },
        {
            title: '(N/A) CMS',
            disabled: true,
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-vert-rev/cms`),
        },
        {
            title: '(N/A) STEP ALTs',
            disabled: true,
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-vert-rev/step-alts`),
        },
        {
            title: '(N/A) WIND',
            disabled: true,
            onSelectCallback: () => {
                // Find out whether waypoint is CLB, CRZ or DES waypoint and direct to appropriate WIND sub-page
                if (fpln.loadedFlightPlan?.legElementAt(realLegIndex)?.segment?.class === SegmentClass.Arrival) {
                    fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/wind/des`);
                } else if (fpln.loadedFlightPlan?.legElementAt(realLegIndex)?.segment?.class === SegmentClass.Enroute) {
                    fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/wind/crz`);
                } else {
                    fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/wind/clb`);
                }
            },
        },
    ];
}
