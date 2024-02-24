// Copyright (c) 2023-2024 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { useSimVar } from '@flybywiresim/fbw-sdk';

export class ThrottleSimvar {
  readableName: string;

  technicalName: string;

  hiValue: any[];

  lowValue: any[];

  getHiGetter = () => this.hiValue[0];

  getHiSetter = () => this.hiValue[1];

  getLowGetter = () => this.lowValue[0];

  getLowSetter = () => this.lowValue[1];

  constructor(readableName: string, technicalName: string, throttleNumber: number) {
    this.readableName = readableName;
    this.technicalName = technicalName;
    this.hiValue = useSimVar(`${technicalName}HIGH:${throttleNumber}`, 'number', 100);
    this.lowValue = useSimVar(`${technicalName}LOW:${throttleNumber}`, 'number', 100);
  }
}
