// Copyright (c) 2026 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

import { EfisSide, EfisVectorsGroup } from '../../instruments/src/NavigationDisplay';
import { PathVector } from './PathVector';

/** Shared data bus for EFIS vectors. Labels select the EFIS side; indexes are EfisVectorsGroup values. */
export const EFIS_VECTORS_DATA_BUS_NAME = 'FBW_EFIS_VECTORS';

/** Values reference FMS geometry; consumers must not mutate them or assume they are immutable snapshots. */
export type EfisVectorsData = Record<EfisSide, readonly PathVector[]>;

export const EFIS_VECTORS_GROUPS = {
  vectorsActive: EfisVectorsGroup.ACTIVE,
  vectorsActiveEosid: EfisVectorsGroup.ACTIVE_EOSID,
  vectorsDashed: EfisVectorsGroup.DASHED,
  vectorsTemporary: EfisVectorsGroup.TEMPORARY,
  vectorsMissed: EfisVectorsGroup.MISSED,
  vectorsAlternate: EfisVectorsGroup.ALTERNATE,
  vectorsSecondary: EfisVectorsGroup.SECONDARY,
} as const;

/**
 * Shared FMS geometry; consumers must not mutate it. Undefined clears the group.
 * Use () => false as the ConsumerSubject equality function as the reference stays the same.
 */
export type EfisVectorsEvents = Record<keyof typeof EFIS_VECTORS_GROUPS, readonly PathVector[] | undefined>;
