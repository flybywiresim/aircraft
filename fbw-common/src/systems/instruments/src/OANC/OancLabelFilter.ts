// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { FeatureType } from '@flybywiresim/fbw-sdk';
import { FmsDataStore } from './OancControlPanelUtils';
import { Label, LabelStyle } from './Oanc';

export interface BaseOancLabelFilter {
  type: string;
}

export interface RunwayBtvSelectionLabelFilter extends BaseOancLabelFilter {
  type: 'runwayBtvSelection';
  runwayIdent: string;
  showAdjacent: boolean;
}

export interface NoneLabelFilter extends BaseOancLabelFilter {
  type: 'none';
}

export interface NullLabelFilter extends BaseOancLabelFilter {
  type: 'null';
}

export interface MajorLabelFilter extends BaseOancLabelFilter {
  type: 'major';
}

export type OancLabelFilter = RunwayBtvSelectionLabelFilter | NoneLabelFilter | NullLabelFilter | MajorLabelFilter;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function filterLabel(
  label: Label,
  filter: OancLabelFilter,
  fmsDepRunway?: string,
  fmsLdgRunway?: string,
  btvSelectedRunway?: string,
  btvSelectedExit?: string,
): boolean {
  if (label.style === LabelStyle.FmsSelectedRunwayEnd && label.text) {
    return label.text === fmsDepRunway?.substring(4) || label.text === fmsLdgRunway?.substring(4);
  }
  if (label.style === LabelStyle.BtvSelectedRunwayArrow && label.text) {
    return label.text === btvSelectedRunway?.substring(4);
  }
  if (
    btvSelectedRunway &&
    label.associatedFeature?.properties.feattype === FeatureType.PaintedCenterline &&
    label.text === btvSelectedRunway?.substring(4)
  ) {
    return true;
  }
  if (btvSelectedExit && label.style === LabelStyle.BtvSelectedExit) {
    return true;
  }
  if (
    [
      LabelStyle.BtvStopLineMagenta,
      LabelStyle.BtvStopLineAmber,
      LabelStyle.BtvStopLineRed,
      LabelStyle.BtvStopLineGreen,
    ].includes(label.style)
  ) {
    return true;
  }

  switch (filter.type) {
    default:
    case 'none':
      return false;
    case 'null':
      return label.associatedFeature?.properties.feattype !== FeatureType.RunwayExitLine;
    case 'major':
      return (
        label.associatedFeature?.properties.feattype === FeatureType.PaintedCenterline ||
        (label.text.length < 2 && label.associatedFeature?.properties.feattype !== FeatureType.RunwayExitLine)
      );
    case 'runwayBtvSelection':
      return (
        label.associatedFeature?.properties.feattype === FeatureType.PaintedCenterline ||
        label.associatedFeature?.properties.feattype === FeatureType.RunwayExitLine ||
        filter.showAdjacent
      ); // FIXME lower opacity if associated rwy not selected
  }
}

export function labelStyle(
  label: Label,
  fmsDataStore: FmsDataStore,
  isFmsOrigin: boolean,
  isFmsDestination: boolean,
  btvSelectedRunway: string,
  btvSelectedExit: string,
): LabelStyle {
  if (label.style === LabelStyle.RunwayEnd || label.style === LabelStyle.BtvSelectedRunwayEnd) {
    return btvSelectedRunway?.substring(4) === label.text ? LabelStyle.BtvSelectedRunwayEnd : LabelStyle.RunwayEnd;
  }
  if (label.style === LabelStyle.RunwayAxis || label.style === LabelStyle.FmsSelectedRunwayAxis) {
    const isSelectedRunway =
      (isFmsOrigin && label.text === fmsDataStore.departureRunway.get()?.substring(4)) ||
      (isFmsDestination && label.text === fmsDataStore.landingRunway.get()?.substring(4));
    return isSelectedRunway ? LabelStyle.FmsSelectedRunwayAxis : LabelStyle.RunwayAxis;
  }
  if (label.style === LabelStyle.ExitLine || label.style === LabelStyle.BtvSelectedExit) {
    return label.text === btvSelectedExit ? LabelStyle.BtvSelectedExit : LabelStyle.ExitLine;
  }
  return label.style;
}
