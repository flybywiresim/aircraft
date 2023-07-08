import { ArraySubject, FSComponent } from '@microsoft/msfs-sdk';
import { MfdFmsFpln } from 'instruments/src/MFD/pages/FMS/F-PLN/F-PLN';
import { ContextMenuElementProps } from 'instruments/src/MFD/pages/common/ContextMenu';

export function getRevisionsMenu(fpln: MfdFmsFpln, isDeparture: boolean, isArrival: boolean): ArraySubject<ContextMenuElementProps> {
    return ArraySubject.create([
        {
            title: 'FROM P.POS DIR TO',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'INSERT NEXT WPT',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'DELETE *',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'DEPARTURE',
            disabled: !isDeparture,
            onSelectCallback: () => null,
        },
        {
            title: 'ARRIVAL',
            disabled: !isArrival,
            onSelectCallback: () => null,
        },
        {
            title: 'OFFSET',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'HOLD',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'AIRWAYS',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'OVERFLY *',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'ENABLE ALTN *',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'NEW DEST',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'CONSTRAINTS',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'CMS',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'STEP ALTs',
            disabled: false,
            onSelectCallback: () => null,
        },
        {
            title: 'WIND',
            disabled: false,
            onSelectCallback: () => null,
        },
    ]);
}
