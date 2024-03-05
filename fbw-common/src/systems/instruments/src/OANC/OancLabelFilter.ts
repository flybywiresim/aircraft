import { FeatureType } from 'index-no-react';
import { FmsDataStore } from 'instruments/src/OANC/OancControlPanelUtils';
import { Label, LabelStyle } from './Oanc';

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
export function filterLabel(label: Label, filter: OancLabelFilter, fmsSelectedRunway?: string, btvSelectedRunway?: string): boolean {
    if (label.style === LabelStyle.FmsSelectedRunwayEnd) {
        return label.text.includes(fmsSelectedRunway?.substring(2));
    } if (label.style === LabelStyle.BtvSelectedRunwayArrow) {
        return label.text.includes(btvSelectedRunway?.substring(2));
    }

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

export function labelStyle(label: Label, fmsDataStore: FmsDataStore, isFmsOrigin: boolean, isFmsDestination: boolean, btvSelectedRunway: string, btvSelectedExit: string): LabelStyle {
    if (label.style === LabelStyle.RunwayEnd || label.style === LabelStyle.BtvSelectedRunwayEnd) {
        return btvSelectedRunway?.substring(2) === label.text ? LabelStyle.BtvSelectedRunwayEnd : LabelStyle.RunwayEnd;
    } if (label.style === LabelStyle.RunwayAxis || label.style === LabelStyle.FmsSelectedRunwayAxis) {
        const isSelectedRunway = (isFmsOrigin && label.text.includes(fmsDataStore.landingRunway.get()?.substring(2)))
                    || (isFmsDestination && label.text.includes(fmsDataStore.departureRunway.get()?.substring(2)));
        return isSelectedRunway ? LabelStyle.FmsSelectedRunwayAxis : LabelStyle.RunwayAxis;
    } if (label.style === LabelStyle.Taxiway || label.style === LabelStyle.BtvSelectedExit) {
        return label.text === btvSelectedExit ? LabelStyle.BtvSelectedExit : LabelStyle.Taxiway;
    }
    return label.style;
}
