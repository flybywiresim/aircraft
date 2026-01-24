import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import {
  ConsumerSubject,
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
  dirToUri,
  airwaysPage,
  departurePage,
  arrivalPage,
  lateralRevisionPage,
  verticalRevisionPage,
  fixInfoUri,
} from '../../shared/utils';
import { ReadonlyFlightPlan } from '@fmgc/flightplanning/plans/ReadonlyFlightPlan';
import { AlternateFlightPlan } from '@fmgc/flightplanning/plans/AlternateFlightPlan';
import { FlightPlanPerformanceData } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';

export abstract class FmsPage<T extends AbstractMfdPageProps = AbstractMfdPageProps> extends DisplayComponent<T> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  protected readonly subs = [] as Subscription[];

  private readonly sub = this.props.bus.getSubscriber<MfdSimvars>();

  private newDataIntervalId: ReturnType<typeof setTimeout> | undefined = undefined;

  protected readonly activePageTitle = Subject.create<string>('');

  public loadedFlightPlan: ReadonlyFlightPlan<FlightPlanPerformanceData> | null = null;

  public loadedAlternateFlightPlan: AlternateFlightPlan<FlightPlanPerformanceData> | null = null;

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
        uri.page === airwaysPage ||
        uri.page === departurePage ||
        uri.page === arrivalPage ||
        uri.page === lateralRevisionPage ||
        uri.page === lateralRevisionHoldPage ||
        uri.page === verticalRevisionPage ||
        uri.uri === fixInfoUri ||
        uri.uri === secIndexPageUri ||
        uri.uri === dirToUri),
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

  protected readonly activeFlightPhase = ConsumerSubject.create<FmgcFlightPhase>(
    this.sub.on('flightPhase'),
    FmgcFlightPhase.Preflight,
  );

  // protected mfdInViewConsumer: Consumer<boolean>;

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

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
    const activeUri = this.props.mfd.uiService.activeUri.get();
    switch (activeUri.category) {
      case 'active':
        if (
          this.props.fmcService.master?.flightPlanInterface.hasActive ||
          this.props.fmcService.master?.flightPlanInterface.hasTemporary
        ) {
          this.loadedFlightPlan = this.props.fmcService.master?.flightPlanInterface.activeOrTemporary ?? null;
          this.loadedAlternateFlightPlan = this.props.fmcService.master?.flightPlanInterface.get(
            this.props.fmcService.master?.flightPlanInterface.hasTemporary
              ? FlightPlanIndex.Temporary
              : FlightPlanIndex.Active,
          ).alternateFlightPlan;
          this.loadedFlightPlanIndex.set(
            this.props.fmcService.master?.flightPlanInterface.hasTemporary
              ? FlightPlanIndex.Temporary
              : FlightPlanIndex.Active,
          );
          this.secActive.set(false);
          this.tmpyActive.set(this.props.fmcService.master?.flightPlanInterface.hasTemporary ?? false);
        } else if (activeUri.page === 'init') {
          // Flight plan might not have been created yet
          this.loadedFlightPlanIndex.set(FlightPlanIndex.Active);
        }
        break;
      case 'sec1':
        if (this.props.fmcService.master?.flightPlanInterface.hasSecondary(1)) {
          this.loadedFlightPlan = this.props.fmcService.master?.flightPlanInterface.secondary(1) ?? null;
          this.loadedAlternateFlightPlan = this.props.fmcService.master?.flightPlanInterface.get(
            FlightPlanIndex.FirstSecondary,
          ).alternateFlightPlan;
          this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary);
          this.secActive.set(true);
          this.tmpyActive.set(false);
        } else if (activeUri.page === 'init') {
          // Flight plan might not have been created yet
          this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary);
        }
        break;
      case 'sec2':
        if (this.props.fmcService.master?.flightPlanInterface.hasSecondary(2)) {
          this.loadedFlightPlan = this.props.fmcService.master?.flightPlanInterface.secondary(2) ?? null;
          this.loadedAlternateFlightPlan = this.props.fmcService.master?.flightPlanInterface.get(
            FlightPlanIndex.FirstSecondary + 1,
          ).alternateFlightPlan;
          this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary + 1);
          this.secActive.set(true);
          this.tmpyActive.set(false);
        } else if (activeUri.page === 'init') {
          // Flight plan might not have been created yet
          this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary + 1);
        }
        break;
      case 'sec3':
        if (this.props.fmcService.master?.flightPlanInterface.hasSecondary(3)) {
          this.loadedFlightPlan = this.props.fmcService.master?.flightPlanInterface.secondary(3) ?? null;
          this.loadedAlternateFlightPlan = this.props.fmcService.master?.flightPlanInterface.get(
            FlightPlanIndex.FirstSecondary + 2,
          ).alternateFlightPlan;
          this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary + 2);
          this.secActive.set(true);
          this.tmpyActive.set(false);
        } else if (activeUri.page === 'init') {
          // Flight plan might not have been created yet
          this.loadedFlightPlanIndex.set(FlightPlanIndex.FirstSecondary + 2);
        }
        break;

      default:
        if (
          this.props.fmcService.master?.flightPlanInterface.hasActive ||
          this.props.fmcService.master?.flightPlanInterface.hasTemporary
        ) {
          this.loadedFlightPlan = this.props.fmcService.master?.flightPlanInterface.activeOrTemporary ?? null;
          this.loadedAlternateFlightPlan =
            this.props.fmcService.master?.flightPlanInterface.get(
              this.props.fmcService.master?.flightPlanInterface.hasTemporary
                ? FlightPlanIndex.Temporary
                : FlightPlanIndex.Active,
            ).alternateFlightPlan ?? null;
        }
        break;
    }
    this.onNewDataChecks();
    this.onNewData();
    this.currentFlightPlanVersion = this.loadedFlightPlan?.version ?? 0;
  }

  protected abstract onNewData(): void;

  private onNewDataChecks() {
    const fm = this.props.fmcService.master?.fmgc.data;
    const activeFlightPlan = this.props.fmcService.master?.flightPlanInterface.active;
    const pdActive = activeFlightPlan?.performanceData;
    const fps = this.props.fmcService.master?.flightPlanInterface;

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
        this.props.fmcService.master?.addMessageToQueue(
          NXSystemMessages.checkToData,
          () => activeFlightPlan.performanceData.vr.get() !== null,
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
        isFmsSubsystemPage={true}
      />
    );
  }
}
