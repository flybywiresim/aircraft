//  Copyright (c) 2025-2026 FlyByWire Simulations
//  SPDX-License-Identifier: GPL-3.0
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { ClockEvents, ConsumerSubject, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { FmgcFlightPhase } from '@shared/flightphase';
import { AbstractMfdPageProps } from '../../MFD';
import { NXSystemMessages } from '../../shared/NXSystemMessages';
import { ActivePageTitleBar } from './ActivePageTitleBar';
import { MfdSimvars } from '../../shared/MFDSimvarPublisher';
import { FlightPlanEvents } from '@fmgc/flightplanning/sync/FlightPlanEvents';
import { ReadonlyFlightPlan } from '@fmgc/flightplanning/plans/ReadonlyFlightPlan';
import { AlternateFlightPlan } from '@fmgc/flightplanning/plans/AlternateFlightPlan';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { initPage } from '../../shared/utils';
import { FmsPage } from './FmsPage';

export abstract class FmsFlightPlanPage<T extends AbstractMfdPageProps = AbstractMfdPageProps> extends FmsPage<T> {
  private readonly sub = this.props.bus.getSubscriber<MfdSimvars>();

  public loadedFlightPlan: ReadonlyFlightPlan<FlightPlanPerformanceData> | null = null;

  public loadedAlternateFlightPlan: AlternateFlightPlan<FlightPlanPerformanceData> | null = null;

  protected readonly loadedFlightPlanIndex = Subject.create<FlightPlanIndex>(FlightPlanIndex.Active);

  protected readonly currentFlightPlanVersion = Subject.create<number>(0);

  /** Indicates whether the temporary flight plan is the loaded flightplan */
  protected readonly tmpyActive = this.loadedFlightPlanIndex.map((index) => index === FlightPlanIndex.Temporary);

  protected readonly secActive = Subject.create<boolean>(false);

  protected readonly activeFlightPhase = ConsumerSubject.create<FmgcFlightPhase>(
    this.sub.on('flightPhase'),
    FmgcFlightPhase.Preflight,
  );

  private readonly periodicNewDataCheck = this.props.bus
    .getSubscriber<ClockEvents>()
    .on('realTime')
    .atFrequency(1)
    .handle(() => {
      this.currentFlightPlanVersion.set(this.loadedFlightPlan?.version ?? 0);
    });

  // protected mfdInViewConsumer: Consumer<boolean>;

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(this.periodicNewDataCheck, this.tmpyActive);

    // this.mfdInViewConsumer = sub.on(this.props.mfd.uiService.captOrFo === 'CAPT' ? 'leftMfdInView' : 'rightMfdInView');

    // Check if flight plan changed using flight plan sync bus events
    const flightPlanSyncSub = this.props.bus.getSubscriber<FlightPlanEvents>();

    this.subs.push(
      //FIXME. Should the pages listen to the events directly or get them from the FMC?
      flightPlanSyncSub.on('flightPlanManager.create').handle(() => {
        this.onFlightPlanChanged();
      }),
    );

    this.subs.push(
      flightPlanSyncSub.on('flightPlanManager.delete').handle((data) => {
        if (data.planIndex === this.loadedFlightPlan?.index) {
          this.onFlightPlanChanged();
        }
      }),
    );

    this.subs.push(
      flightPlanSyncSub.on('flightPlanManager.deleteAll').handle(() => {
        this.onFlightPlanChanged();
      }),
    );

    this.subs.push(
      flightPlanSyncSub.on('flightPlanManager.swap').handle((data) => {
        if (data.planIndex === this.loadedFlightPlan?.index || data.targetPlanIndex === this.loadedFlightPlan?.index) {
          this.onFlightPlanChanged();
        }
      }),
    );

    this.subs.push(
      flightPlanSyncSub.on('flightPlanManager.copy').handle((data) => {
        if (data.planIndex === this.loadedFlightPlan?.index || data.targetPlanIndex === this.loadedFlightPlan?.index) {
          this.onFlightPlanChanged();
        }
      }),
    );

    this.subs.push(
      this.currentFlightPlanVersion.sub(() => {
        this.onNewDataChecks();
        this.onNewData();
      }),
    );

    this.onFlightPlanChanged(false);
    this.onNewDataChecks();
    this.onNewData();
  }

  protected onFlightPlanChanged(dueToEvent = true) {
    const activeUri = this.props.mfd.uiService.activeUri.get();
    const hasTmpy = this.props.flightPlanInterface.hasTemporary;
    switch (activeUri.category) {
      case 'active':
        if (this.props.flightPlanInterface.hasActive || hasTmpy) {
          this.loadedFlightPlan = this.props.flightPlanInterface.activeOrTemporary ?? null;
          this.loadedAlternateFlightPlan = this.props.flightPlanInterface.get(
            hasTmpy ? FlightPlanIndex.Temporary : FlightPlanIndex.Active,
          ).alternateFlightPlan;
          this.loadedFlightPlanIndex.set(hasTmpy ? FlightPlanIndex.Temporary : FlightPlanIndex.Active);
        } else if (activeUri.page === initPage) {
          // Flight plan might not have been created yet
          this.loadedFlightPlanIndex.set(FlightPlanIndex.Active);
        }
        this.secActive.set(false);
        break;
      case 'sec1':
        if (this.props.flightPlanInterface.hasSecondary(1)) {
          this.loadedFlightPlan = this.props.flightPlanInterface.secondary(1) ?? null;
          this.loadedAlternateFlightPlan = this.props.flightPlanInterface.get(
            FlightPlanIndex.FirstSecondary,
          ).alternateFlightPlan;
        } else if (activeUri.page === initPage) {
          this.loadedFlightPlan = null;
          this.loadedAlternateFlightPlan = null;
          this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary);
        } else if (dueToEvent) {
          // If sec has been deleted, navigate to equivelant active page and load the active or tmpy.
          this.loadedFlightPlanIndex.set(hasTmpy ? FlightPlanIndex.Temporary : FlightPlanIndex.Active);
          this.props.mfd.uiService.navigateTo(activeUri.uri.replace('sec1', 'active'));
          return;
        }
        this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary);
        this.secActive.set(true);
        break;
      case 'sec2':
        if (this.props.flightPlanInterface.hasSecondary(2)) {
          this.loadedFlightPlan = this.props.flightPlanInterface.secondary(2) ?? null;
          this.loadedAlternateFlightPlan = this.props.flightPlanInterface.get(
            FlightPlanIndex.FirstSecondary + 1,
          ).alternateFlightPlan;
        } else if (activeUri.page === initPage) {
          this.loadedFlightPlan = null;
          this.loadedAlternateFlightPlan = null;
        } else if (dueToEvent) {
          this.loadedFlightPlanIndex.set(hasTmpy ? FlightPlanIndex.Temporary : FlightPlanIndex.Active);
          this.props.mfd.uiService.navigateTo(activeUri.uri.replace('sec2', 'active'));
          return;
        }
        this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary + 1);
        this.secActive.set(true);
        break;
      case 'sec3':
        if (this.props.flightPlanInterface.hasSecondary(3)) {
          this.loadedFlightPlan = this.props.flightPlanInterface.secondary(3) ?? null;
          this.loadedAlternateFlightPlan = this.props.flightPlanInterface.get(
            FlightPlanIndex.FirstSecondary + 2,
          ).alternateFlightPlan;
        } else if (activeUri.page === initPage) {
          this.loadedFlightPlan = null;
          this.loadedAlternateFlightPlan = null;
        } else if (dueToEvent) {
          this.loadedFlightPlanIndex.set(hasTmpy ? FlightPlanIndex.Temporary : FlightPlanIndex.Active);
          this.props.mfd.uiService.navigateTo(activeUri.uri.replace('sec3', 'active'));
          return;
        }
        this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary + 2);
        this.secActive.set(true);
        break;

      default:
        if (this.props.flightPlanInterface.hasActive || hasTmpy) {
          this.loadedFlightPlan = this.props.flightPlanInterface.activeOrTemporary ?? null;
          this.loadedAlternateFlightPlan =
            this.props.flightPlanInterface.get(hasTmpy ? FlightPlanIndex.Temporary : FlightPlanIndex.Active)
              .alternateFlightPlan ?? null;
          this.loadedFlightPlanIndex.set(hasTmpy ? FlightPlanIndex.Temporary : FlightPlanIndex.Active);
        }
        break;
    }
    this.onNewDataChecks();
    this.onNewData();
    this.currentFlightPlanVersion.set(this.loadedFlightPlan?.version ?? 0);
  }

  protected abstract onNewData(): void;

  private onNewDataChecks() {
    const fm = this.props.fmcService.master.fmgc.data;
    const fps = this.props.flightPlanInterface;
    const activeFlightPlan = fps?.hasActive ? fps.active : undefined;
    const pdActive = activeFlightPlan?.performanceData;

    // CHECK TO DATA
    if (activeFlightPlan && pdActive && activeFlightPlan.originRunway) {
      if (!fm?.vSpeedsForRunway.get()) {
        fm?.vSpeedsForRunway.set(activeFlightPlan.originRunway.ident);
      } else if (fm.vSpeedsForRunway.get() !== activeFlightPlan.originRunway.ident) {
        fm.vSpeedsForRunway.set(activeFlightPlan.originRunway.ident);
        fm.v1ToBeConfirmed.set(pdActive?.v1.get() ?? null);
        fps?.setPerformanceData('v1', null, FlightPlanIndex.Active);
        fm.vrToBeConfirmed.set(pdActive?.vr.get() ?? null);
        fps?.setPerformanceData('vr', null, FlightPlanIndex.Active);
        fm.v2ToBeConfirmed.set(pdActive?.v2.get() ?? null);
        fps?.setPerformanceData('v2', null, FlightPlanIndex.Active);
        this.props.fmcService.master.addMessageToQueue(
          NXSystemMessages.checkToData,
          () => activeFlightPlan.performanceData.vr.get() !== null,
          undefined,
        );
      }
    }

    this.props.fmcService.master.acInterface.updateFmsData();
  }

  public destroy(): void {
    super.destroy();
  }

  render(): VNode {
    return (
      <ActivePageTitleBar
        activePage={this.activePageTitle}
        offset={Subject.create('')}
        eoIsActive={this.eoActive}
        tmpyIsActive={this.tmpyActive}
        penaltyIsActive={this.displayPenalty}
        isFmsSubsystemPage={true}
      />
    );
  }
}
