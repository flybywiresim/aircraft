//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { AbstractOitFltOpsPageProps } from '../../OIT';

interface OitFltOpsMenuPageProps extends AbstractOitFltOpsPageProps {}

export class OitFltOpsMenuPage extends DisplayComponent<OitFltOpsMenuPageProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    for (const s of this.subs) {
      s.destroy();
    }

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
              <Button
                label={'FLT FOLDER'}
                containerStyle="width: 300px; margin-bottom: 20px"
                onClick={() => this.props.uiService.navigateTo('flt-ops/flt-folder')}
              />
              <Button
                label={'CHARTS'}
                containerStyle="width: 300px; margin-bottom: 20px"
                onClick={() => this.props.uiService.navigateTo('flt-ops/charts')}
              />
            </div>
            <div class="oit-flt-ops-menu-column">
              <div class="oit-flt-ops-menu-column-title">DOCUMENTATION</div>
              <Button
                label={'OPS LIBRARY'}
                containerStyle="width: 300px; margin-bottom: 20px"
                onClick={() => this.props.uiService.navigateTo('flt-ops/ops-library')}
                disabled={Subject.create(true)}
              />
            </div>
            <div class="oit-flt-ops-menu-column">
              <div class="oit-flt-ops-menu-column-title">PERFORMANCE</div>
              <Button
                label={'T.O PERF'}
                containerStyle="width: 300px; margin-bottom: 20px"
                onClick={() => this.props.uiService.navigateTo('flt-ops/to-perf')}
                disabled={Subject.create(true)}
              />
              <Button
                label={'LOADSHEET'}
                containerStyle="width: 300px; margin-bottom: 20px"
                onClick={() => this.props.uiService.navigateTo('flt-ops/loadsheet')}
                disabled={Subject.create(true)}
              />
              <Button
                label={'LDG PERF'}
                containerStyle="width: 300px; margin-bottom: 20px"
                onClick={() => this.props.uiService.navigateTo('flt-ops/ldg-perf')}
                disabled={Subject.create(true)}
              />
              <Button
                label={'IN-FLT PERF'}
                containerStyle="width: 300px; margin-bottom: 20px"
                onClick={() => this.props.uiService.navigateTo('flt-ops/in-flt-perf')}
                disabled={Subject.create(true)}
              />
            </div>
            <div class="oit-flt-ops-menu-column">
              <div class="oit-flt-ops-menu-column-title">UTILITIES</div>
              <Button
                label={'FLT OPS STS'}
                containerStyle="width: 300px; margin-bottom: 20px"
                onClick={() => this.props.uiService.navigateTo('flt-ops/sts')}
              />
              <Button
                label={'LOAD BOX'}
                containerStyle="width: 300px; margin-bottom: 20px"
                onClick={() => this.props.uiService.navigateTo('flt-ops/load-box')}
                disabled={Subject.create(true)}
              />
              <Button
                label={'EXPORT BOX'}
                containerStyle="width: 300px; margin-bottom: 20px"
                onClick={() => this.props.uiService.navigateTo('flt-ops/export-box')}
                disabled={Subject.create(true)}
              />
            </div>
          </div>
          <div style="flex-grow: 1" />
          <Button
            label={'EXIT SESSION'}
            containerStyle="width: 300px; margin-bottom: 20px; align-self: flex-end;"
            onClick={() => {}}
            disabled={Subject.create(true)}
          />
        </div>
        {/* end page content */}
      </>
    );
  }
}
