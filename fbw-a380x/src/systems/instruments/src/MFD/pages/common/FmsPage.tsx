import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlan } from '@fmgc/flightplanning/plans/FlightPlan';
import {
  DisplayComponent,
  FSComponent,
  MappedSubject,
  Subject,
  SubscribableMapFunctions,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import { FmgcFlightPhase } from '@shared/flightphase';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { NXSystemMessages } from 'instruments/src/MFD/shared/NXSystemMessages';
import { ActivePageTitleBar } from 'instruments/src/MFD/pages/common/ActivePageTitleBar';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { FlightPlanEvents } from '@fmgc/flightplanning/sync/FlightPlanEvents';
import { MfdSystem } from './MfdUiService';
import {
  dataStatusUri,
  fuelAndLoadPage,
  flightPlanUriPage,
  lateralRevisionHoldPage,
  performancePage,
  secIndexPageUri,
  initPage,
  dirToPage,
  airwaysPage,
  departurePage,
  arrivalPage,
  lateralRevisionPage,
  verticalRevisionPage,
} from '../../shared/utils';

export abstract class FmsPage<T extends AbstractMfdPageProps = AbstractMfdPageProps> extends DisplayComponent<T> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subs = [] as Subscription[];

  private newDataIntervalId: ReturnType<typeof setTimeout> | undefined = undefined;

  protected readonly activePageTitle = Subject.create<string>('');

  public loadedFlightPlan: FlightPlan | null = null;

  protected readonly loadedFlightPlanIndex = Subject.create<FlightPlanIndex>(FlightPlanIndex.Active);

  protected currentFlightPlanVersion: number = 0;

  protected readonly tmpyActive = Subject.create<boolean>(false);

  /** TMPY is only shown in PERF, FUEL & LOAD, INIT, SEC INDEX, WIND & FPLN + REVISION Pages (lat rev, vert rev, airways, hold, departure, arrival) */
  private readonly shouldShowTemporaryPageUris = this.props.mfd.uiService.activeUri.map(
    (uri) =>
      uri.sys === MfdSystem.Fms &&
      (uri.page === performancePage ||
        uri.page === fuelAndLoadPage ||
        uri.page === initPage ||
        uri.page === flightPlanUriPage ||
        uri.page === dirToPage ||
        uri.page === airwaysPage ||
        uri.page === departurePage ||
        uri.page === arrivalPage ||
        uri.page === lateralRevisionPage ||
        uri.page === lateralRevisionHoldPage ||
        uri.page === verticalRevisionPage ||
        uri.uri === secIndexPageUri),
  );

  private readonly displayTmpy = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.shouldShowTemporaryPageUris,
    this.tmpyActive,
  );

  protected readonly secActive = Subject.create<boolean>(false);

  protected readonly eoActive = Subject.create<boolean>(false);

  private readonly penaltyActive = Subject.create<boolean>(false);

  /** Penalty is only displayed in DATA STATUS, FUEL & LOAD, F-PLN, HOLD, ALTERNATE & WHAT IF Pages */
  private readonly penaltyUri = this.props.mfd.uiService.activeUri.map(
    (uri) =>
      uri.sys === MfdSystem.Fms &&
      (uri.uri === dataStatusUri ||
        uri.page === fuelAndLoadPage ||
        uri.page === flightPlanUriPage ||
        uri.page === lateralRevisionHoldPage),
  );

  private readonly displayPenalty = MappedSubject.create(
    SubscribableMapFunctions.and(),
    this.penaltyUri,
    this.penaltyActive,
  );

  protected readonly activeFlightPhase = Subject.create<FmgcFlightPhase>(FmgcFlightPhase.Preflight);

  // protected mfdInViewConsumer: Consumer<boolean>;

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<MfdSimvars>();

    this.subs.push(
      sub
        .on('flightPhase')
        .whenChanged()
        .handle((val) => {
          this.activeFlightPhase.set(val);
        }),
    );

    this.subs.push(this.penaltyUri, this.displayPenalty, this.shouldShowTemporaryPageUris, this.displayTmpy);

    // this.mfdInViewConsumer = sub.on(this.props.mfd.uiService.captOrFo === 'CAPT' ? 'leftMfdInView' : 'rightMfdInView');

    this.subs.push(
      this.props.mfd.uiService.activeUri.sub((val) => {
        this.activePageTitle.set(`${val.category.toUpperCase()}/${this.props.pageTitle}`);
      }, true),
    );

    // Check if flight plan changed using flight plan sync bus events
    const flightPlanSyncSub = this.props.bus.getSubscriber<FlightPlanEvents>();

    this.subs.push(
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
      this.props.fmcService.masterFmcChanged.sub(() => {
        // Check if master FMC exists, re-route subjects
        this.props.fmcService.master?.fmgc.data.engineOut.pipe(this.eoActive);
        this.props.fmcService.master?.fmgc.data.fuelPenaltyActive.pipe(this.penaltyActive);
      }, true),
    );

    this.onFlightPlanChanged();
    this.onNewDataChecks();
    this.onNewData();
    this.newDataIntervalId = setInterval(() => this.checkIfNewData(), 500);
  }

  protected checkIfNewData() {
    // Check for current flight plan, whether it has changed (TODO switch to Subscribable in the future)
    if (this.loadedFlightPlan?.version !== this.currentFlightPlanVersion) {
      this.onNewDataChecks();
      this.onNewData();
      this.currentFlightPlanVersion = this.loadedFlightPlan?.version ?? 0;
    }
  }

  protected onFlightPlanChanged() {
    switch (this.props.mfd.uiService.activeUri.get().category) {
      case 'active':
        if (
          this.props.fmcService.master?.flightPlanService.hasActive ||
          this.props.fmcService.master?.flightPlanService.hasTemporary
        ) {
          this.loadedFlightPlan = this.props.fmcService.master?.flightPlanService.activeOrTemporary ?? null;
          this.loadedFlightPlanIndex.set(
            this.props.fmcService.master?.flightPlanService.hasTemporary
              ? FlightPlanIndex.Temporary
              : FlightPlanIndex.Active,
          );
          this.secActive.set(false);
          this.tmpyActive.set(this.props.fmcService.master?.flightPlanService.hasTemporary ?? false);
        }
        break;
      case 'sec1':
        if (this.props.fmcService.master?.flightPlanService.hasSecondary(1)) {
          this.loadedFlightPlan = this.props.fmcService.master?.flightPlanService.secondary(1) ?? null;
          this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary);
          this.secActive.set(true);
          this.tmpyActive.set(false);
        }
        break;
      case 'sec2':
        if (this.props.fmcService.master?.flightPlanService.hasSecondary(2)) {
          this.loadedFlightPlan = this.props.fmcService.master?.flightPlanService.secondary(2) ?? null;
          this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary + 1);
          this.secActive.set(true);
          this.tmpyActive.set(false);
        }
        break;
      case 'sec3':
        if (this.props.fmcService.master?.flightPlanService.hasSecondary(3)) {
          this.loadedFlightPlan = this.props.fmcService.master?.flightPlanService.secondary(3) ?? null;
          this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary + 2);
          this.secActive.set(true);
          this.tmpyActive.set(false);
        }
        break;

      default:
        if (
          this.props.fmcService.master?.flightPlanService.hasActive ||
          this.props.fmcService.master?.flightPlanService.hasTemporary
        ) {
          this.loadedFlightPlan = this.props.fmcService.master?.flightPlanService.activeOrTemporary ?? null;
        }
        break;
    }
    this.onNewDataChecks();
    this.onNewData();
    this.currentFlightPlanVersion = this.loadedFlightPlan?.version ?? 0;
  }

  protected abstract onNewData(): void;

  private onNewDataChecks() {
    const fm = this.props.fmcService.master?.fmgc.data ?? null;
    const pd = this.loadedFlightPlan?.performanceData ?? null;

    if (this.loadedFlightPlan?.originRunway) {
      if (!fm?.vSpeedsForRunway.get()) {
        fm?.vSpeedsForRunway.set(this.loadedFlightPlan.originRunway.ident);
      } else if (fm.vSpeedsForRunway.get() !== this.loadedFlightPlan.originRunway.ident) {
        fm.vSpeedsForRunway.set(this.loadedFlightPlan.originRunway.ident);
        fm.v1ToBeConfirmed.set(pd?.v1.get() ?? null);
        this.loadedFlightPlan.setPerformanceData('v1', null);
        fm.vrToBeConfirmed.set(pd?.vr.get() ?? null);
        this.loadedFlightPlan.setPerformanceData('vr', null);
        fm.v2ToBeConfirmed.set(pd?.v2.get() ?? null);
        this.loadedFlightPlan.setPerformanceData('v2', null);

        this.props.fmcService.master?.addMessageToQueue(
          NXSystemMessages.checkToData,
          () => this.loadedFlightPlan?.performanceData.vr.get() !== null,
          undefined,
        );
      }
    }

    this.props.fmcService.master?.acInterface.updateFmsData();
  }

  public destroy(): void {
    // Destroy all subscriptions to remove all references to this instance.
    for (const s of this.subs) {
      s.destroy();
    }

    clearInterval(this.newDataIntervalId);
    this.newDataIntervalId = undefined;

    super.destroy();
  }

  render(): VNode {
    return (
      <ActivePageTitleBar
        activePage={this.activePageTitle}
        offset={Subject.create('')}
        eoIsActive={this.eoActive}
        tmpyIsActive={this.displayTmpy}
        penaltyIsActive={this.displayPenalty}
      />
    );
  }
}
