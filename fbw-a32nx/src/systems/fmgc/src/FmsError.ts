// Copyright (c) 2021-2022 FlyByWire Simulations
// Copyright (c) 2021-2022 Synaptic Simulations
//
// SPDX-License-Identifier: GPL-3.0

/**
 * Possible FMS errors
 */
export enum FmsErrorType {
  NotInDatabase,
  NotYetImplemented,
  FormatError,
  FplnElementRetained,
  EntryOutOfRange,
  ListOf99InUse,
  AwyWptMismatch,
}

export class FmsError extends Error {
  constructor(public type: FmsErrorType) {
    super(FmsErrorType[type]);
  }
}
