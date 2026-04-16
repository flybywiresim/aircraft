// Copyright (c) 2024-2026 FlyByWire Simulations
//
import { FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from '../../MFD';
import { FmsPage } from '../common/FmsPage';
import { TopTabNavigator } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/TopTabNavigator';
import { Footer } from '../common/Footer';

// SPDX-License-Identifier: GPL-3.0
interface MfdFmsWindProps extends AbstractMfdPageProps {}

enum WindPageMenu {
  History,
  Climb,
  Cruise,
  Descent,
}

export class MfdFmsWindPage extends FmsPage<MfdFmsWindProps> {
  private readonly selectedTabIndex = Subject.create(WindPageMenu.Climb);

  // History Wind

  // Climb Wind

  // Cruise Wind

  // Descent Wind

  private readonly navigationSelectedWptIndex = this.props.mfd.uiService.activeUri.get().extra;

  protected onNewData(): void {
    throw new Error('Method not implemented.');
  }

  destroy() {
    super.destroy();
  }

  public onAfterRender(node: VNode) {
    super.onAfterRender(node);
  }

  public render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-fms-wind-page-header"></div>
        <TopTabNavigator
          pageTitles={['HISTORY', 'CLB', 'CRZ', 'DES']}
          selectedPageIndex={this.selectedTabIndex}
        ></TopTabNavigator>
        <div style="flex-grow: 1;" />
        {/* fill space vertically */}
        <Footer
          bus={this.props.bus}
          mfd={this.props.mfd}
          fmcService={this.props.fmcService}
          flightPlanInterface={this.props.fmcService.master.flightPlanInterface}
        />
      </>
    );
  }
}
