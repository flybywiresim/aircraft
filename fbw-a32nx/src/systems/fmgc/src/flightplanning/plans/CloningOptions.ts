// Copyright (c) 2021-2024 FlyByWire Simulations
//
// SPDX-License-Identifier: GPL-3.0

export enum CopyOptions {
  Default = 0,
  /**
   * Whether FIX INFO entries should be copied
   */
  IncludeFixInfos = 1 << 0,
  /**
   * Whether flight plan leg predictions should be copied
   */
  CopyPredictions = 1 << 1,
}
