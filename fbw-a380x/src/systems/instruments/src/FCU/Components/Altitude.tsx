//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, MappedSubject, VNode } from '@microsoft/msfs-sdk';
import { OverheadEvents } from '../../MsfsAvionicsCommon/providers/OverheadPublisher';
import { MsfsAutopilotAssistanceEvents } from '@flybywiresim/fbw-sdk';

export interface AltitudeProps {
  readonly bus: EventBus;
}

export class Altitude extends DisplayComponent<AltitudeProps> {
  private sub = this.props.bus.getSubscriber<MsfsAutopilotAssistanceEvents & OverheadEvents>();

  private readonly isLightTestActive = ConsumerSubject.create(this.sub.on('ovhd_ann_lt_test_active'), false);

  private readonly selectedAltitude = ConsumerSubject.create(this.sub.on('msfs_autopilot_altitude_lock_var_3'), 100);

  private readonly altText = MappedSubject.create(
    ([isLightTest, altitude]) => {
      if (isLightTest) {
        return '88888';
      }
      const value = Math.floor(Math.max(altitude, 100));
      return value.toString().padStart(5, '0');
    },
    this.isLightTestActive,
    this.selectedAltitude,
  );

  render(): VNode | null {
    return (
      <div id="Altitude">
        <svg width="125%" height="100%">
          <text id="ALT" class="Common Active" x="31%" y="20%">
            ALT
          </text>
          <text id="Value" class="Common Value" x="4%" y="86%">
            {this.altText}
          </text>
        </svg>
      </div>
    );
  }
}
