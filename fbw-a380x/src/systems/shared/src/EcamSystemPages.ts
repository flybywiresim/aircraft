// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

// This file is used to define the enum for the SD pages to be shared between the different systems.
// Changing the order of the enum will break anything that relies on the numbers being the same
// This includes:
// - the external API: e.g. L:A32NX_ECAM_SD_CURRENT_PAGE_INDEX
// - the PAGES object at the end of fbw-a380x/src/systems/instruments/src/SD/SystemDisplay.tsx

export enum SdPages {
  None = -1,
  Eng = 0,
  Apu = 1,
  Bleed = 2,
  Cond = 3,
  Press = 4,
  Door = 5,
  ElecAc = 6,
  ElecDc = 7,
  Fuel = 8,
  Wheel = 9,
  Hyd = 10,
  Fctl = 11,
  Cb = 12,
  Crz = 13,
  Status = 14,
  Video = 15,
}
