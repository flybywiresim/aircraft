// Copyright (c) 2022 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { Coordinates } from 'msfs-geo';
import { DatabaseItem } from './Common';
import { SectionCode, AirportSubsectionCode } from './SectionCode';

export interface Gate extends DatabaseItem<SectionCode.Airport> {
  subSectionCode: AirportSubsectionCode.Gates;

  /** The airport this gate belongs to */
  airportIcao: string;

  /** location of the parking position at the gate */
  location: Coordinates;
}
