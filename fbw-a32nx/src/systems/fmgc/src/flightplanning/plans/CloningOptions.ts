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
  /**
   * Whether this is a copy from the active flight plan to the secondary flight plan
   */
  ActiveToSec = 1 << 2,
  /**
   * Whether the copy is being done before the engines are started.
   * This is important because certain performance data is only copied if the copy happens before the engines are started.
   */
  BeforeEngineStart = 1 << 3,
}
