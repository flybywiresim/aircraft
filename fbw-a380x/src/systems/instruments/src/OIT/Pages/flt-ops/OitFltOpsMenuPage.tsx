//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subscription, VNode } from '@microsoft/msfs-sdk';
import { Button } from 'instruments/src/MFD/pages/common/Button';
import { AbstractOitPageProps } from 'instruments/src/OIT/OIT';

interface OitFltOpsMenuPageProps extends AbstractOitPageProps {}

export class OitFltOpsMenuPage extends DisplayComponent<OitFltOpsMenuPageProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    new Promise((resolve) => setTimeout(resolve, 500)).then(() => this.props.oit.uiService.navigateTo('back'));
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        {/* begin page content */}
        <div class="oit-page-container">
          <div class="fr">
            <div class="oit-flt-ops-menu-column">
              <div class="oit-flt-ops-menu-column-title">MISSION</div>
              {['CHARTS', 'FLT FOLDER'].map((s) => (
                <Button
                  label={s}
                  containerStyle="width: 300px; margin-bottom: 20px"
                  buttonStyle="padding: 10px;"
                  onClick={() => {}}
                />
              ))}
            </div>
            <div class="oit-flt-ops-menu-column">
              <div class="oit-flt-ops-menu-column-title">DOCUMENTATION</div>
              {['OPS LIBRARY'].map((s) => (
                <Button
                  label={s}
                  containerStyle="width: 300px; margin-bottom: 20px"
                  buttonStyle="padding: 10px;"
                  onClick={() => {}}
                />
              ))}
            </div>
            <div class="oit-flt-ops-menu-column">
              <div class="oit-flt-ops-menu-column-title">PERFORMANCE</div>
              {['T.O PERF', 'LOADSHEET', 'LDG PERF', 'IN-FLT PERF'].map((s) => (
                <Button
                  label={s}
                  containerStyle="width: 300px; margin-bottom: 20px"
                  buttonStyle="padding: 10px;"
                  onClick={() => {}}
                />
              ))}
            </div>
            <div class="oit-flt-ops-menu-column">
              <div class="oit-flt-ops-menu-column-title">UTILITIES</div>
              {['FLT OPS STS', 'LOAD BOX', 'EXPORT BOX'].map((s) => (
                <Button
                  label={s}
                  containerStyle="width: 300px; margin-bottom: 20px"
                  buttonStyle="padding: 10px;"
                  onClick={() => {}}
                />
              ))}
            </div>
          </div>
          <div style="flex-grow: 1" />
          <Button
            label={'EXIT SESSION'}
            containerStyle="width: 300px; margin-bottom: 20px; align-self: flex-end;"
            buttonStyle="padding: 10px;"
            onClick={() => {}}
          />
        </div>
        {/* end page content */}
      </>
    );
  }
}
