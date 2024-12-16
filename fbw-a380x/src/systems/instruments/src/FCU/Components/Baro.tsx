//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, MappedSubject, VNode } from '@microsoft/msfs-sdk';
import { OverheadEvents } from '../../MsfsAvionicsCommon/providers/OverheadPublisher';
import { BaroEvents, BaroMode } from '../Managers/BaroManager';

export interface BaroProps {
  readonly bus: EventBus;
}

export class Baro extends DisplayComponent<BaroProps> {
  private readonly sub = this.props.bus.getSubscriber<BaroEvents & OverheadEvents>();

  private readonly mode = ConsumerSubject.create(this.sub.on('baro_mode_1'), BaroMode.Qnh);

  private readonly correction = ConsumerSubject.create(this.sub.on('baro_correction_1'), 1013);

  private readonly isLightTestActive = ConsumerSubject.create(this.sub.on('ovhd_ann_lt_test_active'), false);

  private readonly isQnhLabelVisible = MappedSubject.create(
    ([mode, isLightTest]) => isLightTest || mode === BaroMode.Qnh,
    this.mode,
    this.isLightTestActive,
  );

  private readonly isPreSelVisible = ConsumerSubject.create(this.sub.on('baro_preselect_visible_1'), false);

  private readonly baroText = MappedSubject.create(
    ([mode, correction, isLightTest]) => {
      if (isLightTest) {
        return '8.8.8.8';
      }
      switch (mode) {
        case BaroMode.Std:
          return 'Std';
        case BaroMode.Qnh:
        case BaroMode.Qfe:
          if (correction < 100) {
            return correction.toFixed(2);
          }
          return correction.toFixed(0).padStart(4, '0');
      }
    },
    this.mode,
    this.correction,
    this.isLightTestActive,
  );

  private readonly preSelBaroText = MappedSubject.create(
    ([correction, isVisible, isLightTest, mode]) => {
      if (isLightTest) {
        return '8p88'; // p is used as a standin character for the Q test character
      } else if (mode === BaroMode.Qfe) {
        return 'qfe';
      } else if (isVisible) {
        return correction < 100 ? correction.toFixed(2) : correction.toFixed(0).padStart(4, '0');
      } else {
        return '';
      }
    },
    this.correction,
    this.isPreSelVisible,
    this.isLightTestActive,
    this.mode,
  );

  render(): VNode | null {
    return (
      <div id="SmallScreen">
        <div id="Selected">
          <svg width="100%" height="100%" class="Baro">
            <text
              id="QNH"
              x="6%"
              y="23%"
              class={{
                Common: true,
                Label: true,
                Visible: this.isQnhLabelVisible,
              }}
            >
              QNH
            </text>
            <text id="PreSelBaroValue" class="Common Active" x="97%" y="30%" text-anchor="end">
              {this.preSelBaroText}
            </text>
            <text id="Value" class="Common Value" x="4%" y="95%">
              {this.baroText}
            </text>
          </svg>
        </div>
      </div>
    );
  }
}
