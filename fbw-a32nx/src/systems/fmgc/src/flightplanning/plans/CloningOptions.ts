// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export enum CopyOptions {
  Default = 0,
  IncludeFixInfos = 1 << 0,
  CopyPredictions = 1 << 1,
  ActiveToSec = 1 << 2,
  BeforeEngineStart = 1 << 3,
}
