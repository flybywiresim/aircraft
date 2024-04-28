//  Copyright (c) 2022 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export enum DatalinkStatusCode {
  DlkAvail = 2,
  DlkNotAvail = 1,
  Inop = -1,
  NotInstalled = 0,
}

export enum DatalinkModeCode {
  AtcAoc = 1,
  Aoc = 2,
  Atc = 3,
  None = 0,
}
