// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisSide } from '../../instruments/src/NavigationDisplay';
import { PathVector } from './PathVector';

/** Shared data bus for EFIS vectors. Labels select the EFIS side; indexes are EfisVectorsGroup values. */
export const EFIS_VECTORS_DATA_BUS_NAME = 'FBW_EFIS_VECTORS';

export type EfisVectorsData = Record<EfisSide, readonly PathVector[]>;
