// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { EventBus } from '@microsoft/msfs-sdk';

export function logTroubleshootingError(bus: EventBus, msg: any) {
  bus.pub('troubleshooting_log_error', String(msg), true, false);
}
