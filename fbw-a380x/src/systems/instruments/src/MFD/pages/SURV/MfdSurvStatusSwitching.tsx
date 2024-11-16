import { ConsumerSubject, DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import './MfdSurvStatusSwitching.scss';

import { MfdSurvEvents } from 'instruments/src/MsfsAvionicsCommon/providers/MfdSurvPublisher';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { SurvStatusButton } from 'instruments/src/MFD/pages/common/SurvStatusButton';
import { SurvStatusItem } from 'instruments/src/MFD/pages/common/SurvStatusItem';

interface MfdSurvStatusSwitchingProps extends AbstractMfdPageProps {}

export enum StatusItemState {
  Off = 0,
  On = 1,
  Failed = 2,
}

export class MfdSurvStatusSwitching extends DisplayComponent<MfdSurvStatusSwitchingProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private readonly sub = this.props.bus.getSubscriber<MfdSimvars & MfdSurvEvents>();

  private readonly tcas1Failed = ConsumerSubject.create(this.sub.on('tcasFail'), true);

  private readonly wxr1Failed = Subject.create<boolean>(false);

  private readonly turb1Failed = Subject.create<boolean>(false);

  private readonly predWs1Failed = Subject.create<boolean>(false);

  private readonly xpdr1Failed = Subject.create<boolean>(false);

  private readonly terr1Failed = Subject.create<boolean>(false);

  private readonly gpws1Failed = Subject.create<boolean>(false);

  private readonly wxr2Failed = Subject.create<boolean>(false);

  private readonly turb2Failed = Subject.create<boolean>(false);

  private readonly predWs2Failed = Subject.create<boolean>(false);

  private readonly terr2Failed = Subject.create<boolean>(false);

  private readonly gpws2Failed = Subject.create<boolean>(false);

  private readonly xpdr2Failed = Subject.create<boolean>(false);

  private readonly tcas2Failed = Subject.create<boolean>(false);

  private readonly activeSystemGroupXpdrTcas = Subject.create<number>(1);

  private readonly activeSystemGroupXpdr = Subject.create<number>(1);

  private readonly activeSystemGroupTcas = Subject.create<number>(1);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    this.subs.forEach((x) => x.destroy());

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
                active={Subject.create(true)}
                onClick={() => console.log('button clicked')}
              />
              <div
                class={{
                  'sys-group': true,
                  active: Subject.create(true),
                }}
                style="margin-bottom: 10px;"
              >
                <SurvStatusItem
                  label={'WXR DISPLAY'}
                  sys={'1'}
                  active={true}
                  failed={this.wxr1Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem
                  label={'TURB'}
                  sys={'1'}
                  active={true}
                  failed={this.turb1Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem label={'PRED W/S'} sys={'1'} active={true} failed={this.predWs1Failed} />
              </div>
              <div class={{ 'sys-group': true, active: Subject.create(true) }}>
                <SurvStatusItem
                  label={'TERR SYS'}
                  sys={'1'}
                  active={true}
                  failed={this.terr1Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem label={'GPWS'} sys={'1'} active={true} failed={this.gpws1Failed} />
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
                active={Subject.create(false)}
                onClick={() => console.log('button clicked')}
              />
              <div
                class={{
                  'sys-group': true,
                  active: Subject.create(false),
                }}
                style="margin-bottom: 10px;"
              >
                <SurvStatusItem
                  label={'WXR DISPLAY'}
                  sys={'2'}
                  active={false}
                  failed={this.wxr2Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem
                  label={'TURB'}
                  sys={'2'}
                  active={false}
                  failed={this.turb2Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem label={'PRED W/S'} sys={'2'} active={false} failed={this.predWs2Failed} />
              </div>
              <div class={{ 'sys-group': true, active: Subject.create(false) }}>
                <SurvStatusItem
                  label={'TERR SYS'}
                  sys={'2'}
                  active={false}
                  failed={this.terr2Failed}
                  style={'margin-bottom: 10px;'}
                />
                <SurvStatusItem label={'GPWS'} sys={'2'} active={false} failed={this.gpws2Failed} />
              </div>
            </div>
          </div>
          {/* lower line */}
          <div style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; align-items: top; padding: 50px;">
            {/* lower left sys box */}
            <div class="sys-box">
              <SurvStatusButton label={'SYS 1'} active={Subject.create(this.activeSystemGroupXpdrTcas.get() === 1)} />
              <div
                class={{ 'sys-group': true, active: Subject.create(this.activeSystemGroupXpdr.get() === 1) }}
                style="margin-bottom: 5px;"
              >
                <SurvStatusItem label={'XPDR'} sys={'1'} active={true} failed={this.xpdr1Failed} />
              </div>
              <div class={{ 'sys-group': true, active: Subject.create(this.activeSystemGroupTcas.get() === 1) }}>
                <SurvStatusItem label={'TCAS'} sys={'1'} active={true} failed={this.tcas1Failed} />
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
                active={Subject.create(false)}
                onClick={() => console.log('button clicked')}
              />
              <div
                class={{ 'sys-group': true, active: Subject.create(this.activeSystemGroupXpdr.get() === 2) }}
                style="margin-bottom: 5px;"
              >
                <SurvStatusItem label={'XPDR'} sys={'2'} active={false} failed={this.xpdr2Failed} />
              </div>
              <div class={{ 'sys-group': true, active: Subject.create(this.activeSystemGroupTcas.get() === 2) }}>
                <SurvStatusItem label={'TCAS'} sys={'2'} active={false} failed={this.tcas2Failed} />
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
