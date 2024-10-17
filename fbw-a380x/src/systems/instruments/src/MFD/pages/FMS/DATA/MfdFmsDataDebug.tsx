/* eslint-disable max-len */

import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsDataStatus.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { TopTabNavigator, TopTabNavigatorPage } from 'instruments/src/MFD/pages/common/TopTabNavigator';
import { Arinc429Register } from '@flybywiresim/fbw-sdk';

interface MfdFmsDataDebugProps extends AbstractMfdPageProps {}
export class MfdFmsDataDebug extends FmsPage<MfdFmsDataDebugProps> {
  private selectedPageIndex = Subject.create<number>(0);

  private readonly facVls = Arinc429Register.empty();
  private readonly facV_a_prot = Arinc429Register.empty();
  private readonly facV_a_max = Arinc429Register.empty();

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
    this.tab1lineLabels[1].set('VLS (FMC)');
    this.tab1lineValues[1].set((SimVar.GetSimVarValue('L:A32NX_SPEEDS_VLS', 'number') as number).toFixed(2) ?? '');

    this.tab1lineLabels[2].set('V_A_PROT (FMC)');
    this.tab1lineValues[2].set(
      (SimVar.GetSimVarValue('L:A32NX_SPEEDS_ALPHA_PROTECTION_CALC', 'number') as number).toFixed(2) ?? '',
    );

    this.tab1lineLabels[3].set('V_A_MAX (FMC)');
    this.tab1lineValues[3].set(
      (SimVar.GetSimVarValue('L:A32NX_SPEEDS_ALPHA_MAX_CALC', 'number') as number).toFixed(2) ?? '',
    );

    this.facVls.set(SimVar.GetSimVarValue('L:A32NX_FAC_1_V_LS', 'number'));
    this.tab1lineLabels[5].set('VLS (PSEUDO FAC)');
    this.tab1lineValues[5].set(this.facVls.value.toFixed(1));

    this.facV_a_prot.set(SimVar.GetSimVarValue('L:A32NX_FAC_1_V_ALPHA_PROT', 'number'));
    this.tab1lineLabels[6].set('V_A_PROT (PSEUDO FAC)');
    this.tab1lineValues[6].set(this.facV_a_prot.value.toFixed(1));

    this.facV_a_max.set(SimVar.GetSimVarValue('L:A32NX_FAC_1_V_ALPHA_LIM', 'number'));
    this.tab1lineLabels[7].set('V_A_MAX (PSEUDO FAC)');
    this.tab1lineValues[7].set(this.facV_a_max.value.toFixed(1));

    this.tab1lineLabels[8].set('FAC SSM');
    this.tab1lineValues[8].set(this.facVls.ssm.toFixed(0));

    this.tab1lineLabels[10].set('GD SPEED (FCOM LOOKUP)');
    this.tab1lineValues[10].set((SimVar.GetSimVarValue('L:A32NX_SPEEDS_GD', 'number') as number).toFixed(2) ?? '');
    this.tab1lineLabels[11].set('F SPEED (FCOM LOOKUP)');
    this.tab1lineValues[11].set((SimVar.GetSimVarValue('L:A32NX_SPEEDS_F', 'number') as number).toFixed(2) ?? '');
    this.tab1lineLabels[12].set('S SPEED (FCOM LOOKUP)');
    this.tab1lineValues[12].set((SimVar.GetSimVarValue('L:A32NX_SPEEDS_S', 'number') as number).toFixed(2) ?? '');
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
