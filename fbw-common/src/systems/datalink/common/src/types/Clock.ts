//  Copyright (c) 2023 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

export class Clock {
  constructor(
    public year: number,
    public month: number,
    public dayOfMonth: number,
    public hour: number,
    public minute: number,
    public second: number,
    public secondsOfDay: number,
  ) {}
}
