// Copyright (c) 2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export interface GenericAdirsEvents {
  pitch: number;
  roll: number;
  magHeadingRaw: number;
  baroCorrectedAltitude: number;
  speed: number;
  vsInert: number;
  vsBaro: number;
  magTrackRaw: number;
  groundSpeed: number;
  trueAirSpeed: number;
  windDirection: number;
  windSpeed: number;
  fpaRaw: number;
  daRaw: number;
  mach: number;
  latitude: number;
  longitude: number;
  latAccRaw: number;
  irMaintWordRaw: number;
  trueHeadingRaw: number;
  trueTrackRaw: number;
}
