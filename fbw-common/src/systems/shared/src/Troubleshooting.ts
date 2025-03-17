// Copyright (c) 2025 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { EventBus } from '@microsoft/msfs-sdk';

/** Types for logging troubleshooting messages. */
export interface TroubleshootingEvents {
  /**
   * Error log for errors that should be user visible for fault finding and FBW support team.
   * Use vary sparingly, and only for user visible errors that need troubleshooting info e.g. INTERNAL ERROR in the FMS!
   */
  troubleshooting_log_error: string;
}

/**
 * Logs a troubleshooting error message, for display on the EFB.
 * @param bus EventBus to use.
 * @param msg The message to log.
 */
export function logTroubleshootingError(bus: EventBus, msg: any): void {
  bus.pub('troubleshooting_log_error', String(msg), true, false);
}
