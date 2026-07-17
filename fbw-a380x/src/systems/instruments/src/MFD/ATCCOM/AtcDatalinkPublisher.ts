// Copyright (c) 2025-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0

import { IndexedEventType } from '@microsoft/msfs-sdk';
import { AirportAtis } from './AtcDatalinkSystem';

interface BaseAtcDatalinkMessages {
  atcAtis: AirportAtis;
}
type AtcDatalinkIndexedMessages = {
  [P in keyof BaseAtcDatalinkMessages as IndexedEventType<P>]: BaseAtcDatalinkMessages[P];
};

export interface AtcDatalinkMessages extends BaseAtcDatalinkMessages, AtcDatalinkIndexedMessages {}
