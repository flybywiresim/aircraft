// Copyright (c) 2026 dancebunny98
// SPDX-License-Identifier: GPL-3.0

// The A380 speed schedule is kept local to performance calculations so the EFB
// does not load the FMGC/MFD dependency graph before its first render.
export enum ApproachConf {
  CONF_1 = 1,
  CONF_1F,
  CONF_2,
  CONF_3,
  CONF_FULL,
}

const weights = [250_000, 300_000, 350_000, 400_000, 450_000, 500_000, 550_000, 600_000];
const vls: Record<ApproachConf, readonly [readonly number[], readonly number[]]> = {
  [ApproachConf.CONF_1]: [
    [128, 140, 151, 162, 172, 182, 191, 200],
    [126, 137, 148, 158, 168, 177, 186, 195],
  ],
  [ApproachConf.CONF_1F]: [
    [123, 133, 144, 154, 163, 172, 180, 188],
    [123, 130, 140, 150, 159, 167, 176, 183],
  ],
  [ApproachConf.CONF_2]: [
    [123, 128, 138, 148, 157, 165, 173, 181],
    [123, 125, 135, 144, 153, 161, 169, 176],
  ],
  [ApproachConf.CONF_3]: [
    [123, 124, 134, 144, 152, 161, 169, 176],
    [123, 123, 131, 140, 148, 156, 164, 171],
  ],
  [ApproachConf.CONF_FULL]: [
    [123, 123, 131, 140, 148, 157, 165, 173],
    [123, 123, 127, 136, 144, 152, 160, 168],
  ],
};

export function getApproachVls(conf: ApproachConf, cg: number, weight: number): number {
  const schedule = vls[conf];
  if (!schedule) throw new Error('Invalid A380 approach configuration');

  const boundedWeight = Math.max(weights[0], Math.min(weights[weights.length - 1], weight));
  const upper = Math.max(1, weights.findIndex((value) => value >= boundedWeight));
  const fraction = (boundedWeight - weights[upper - 1]) / (weights[upper] - weights[upper - 1]);
  const atCg29 = schedule[0][upper - 1] + fraction * (schedule[0][upper] - schedule[0][upper - 1]);
  const atCg43 = schedule[1][upper - 1] + fraction * (schedule[1][upper] - schedule[1][upper - 1]);
  return atCg29 + ((cg - 29) / 14) * (atCg43 - atCg29);
}
