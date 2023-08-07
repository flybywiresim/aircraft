import { FlightPlanIndex } from '@fmgc/flightplanning/new/FlightPlanManager';
import { SegmentClass } from '@fmgc/flightplanning/new/segments/SegmentClass';
import { ArraySubject, FSComponent } from '@microsoft/msfs-sdk';
import { MfdFmsFpln } from 'instruments/src/MFD/pages/FMS/F-PLN/F-PLN';
import { ContextMenuElementProps } from 'instruments/src/MFD/pages/common/ContextMenu';

export enum FplnRevisionsMenuType {
    Waypoint,
    Discontinuity,
    Departure,
    Arrival,
    TooSteepPath
}

export function getRevisionsMenu(fpln: MfdFmsFpln, type: FplnRevisionsMenuType, legIndex: number, planIndex: FlightPlanIndex): ArraySubject<ContextMenuElementProps> {
    let disabledVec: boolean[] = [false, false, false, true, true, false, false, false, false, false, false, false, false, false, false];
    switch (type) {
    case FplnRevisionsMenuType.Waypoint:
        disabledVec = [false, false, false, true, true, false, false, false, false, false, false, false, false, false, false];
        break;
    case FplnRevisionsMenuType.Discontinuity:
        disabledVec = [true, false, false, true, true, false, true, true, true, false, false, true, true, true, true];
        break;
    case FplnRevisionsMenuType.Departure:
        disabledVec = [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false];
        break;
    case FplnRevisionsMenuType.Arrival:
        disabledVec = [false, false, false, true, false, false, false, false, false, false, false, false, false, false, false];
        break;
    case FplnRevisionsMenuType.TooSteepPath:
        disabledVec = [true, false, true, true, true, true, true, true, true, true, true, true, true, true];
        break;
    default:
        disabledVec = [false, false, false, true, true, false, false, false, false, false, false, false, false, false, false];
        break;
    }
    return ArraySubject.create([
        {
            title: '(N/A) FROM P.POS DIR TO',
            disabled: true,
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-direct-to`),
        },
        {
            title: 'INSERT NEXT WPT',
            disabled: disabledVec[1],
            onSelectCallback: () => fpln.openInsertNextWptFromWindow(),
        },
        {
            title: 'DELETE *',
            disabled: disabledVec[2],
            onSelectCallback: () => fpln.props.flightPlanService.deleteElementAt(legIndex, planIndex),
        },
        {
            title: 'DEPARTURE',
            disabled: disabledVec[3],
            onSelectCallback: () => fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/f-pln-departure`),
        },
        {
            title: 'ARRIVAL',
            disabled: disabledVec[4],
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
            disabled: disabledVec[8],
            onSelectCallback: () => fpln.props.flightPlanService.toggleOverfly(legIndex, planIndex),
        },
        {
            title: 'ENABLE ALTN *',
            disabled: disabledVec[9],
            onSelectCallback: () => fpln.props.flightPlanService.enableAltn(legIndex, planIndex),
        },
        {
            title: 'NEW DEST',
            disabled: disabledVec[10],
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
                if (fpln.loadedFlightPlan?.legElementAt(legIndex)?.segment?.class === SegmentClass.Arrival) {
                    fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/wind/des`);
                } else if (fpln.loadedFlightPlan?.legElementAt(legIndex)?.segment?.class === SegmentClass.Enroute) {
                    fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/wind/crz`);
                } else {
                    fpln.props.uiService.navigateTo(`fms/${fpln.props.uiService.activeUri.get().category}/wind/clb`);
                }
            },
        },
    ]);
}
