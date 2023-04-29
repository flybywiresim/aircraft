import { Label } from './Oanc';

export interface BaseOancLabelFilter {
    type: string,
}

export interface RunwayBtvSelectionLabelFilter extends BaseOancLabelFilter {
    type: 'runwayBtvSelection',
    runwayIdent: string,
}

export interface NullLabelFilter extends BaseOancLabelFilter {
    type: 'null',
}

export interface MajorLabelFilter extends BaseOancLabelFilter {
    type: 'major',
}

export type OancLabelFilter = RunwayBtvSelectionLabelFilter | NullLabelFilter | MajorLabelFilter

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function filterLabel(label: Label, filter: OancLabelFilter, selectedRunwayIdentifier?: string): boolean {
    switch (filter.type) {
    default:
    case 'null':
        return true;
    case 'major':
        return label.text.length < 2;
    case 'runwayBtvSelection':
        return false; // TODO implement BTV label filtering
    }
}
