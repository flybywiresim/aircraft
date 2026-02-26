// Copyright (c) 2025-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { FmsError, FmsErrorType } from '@fmgc/FmsError';

export class A380FmsError extends FmsError {
  public details?: string;

  constructor(
    public type: FmsErrorType,
    details?: string,
  ) {
    super(type);
    this.details = details;
  }
}
