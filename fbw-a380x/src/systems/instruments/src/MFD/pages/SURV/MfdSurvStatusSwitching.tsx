import {
  ConsumerSubject,
  DisplayComponent,
  FSComponent,
  SimVarValueType,
  Subject,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

import './MfdSurvStatusSwitching.scss';

import { MfdSurvEvents } from 'instruments/src/MsfsAvionicsCommon/providers/MfdSurvPublisher';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { SurvStatusButton } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/SurvStatusButton';
import { SurvStatusItem } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/SurvStatusItem';

interface MfdSurvStatusSwitchingProps extends AbstractMfdPageProps {}

export enum StatusItemState {
  Off = 0,
  On = 1,
  Failed = 2,
}

export class MfdSurvStatusSwitching extends DisplayComponent<MfdSurvStatusSwitchingProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private readonly subs = [] as Subscription[];

  private readonly sub = this.props.bus.getSubscriber<MfdSimvars & MfdSurvEvents>();

  private readonly tcas1Failed = ConsumerSubject.create(this.sub.on('tcasFail'), true);

  private readonly wxr1Failed = Subject.create<boolean>(false);

  private readonly turb1Failed = Subject.create<boolean>(false);

  private readonly predWs1Failed = Subject.create<boolean>(false);

  private readonly xpdr1Failed = Subject.create<boolean>(false);

  private readonly terr1Failed = ConsumerSubject.create(this.sub.on('terr1Failed'), false);

  private readonly gpws1Failed = ConsumerSubject.create(this.sub.on('gpws1Failed'), false);

  private readonly wxr2Failed = Subject.create<boolean>(false);

  private readonly turb2Failed = Subject.create<boolean>(false);

  private readonly predWs2Failed = Subject.create<boolean>(false);

  private readonly terr2Failed = ConsumerSubject.create(this.sub.on('terr2Failed'), false);

  private readonly gpws2Failed = ConsumerSubject.create(this.sub.on('gpws2Failed'), false);

  private readonly xpdr2Failed = Subject.create<boolean>(false);

  private readonly tcas2Failed = Subject.create<boolean>(false);

  private readonly activeSystemGroupWxrTaws = ConsumerSubject.create(this.sub.on('wxrTawsSysSelected'), 0);
  private readonly wxrTaws1Active = this.activeSystemGroupWxrTaws.map((s) => s === 1);
  private readonly wxrTaws2Active = this.activeSystemGroupWxrTaws.map((s) => s === 2);

  private readonly activeSystemGroupXpdrTcas = Subject.create<number>(1);
  private readonly xpdrTcas1Active = this.activeSystemGroupXpdrTcas.map((s) => s === 1);
  private readonly xpdrTcas2Active = this.activeSystemGroupXpdrTcas.map((s) => s === 2);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.tcas1Failed,
      this.terr1Failed,
      this.gpws1Failed,
      this.terr2Failed,
      this.gpws2Failed,
      this.activeSystemGroupWxrTaws,
      this.wxrTaws1Active,
      this.wxrTaws2Active,
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
      <>
        <ActivePageTitleBar
          activePage={Subject.create('STATUS & SWITCHING')}
          offset={Subject.create('')}
          eoIsActive={Subject.create(false)}
          tmpyIsActive={Subject.create(false)}
        />
        {/* begin page content */}
        <div class="mfd-page-container">
          <div style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; align-items: top; padding: 50px;">
            {/* upper left sys box */}
            <div class="sys-box">
              <SurvStatusButton
                label={'SYS 1'}
                active={this.wxrTaws1Active}
                onClick={() =>
                  SimVar.SetSimVarValue(
                    'L:A32NX_WXR_TAWS_SYS_SELECTED',
                    SimVarValueType.Number,
                    this.wxrTaws1Active.get() ? 0 : 1,
                  )
                }
              />
              <div
                class={{
                  'sys-group': true,
                  active: this.wxrTaws1Active,
                }}
                style="margin-bottom: 10px;"
              >
                <SurvStatusItem
                  label={'WXR DISPLAY'}
                  sys={'1'}
                  active={this.wxrTaws1Active}
                  failed={this.wxr1Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem
                  label={'TURB'}
                  sys={'1'}
                  active={this.wxrTaws1Active}
                  failed={this.turb1Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem label={'PRED W/S'} sys={'1'} active={this.wxrTaws1Active} failed={this.predWs1Failed} />
              </div>
              <div class={{ 'sys-group': true, active: this.wxrTaws1Active }}>
                <SurvStatusItem
                  label={'TERR SYS'}
                  sys={'1'}
                  active={this.wxrTaws1Active}
                  failed={this.terr1Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem label={'GPWS'} sys={'1'} active={this.wxrTaws1Active} failed={this.gpws1Failed} />
              </div>
            </div>
            {/* upper middle text */}
            <div style="text-align: center;">
              <div class="mfd-label bigger" style="margin-top: 55px;">
                WXR
              </div>
              <div class="mfd-label bigger" style="margin-top: 90px;">
                TAWS
              </div>
            </div>
            {/* upper right sys box */}
            <div class="sys-box">
              <SurvStatusButton
                label={'SYS 2'}
                active={this.wxrTaws2Active}
                onClick={() =>
                  SimVar.SetSimVarValue(
                    'L:A32NX_WXR_TAWS_SYS_SELECTED',
                    SimVarValueType.Number,
                    this.wxrTaws2Active.get() ? 0 : 2,
                  )
                }
              />
              <div
                class={{
                  'sys-group': true,
                  active: this.wxrTaws2Active,
                }}
                style="margin-bottom: 10px;"
              >
                <SurvStatusItem
                  label={'WXR DISPLAY'}
                  sys={'2'}
                  active={this.wxrTaws2Active}
                  failed={this.wxr2Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem
                  label={'TURB'}
                  sys={'2'}
                  active={this.wxrTaws2Active}
                  failed={this.turb2Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem label={'PRED W/S'} sys={'2'} active={this.wxrTaws2Active} failed={this.predWs2Failed} />
              </div>
              <div class={{ 'sys-group': true, active: this.wxrTaws2Active }}>
                <SurvStatusItem
                  label={'TERR SYS'}
                  sys={'2'}
                  active={this.wxrTaws2Active}
                  failed={this.terr2Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem label={'GPWS'} sys={'2'} active={this.wxrTaws2Active} failed={this.gpws2Failed} />
              </div>
            </div>
          </div>
          {/* lower line */}
          <div style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; align-items: top; padding: 50px;">
            {/* lower left sys box */}
            <div class="sys-box">
              <SurvStatusButton label={'SYS 1'} active={this.xpdrTcas1Active} />
              <div class={{ 'sys-group': true, active: this.xpdrTcas1Active }} style="margin-bottom: 5px;">
                <SurvStatusItem label={'XPDR'} sys={'1'} active={this.xpdrTcas1Active} failed={this.xpdr1Failed} />
              </div>
              <div class={{ 'sys-group': true, active: this.xpdrTcas1Active }}>
                <SurvStatusItem label={'TCAS'} sys={'1'} active={this.xpdrTcas1Active} failed={this.tcas1Failed} />
              </div>
            </div>
            {/* lower middle text */}
            <div style="text-align: center;">
              <div class="mfd-label bigger" style="margin-top: 55px;">
                XPDR
              </div>
              <div class="mfd-label bigger" style="margin-top: 20px;">
                TCAS
              </div>
            </div>
            {/* lower right sys box */}
            <div class="sys-box">
              <SurvStatusButton
                label={'SYS 2'}
                active={this.xpdrTcas2Active}
                onClick={() => console.log('button clicked')}
              />
              <div class={{ 'sys-group': true, active: this.xpdrTcas2Active }} style="margin-bottom: 5px;">
                <SurvStatusItem label={'XPDR'} sys={'2'} active={this.xpdrTcas2Active} failed={this.xpdr2Failed} />
              </div>
              <div class={{ 'sys-group': true, active: this.xpdrTcas2Active }}>
                <SurvStatusItem label={'TCAS'} sys={'2'} active={this.xpdrTcas2Active} failed={this.tcas2Failed} />
              </div>
            </div>
          </div>
        </div>
        {/* end page content */}
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
