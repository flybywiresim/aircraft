import { ConsumerSubject, DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';

import './MfdSurvStatusSwitching.scss';

import { MfdSurvEvents } from 'instruments/src/MsfsAvionicsCommon/providers/MfdSurvPublisher';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';

interface MfdSurvStatusSwitchingProps extends AbstractMfdPageProps {}

export class MfdSurvStatusSwitching extends DisplayComponent<MfdSurvStatusSwitchingProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private readonly sub = this.props.bus.getSubscriber<MfdSimvars & MfdSurvEvents>();

  private readonly tcas1Failed = ConsumerSubject.create(this.sub.on('tcasFail'), true);

  private readonly activeSystemWxr = Subject.create<number>(1);

  private readonly activeSystemTaws = Subject.create<number>(1);

  private readonly activeSystemXpdr = Subject.create<number>(1);

  private readonly activeSystemTcas = Subject.create<number>(1);

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
          <div style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; align-items: top; padding: 30px;">
            {/* upper left sys box */}
            <div class="sys-box-upper">
              <div class="mfd-label bigger" style="display: flex; justify-content: center; margin-bottom: 15px;">
                SYS 1
              </div>
              <span></span>
              <div
                class={{
                  'sys-group': true,
                  active: this.activeSystemWxr.get() === 1,
                }}
                style="margin-bottom: 10px;"
              >
                <div class={{ 'sys-status-item': true }} style="margin-bottom: 10px;">
                  WX DISPLAY 1
                </div>
                <div class={{ 'sys-status-item': true }} style="margin-bottom: 10px">
                  TURB 1
                </div>
                <div class={{ 'sys-status-item': true }}>PRED W/S 1</div>
              </div>
              <div class={{ 'sys-group': true, active: this.activeSystemTaws.get() === 1 }}>
                <div class={{ 'sys-status-item': true }} style="margin-bottom: 10px">
                  TERR SYS 1
                </div>
                <div class={{ 'sys-status-item': true }}>GPWS 1</div>
              </div>
            </div>
            {/* upper middle text */}
            <div style="display: flex; flex-direction: column; align-items: center;">
              <div class="mfd-label bigger" style="position: relative; top: 80px;">
                WXR
              </div>
              <div class="mfd-label bigger" style="position: relative; top: 180px;">
                TAWS
              </div>
            </div>
            {/* upper right sys box */}
            <div class="sys-box-upper">
              <div class="mfd-label bigger" style="display: flex; justify-content: center; margin-bottom: 15px;">
                SYS 2
              </div>
              <div class={{ 'sys-group': true, active: this.activeSystemWxr.get() === 2 }} style="margin-bottom: 10px;">
                <div class={{ 'sys-status-item': true }} style="margin-bottom: 10px;">
                  WX DISPLAY 2
                </div>
                <div class={{ 'sys-status-item': true }} style="margin-bottom: 10px">
                  TURB 2
                </div>
                <div class={{ 'sys-status-item': true }}>PRED W/S 2</div>
              </div>
              <div class={{ 'sys-group': true, active: this.activeSystemTaws.get() === 2 }}>
                <div class={{ 'sys-status-item': true }} style="margin-bottom: 10px">
                  TERR SYS 2
                </div>
                <div class={{ 'sys-status-item': true }}>GPWS 2</div>
              </div>
            </div>
          </div>
          {/* lower line */}
          <div style="width: 100%; display: flex; flex-direction: row; justify-content: space-between; align-items: top; padding: 30px;">
            {/* lower left sys box */}
            <div class="sys-box-lower">
              <div class="mfd-label bigger" style="display: flex; justify-content: center; margin-bottom: 15px;">
                SYS 1
              </div>
              <div class={{ 'sys-group': true, active: this.activeSystemXpdr.get() === 1 }}>
                <div class={{ 'sys-status-item': true, active: this.activeSystemXpdr.get() === 1 }}>XPDR 1</div>
              </div>
              <div class={{ 'sys-group': true, active: this.activeSystemTcas.get() === 1, failed: this.tcas1Failed }}>
                <div class={{ 'sys-status-item': true, failed: this.tcas1Failed }}>TCAS 1</div>
              </div>
            </div>
            {/* lower middle text */}
            <div style="display: flex; flex-direction: column; align-items: center">
              <div class="mfd-label bigger" style="position: relative; top: 80px;">
                XPDR
              </div>
              <div class="mfd-label bigger" style="position: relative; top: 110px;">
                TCAS
              </div>
            </div>
            {/* lower right sys box */}
            <div class="sys-box-lower">
              <div class="mfd-label bigger" style="display: flex; justify-content: center; margin-bottom: 15px;">
                SYS 2
              </div>
              <div class={{ 'sys-group': true, active: this.activeSystemXpdr.get() === 2 }}>
                <div class={{ 'sys-status-item': true }}>XPDR 2</div>
              </div>
              <div class={{ 'sys-group': true, active: this.activeSystemTcas.get() === 2 }}>
                <div class={{ 'sys-status-item': true }}>TCAS 2</div>
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
