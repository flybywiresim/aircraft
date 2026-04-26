// Copyright (c) 2026 FlyByWire Simulations
import { AtsuStatusCodes, WindRequestMessage, WindUplinkMessage } from '@datalink/common';

export interface FmsToAtsuEvents {
  reset_auto_update: null;
  wind_uplink_request: WindUplinkRequest;
}

export interface WindUplinkRequest {
  flightPlan: number;
  request: WindRequestMessage;
}

export interface WindUplinkResponse {
  status: AtsuStatusCodes;
  message: WindUplinkMessage | null;
  flightPlan: number;
}

export interface AtsuToFmsEvents {
  /** From the ATSU to the FMS to respond to a wind request */
  wind_uplink_response: WindUplinkResponse;
}
