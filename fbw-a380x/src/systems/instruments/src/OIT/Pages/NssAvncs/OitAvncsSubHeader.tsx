//  Copyright (c) 2025 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0

import { DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { OitUiService } from '../../OitUiService';

interface OitAvncsSubHeaderProps {
  title: string;
  readonly uiService: OitUiService;
}

/*
 * Complete header for the OIS system, both AVNCS and FLT OPS.
 */
export abstract class OitAvncsSubHeader extends DisplayComponent<OitAvncsSubHeaderProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subs = [] as Subscription[];

  private readonly canGoBack = Subject.create(false);
  private readonly canGoForward = Subject.create(false);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.uiService.activeUri.sub(() => {
        this.canGoBack.set(!this.props.uiService.canGoBack());
        this.canGoForward.set(!this.props.uiService.canGoForward());
      }, true),
    );
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
      <div class="oit-header-row" style="padding-top: 10px;">
        <div class="oit-avncs-sub-header-title">{this.props.title}</div>
        <Button
          label={'HOME'}
          onClick={() => this.props.uiService.navigateTo('nss-avncs')}
          buttonStyle="width: 130px; font-size: 28px; height: 50px;"
        />
        <Button
          label={'BACK'}
          disabled={this.canGoBack}
          onClick={() => this.props.uiService.navigateTo('back')}
          buttonStyle="width: 130px; font-size: 28px; height: 50px; margin-left: 10px;"
        />
        <Button
          label={'FORWARD'}
          disabled={this.canGoForward}
          onClick={() => this.props.uiService.navigateTo('forward')}
          buttonStyle="width: 130px; font-size: 28px; height: 50px; margin-left: 10px;"
        />
        <Button
          label={'PRINT'}
          disabled={true}
          onClick={() => {}}
          buttonStyle="width: 130px; font-size: 28px; height: 50px; margin-left: 10px;"
        />
        <Button
          label={'UPDATE'}
          disabled={false}
          onClick={() => {}}
          buttonStyle="width: 130px; font-size: 28px; height: 50px; margin-left: 10px;"
        />
        <Button
          label={'HELP'}
          disabled={true}
          onClick={() => {}}
          buttonStyle="width: 130px; font-size: 28px; height: 50px; margin-left: 10px;"
        />
        <Button
          label={'CLOSE'}
          disabled={true}
          onClick={() => {}}
          buttonStyle="width: 130px; font-size: 28px; height: 50px; margin-left: 10px;"
        />
        <div style="flex-grow: 1;" />
      </div>
    );
  }
}
