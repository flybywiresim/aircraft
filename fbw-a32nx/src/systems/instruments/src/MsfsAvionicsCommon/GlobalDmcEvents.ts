// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

/**
 * Events to share DMC state across the DUs (to ensure they're synced when on the same DMC).
 * A better architecture would be to put each DU gauge in the same VCockpit along with a DMC gauge,
 * and they could share data directly, or alternately use shared globals in FS2024, but this works for now.
 */
export interface GlobalDmcEvents {
  /** Left DMC (DMC 1 or 3 depending on switching) clock source 1 Hz flash signal. */
  dmc_left_flash_1hz: boolean;
  /** Right DMC (DMC 2 or 3 depending on switching) clock source 1 Hz flash signal. */
  dmc_right_flash_1hz: boolean;
}
