import { FeatureType } from 'index-no-react';
import { Label } from './Oanc';

export interface BaseOancLabelFilter {
    type: string,
}

export interface RunwayBtvSelectionLabelFilter extends BaseOancLabelFilter {
    type: 'runwayBtvSelection',
    runwayIdent: string,
    showAdjacent: boolean,
}

export interface NoneLabelFilter extends BaseOancLabelFilter {
    type: 'none',
}

export interface NullLabelFilter extends BaseOancLabelFilter {
    type: 'null',
}

export interface MajorLabelFilter extends BaseOancLabelFilter {
    type: 'major',
}

export type OancLabelFilter = RunwayBtvSelectionLabelFilter | NoneLabelFilter | NullLabelFilter | MajorLabelFilter

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function filterLabel(label: Label, filter: OancLabelFilter, selectedRunwayIdentifier?: string): boolean {
    switch (filter.type) {
    default:
    case 'none':
        return false;
    case 'null':
        return label.associatedFeature.properties.feattype !== FeatureType.ExitLine;
    case 'major':
        return label.text.length < 2 && label.associatedFeature.properties.feattype !== FeatureType.ExitLine;
    case 'runwayBtvSelection':
        return (label.associatedFeature.properties.feattype === FeatureType.Centerline
            || label.associatedFeature.properties.feattype === FeatureType.ExitLine || filter.showAdjacent); // TODO lower opacity if associated rwy not selected
    }
}
