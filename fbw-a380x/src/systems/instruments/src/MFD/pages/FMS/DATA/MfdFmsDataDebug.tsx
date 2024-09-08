/* eslint-disable max-len */

import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsDataStatus.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';

interface MfdFmsDataDebugProps extends AbstractMfdPageProps {}
export class MfdFmsDataDebug extends FmsPage<MfdFmsDataDebugProps> {
  private selectedPageIndex = Subject.create<number>(0);

  private tab1lineLabels = [
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
  ];

  private tab1lineValues = [
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
    Subject.create<string>(''),
  ];

  protected onNewData() {
    this.tab1lineLabels[1].set('VLS (AOA)');
    this.tab1lineValues[1].set((SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number') as number).toFixed(2) ?? '');

    this.tab1lineLabels[2].set('V_A_PROT (AOA)');
    this.tab1lineValues[2].set(
      (SimVar.GetSimVarValue('L:A32NX_SPEEDS_ALPHA_PROTECTION_CALC', 'number') as number).toFixed(2) ?? '',
    );

    this.tab1lineLabels[3].set('V_A_MAX (AOA)');
    this.tab1lineValues[3].set(
      (SimVar.GetSimVarValue('L:A32NX_SPEEDS_ALPHA_MAX_CALC', 'number') as number).toFixed(2) ?? '',
    );

    this.tab1lineLabels[5].set('VLS (FCOM)');
    this.tab1lineValues[5].set((SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS_FCOM', 'number') as number).toFixed(2) ?? '');

    this.tab1lineLabels[6].set('V_A_PROT (FCOM)');
    this.tab1lineValues[6].set(
      (SimVar.GetSimVarValue('L:A32NX_SPEEDS_ALPHA_PROTECTION_CALC_FCOM', 'number') as number).toFixed(2) ?? '',
    );

    this.tab1lineLabels[7].set('V_A_MAX (FCOM)');
    this.tab1lineValues[7].set(
      (SimVar.GetSimVarValue('L:A32NX_SPEEDS_ALPHA_MAX_CALC_FCOM', 'number') as number).toFixed(2) ?? '',
    );

    this.tab1lineLabels[9].set('GD SPEED (FCOM)');
    this.tab1lineValues[9].set((SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number') as number).toFixed(2) ?? '');
    this.tab1lineLabels[10].set('F SPEED (FCOM)');
    this.tab1lineValues[10].set((SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number') as number).toFixed(2) ?? '');
    this.tab1lineLabels[11].set('S SPEED (FCOM)');
    this.tab1lineValues[11].set((SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number') as number).toFixed(2) ?? '');
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();
    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(2)
        .handle((_t) => {
          this.onNewData();
        }),
    );
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <TopTabNavigator
            pageTitles={Subject.create(['FMGC', 'N/A'])}
            selectedPageIndex={this.selectedPageIndex}
            pageChangeCallback={(val) => this.selectedPageIndex.set(val)}
            selectedTabTextColor="white"
            tabBarSlantedEdgeAngle={25}
          >
            <TopTabNavigatorPage>
              {/* FMGC */}
              {this.tab1lineLabels.map((_, idx) => (
                <div style="margin-bottom: 10px;">
                  <span class="mfd-label" style="margin-right: 25px;">
                    {this.tab1lineLabels[idx]}
                  </span>
                  <span class="mfd-value bigger">{this.tab1lineValues[idx]}</span>
                </div>
              ))}
            </TopTabNavigatorPage>
            <TopTabNavigatorPage>{/* N/A */}</TopTabNavigatorPage>
          </TopTabNavigator>
          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
        </div>
        <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
      </>
    );
  }
}
