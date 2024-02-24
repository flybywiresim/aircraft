// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export function getTailWind(windDirection: number, windMagnitude: number, runwayHeading: number): number {
  const windDirectionRelativeToRwy = windDirection - runwayHeading;
  const windDirectionRelativeToRwyRadians = toRadians(windDirectionRelativeToRwy);

  const tailWind = Math.cos(Math.PI - windDirectionRelativeToRwyRadians) * windMagnitude;
  return tailWind;
}

export function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}
