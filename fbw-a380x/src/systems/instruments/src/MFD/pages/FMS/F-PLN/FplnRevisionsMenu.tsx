import { ArraySubject, FSComponent } from '@microsoft/msfs-sdk';
import { MfdFmsFpln } from 'instruments/src/MFD/pages/FMS/F-PLN/F-PLN';
import { ContextMenuElementProps } from 'instruments/src/MFD/pages/common/ContextMenu';

type lineType = 'waypoint' | 'discontinuity' | 'departure' | 'arrival' | 'too-steep-path';
export function getRevisionsMenu(fpln: MfdFmsFpln, type: lineType): ArraySubject<ContextMenuElementProps> {
    let disabledVec: boolean[] = [false, false, false, true, true, false, false, false, false, false, false, false, false, false, false];
    switch (type) {
    case 'waypoint':
        disabledVec = [false, false, false, true, true, false, false, false, false, false, false, false, false, false, false];
        break;
    case 'discontinuity':
        disabledVec = [true, false, false, true, true, false, true, true, true, false, false, true, true, true, true];
        break;
    case 'departure':
        disabledVec = [false, false, false, false, true, false, false, false, false, false, false, false, false, false, false];
        break;
    case 'arrival':
        disabledVec = [false, false, false, true, false, false, false, false, false, false, false, false, false, false, false];
        break;
    case 'too-steep-path':
        disabledVec = [true, false, true, true, true, true, true, true, true, true, true, true, true, true];
        break;
    default:
        disabledVec = [false, false, false, true, true, false, false, false, false, false, false, false, false, false, false];
        break;
    }
    return ArraySubject.create([
        {
            title: 'FROM P.POS DIR TO',
            disabled: disabledVec[0],
            onSelectCallback: () => null,
        },
        {
            title: 'INSERT NEXT WPT',
            disabled: disabledVec[1],
            onSelectCallback: () => fpln.openInsertNextWptFromWindow(),
        },
        {
            title: 'DELETE *',
            disabled: disabledVec[2],
            onSelectCallback: () => null,
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
            title: 'OFFSET',
            disabled: disabledVec[5],
            onSelectCallback: () => null,
        },
        {
            title: 'HOLD',
            disabled: disabledVec[6],
            onSelectCallback: () => null,
        },
        {
            title: 'AIRWAYS',
            disabled: disabledVec[7],
            onSelectCallback: () => null,
        },
        {
            title: 'OVERFLY *',
            disabled: disabledVec[8],
            onSelectCallback: () => null,
        },
        {
            title: 'ENABLE ALTN *',
            disabled: disabledVec[9],
            onSelectCallback: () => null,
        },
        {
            title: 'NEW DEST',
            disabled: disabledVec[10],
            onSelectCallback: () => fpln.openNewDestWindow(),
        },
        {
            title: 'CONSTRAINTS',
            disabled: disabledVec[11],
            onSelectCallback: () => null,
        },
        {
            title: 'CMS',
            disabled: disabledVec[12],
            onSelectCallback: () => null,
        },
        {
            title: 'STEP ALTs',
            disabled: disabledVec[13],
            onSelectCallback: () => null,
        },
        {
            title: 'WIND',
            disabled: disabledVec[14],
            onSelectCallback: () => null,
        },
    ]);
}
