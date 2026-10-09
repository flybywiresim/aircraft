// Copyright (c) 2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import { AtsuStatusCodes, WindRequestMessage, WindUplinkMessage } from '@datalink/common';

export interface AtsuToFmsEvents {
  /** From the ATSU to the FMS to respond to a wind request */
  wind_uplink_response: WindUplinkResponse;
}

export interface WindUplinkResponse {
  status: AtsuStatusCodes;
  message: WindUplinkMessage | null;
  flightPlan: number;
}

export interface WindUplinkRequest {
  flightPlan: number;
  message: WindRequestMessage;
}

export interface FmsToAtsuEvents {
  /** From the FMS to the ATSU to request wind data for the flightplan */
  wind_uplink_request: WindUplinkRequest;
}
