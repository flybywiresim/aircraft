//  Copyright (c) 2023-2024 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import {
  ConsumerSubject,
  DebounceTimer,
  DisplayComponent,
  EventBus,
  FSComponent,
  MappedSubject,
  Subject,
  VNode,
} from '@microsoft/msfs-sdk';
import { OverheadEvents } from '../../MsfsAvionicsCommon/providers/OverheadPublisher';
import { BaroEvents } from '../Managers/BaroManager';

export interface BaroProps {
  readonly bus: EventBus;
}

export class Baro extends DisplayComponent<BaroProps> {
  private static readonly PRESEL_TIME = 4_000;

  private readonly sub = this.props.bus.getSubscriber<BaroEvents & OverheadEvents>();

  private readonly mode = ConsumerSubject.create(this.sub.on('baro_mode_1'), 'STD');

  private readonly correction = ConsumerSubject.create(this.sub.on('baro_correction_1'), 1013);

  private readonly isLightTestActive = ConsumerSubject.create(this.sub.on('ovhd_ann_lt_test_active'), false);

  private readonly isQnhLabelVisible = MappedSubject.create(
    ([mode, isLightTest]) => isLightTest || mode === 'QNH',
    this.mode,
    this.isLightTestActive,
  );

  private readonly isQfeLabelVisible = MappedSubject.create(
    ([mode, isLightTest]) => isLightTest || mode === 'QFE',
    this.mode,
    this.isLightTestActive,
  );

  private readonly isPreSelVisible = Subject.create(false);
  private readonly preSelVisibileTimer = new DebounceTimer();

  private readonly baroText = MappedSubject.create(
    ([mode, correction, isLightTest]) => {
      if (isLightTest) {
        return '88.88';
      }
      switch (mode) {
        case 'STD':
          return 'Std';
        case 'QNH':
        case 'QFE':
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
    ([correction, isVisible]) =>
      isVisible ? (correction < 100 ? correction.toFixed(2) : correction.toFixed(0).padStart(4, '0')) : '',
    this.correction,
    this.isPreSelVisible,
  );

  onAfterRender(_node: VNode): void {
    this.sub.on('baro_preselect_changed_1').handle(() => {
      this.isPreSelVisible.set(true);
      this.preSelVisibileTimer.schedule(() => this.isPreSelVisible.set(false), Baro.PRESEL_TIME);
    });
    this.mode.sub((v) => v !== 'STD' && this.isPreSelVisible.set(false));
  }

  render(): VNode | null {
    return (
      <div id="SmallScreen">
        <div id="Selected">
          <svg width="100%" height="100%" class="Baro">
            <text
              id="QNH"
              x="5%"
              y="26%"
              class={{
                Common: true,
                Label: true,
                Visible: this.isQnhLabelVisible,
              }}
            >
              QNH
            </text>
            <text
              id="QFE"
              x="40%"
              y="26%"
              class={{
                Common: true,
                Label: true,
                Visible: this.isQfeLabelVisible,
              }}
            >
              QFE
            </text>
            <text id="PreSelBaroValue" class="Common Active" x="100%" y="26%" text-anchor="end">
              {this.preSelBaroText}
            </text>
            <text id="Value" class="Common Value" x="4%" y="86%">
              {this.baroText}
            </text>
          </svg>
        </div>
      </div>
    );
  }
}
