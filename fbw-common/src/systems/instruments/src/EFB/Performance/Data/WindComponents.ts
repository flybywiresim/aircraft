// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

export interface WindComponents {
  headwind: number;
  crosswind: number;
}

export interface DirectionalWindEntry {
  direction?: number;
  speed: number;
  gust?: number;
  variable: boolean;
}

export function parseDirectionalWindEntry(input: string): DirectionalWindEntry | undefined {
  const match = input.match(/^(VRB|\d{1,3})\/(\d{1,2}(?:\.\d)?)(?:G(\d{1,2}(?:\.\d)?))?$/);
  if (!match) return undefined;
  const variable = match[1] === 'VRB';
  const direction = variable ? undefined : Number(match[1]);
  const speed = Number(match[2]);
  const gust = match[3] === undefined ? undefined : Number(match[3]);
  if ((!variable && direction! > 360) || (gust !== undefined && gust < speed)) return undefined;
  return { direction, speed, gust, variable };
}

/** Use steady wind for headwind credit and gusts for adverse wind components. */
export function getConservativeWindComponents(
  runwayBearing: number,
  direction: number | undefined,
  speed: number,
  gust: number | undefined,
  variable: boolean,
): WindComponents {
  if (variable) {
    const worstSpeed = Math.max(speed, gust ?? speed);
    return { headwind: -worstSpeed, crosswind: worstSpeed };
  }
  if (direction === undefined) return { headwind: speed, crosswind: 0 };

  const angle = ((direction - runwayBearing) * Math.PI) / 180;
  const steadyHeadwind = speed * Math.cos(angle);
  const gustSpeed = Math.max(speed, gust ?? speed);
  return {
    headwind: steadyHeadwind < 0 ? gustSpeed * Math.cos(angle) : steadyHeadwind,
    crosswind: Math.abs(gustSpeed * Math.sin(angle)),
  };
}
