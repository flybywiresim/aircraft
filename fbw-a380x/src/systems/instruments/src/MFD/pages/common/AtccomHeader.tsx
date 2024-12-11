import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractHeader } from 'instruments/src/MFD/pages/common/AbstractHeader';
import { PageSelectorDropdownMenu } from 'instruments/src/MFD/pages/common/PageSelectorDropdownMenu';

/*
 * Complete header for the ATCCOM system
 */
export class AtccomHeader extends AbstractHeader {
  private connectIsSelected = Subject.create(false);

  private requestIsSelected = Subject.create(false);

  private reportModifyIsSelected = Subject.create(false);

  private msgRecordIsSelected = Subject.create(false);

  private atisIsSelected = Subject.create(false);

  private emerIsSelected = Subject.create(false);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.uiService.activeUri.sub((val) => {
        this.connectIsSelected.set(val.category === 'connect');
        this.requestIsSelected.set(val.category === 'request');
        this.reportModifyIsSelected.set(val.category === 'report-modify');
        this.msgRecordIsSelected.set(val.category === 'msg-record');
        this.atisIsSelected.set(val.category === 'd-atis');
        this.emerIsSelected.set(val.category === 'emer');
      }, true),
    );
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

    super.destroy();
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        <div class="mfd-header-page-select-row">
          <PageSelectorDropdownMenu
            isActive={this.connectIsSelected}
            label="CONNECT"
            menuItems={[{ label: '', action: () => this.props.uiService.navigateTo('atccom/connect') }]}
            idPrefix={`${this.props.uiService.captOrFo}_MFD_pageSelectorConnect`}
            containerStyle="flex: 1"
          />
          <PageSelectorDropdownMenu
            isActive={this.requestIsSelected}
            label="REQUEST"
            menuItems={[{ label: '', action: () => this.props.uiService.navigateTo('atccom/request') }]}
            idPrefix={`${this.props.uiService.captOrFo}_MFD_pageSelectorRequest`}
            containerStyle="flex: 1"
          />
          <PageSelectorDropdownMenu
            isActive={this.reportModifyIsSelected}
            label="REPORT<br /> & NOTIFY"
            menuItems={[{ label: '', action: () => this.props.uiService.navigateTo('atccom/report-modify/position') }]}
            idPrefix={`${this.props.uiService.captOrFo}_MFD_pageSelectorReportModify`}
            containerStyle="flex: 1.2"
            labelStyle="margin-top: 0; margin-bottom: 0; padding-top: 2px; padding-bottom: 2px"
          />
          <PageSelectorDropdownMenu
            isActive={this.msgRecordIsSelected}
            label="MSG RECORD"
            menuItems={[{ label: '', action: () => this.props.uiService.navigateTo('atccom/msg-record') }]}
            idPrefix={`${this.props.uiService.captOrFo}_MFD_pageSelectorMsgRecord`}
            containerStyle="flex: 1"
            labelStyle="margin-top: 0; margin-bottom: 0; padding-top: 2px; padding-bottom: 2px"
          />
          <PageSelectorDropdownMenu
            isActive={this.atisIsSelected}
            label="D-ATIS"
            menuItems={[{ label: '', action: () => this.props.uiService.navigateTo('atccom/d-atis/list') }]}
            idPrefix={`${this.props.uiService.captOrFo}_MFD_pageSelectorAtis`}
            containerStyle="flex: 1"
          />
          <PageSelectorDropdownMenu
            isActive={this.emerIsSelected}
            label="EMER"
            menuItems={[{ label: '', action: () => this.props.uiService.navigateTo('atccom/emer') }]}
            idPrefix={`${this.props.uiService.captOrFo}_MFD_pageSelectorEmer`}
            containerStyle="flex: 1"
            labelStyle="color: #000; background-color: #ff9601; background-clip: content-box"
          />
        </div>
      </>
    );
  }
}
