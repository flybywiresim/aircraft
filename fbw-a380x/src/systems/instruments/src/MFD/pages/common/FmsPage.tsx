//  Copyright (c) 2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import {
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  SubscribableMapFunctions,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from '../../MFD';
import { dataStatusUri, flightPlanUriPage, fuelAndLoadPage, lateralRevisionHoldPage } from '../../shared/utils';
import { ActivePageTitleBar } from './ActivePageTitleBar';

export abstract class FmsPage<T extends AbstractMfdPageProps = AbstractMfdPageProps> extends DisplayComponent<T> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subs = [] as Subscription[];

  protected readonly activePageTitle = Subject.create<string>('');

  protected readonly eoActive = Subject.create<boolean>(false);

  private readonly penaltyActive = Subject.create<boolean>(false);

  /** Penalty is only displayed in DATA STATUS, FUEL & LOAD, F-PLN, HOLD, ALTERNATE & WHAT IF Pages */
  private readonly penaltyUri = this.props.mfd.uiService.activeUri.map(
    (uri) =>
      uri.uri === dataStatusUri ||
      uri.page === fuelAndLoadPage ||
      uri.page === flightPlanUriPage ||
      uri.page === lateralRevisionHoldPage,
  );

  protected readonly displayPenalty = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.penaltyUri,
    this.penaltyActive,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    this.subs.push(
      this.props.mfd.uiService.activeUri.sub((val) => {
        this.activePageTitle.set(`${val.category.toUpperCase()}/${this.props.pageTitle}`);
      }, true),
      this.props.fmcService.masterFmcChanged.sub(() => {
        // Check if master FMC exists, re-route subjects
        this.props.fmcService.master.fmgc.data.engineOut.pipe(this.eoActive);
        this.props.fmcService.master.fmgc.data.fuelPenaltyActive.pipe(this.penaltyActive);
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
      <ActivePageTitleBar
        activePage={this.activePageTitle}
        offset={Subject.create('')}
        eoIsActive={this.eoActive}
        penaltyIsActive={this.displayPenalty}
        isFmsSubsystemPage={true}
      />
    );
  }
}
