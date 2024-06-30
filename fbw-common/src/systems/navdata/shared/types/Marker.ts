// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from 'msfs-geo';
import { DatabaseItem } from '..';
import { AirportSubsectionCode, SectionCode } from './SectionCode';

export enum MarkerType {
  IM = 'IM',
  MM = 'MM',
  OM = 'OM',
  BM = 'BM',
}

export interface Marker extends DatabaseItem<SectionCode.Airport> {
  subSectionCode: AirportSubsectionCode.LocalizerMarker;

  airportIdentifier: string;
  runwayIdentifier: string;
  lsIdentifier: string;
  type: MarkerType;
  locator: boolean;
  location: Coordinates;
}
