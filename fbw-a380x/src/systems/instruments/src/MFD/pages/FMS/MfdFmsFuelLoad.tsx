import {
  ArraySubject,
  ClockEvents,
  FSComponent,
  MappedSubject,
  Subject,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';

import './MfdFmsFuelLoad.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import {
  CostIndexFormat,
  PaxNbrFormat,
  PercentageFormat,
  TimeHHMMFormat,
  WeightFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import {
  maxAltnFuel,
  maxBlockFuel,
  maxFinalFuel,
  maxJtsnGw,
  maxRteRsvFuelPerc,
  maxTaxiFuel,
  maxZfw,
  maxZfwCg,
  minZfw,
  minZfwCg,
} from '@shared/PerformanceConstants';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { MfdSimvars } from 'instruments/src/MFD/shared/MFDSimvarPublisher';
import { FmgcFlightPhase } from '@shared/flightphase';
import { AirlineModifiableInformation } from '@shared/AirlineModifiableInformation';
import { getEtaFromUtcOrPresent, hhmmFormatter } from '../../shared/utils';
import { DropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/DropdownMenu';
import { FlightPlanChangeNotifier } from '@fmgc/flightplanning/sync/FlightPlanChangeNotifier';
import { CostIndexMode } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

interface MfdFmsFuelLoadProps extends AbstractMfdPageProps {}

export class MfdFmsFuelLoad extends FmsPage<MfdFmsFuelLoadProps> {
  private readonly flightPlanChangeNotifier = new FlightPlanChangeNotifier(this.props.bus);

  private flightPlanPerfSubs: Subscription[] = [];

  private readonly destEfobAmber = MappedSubject.create(
    ([destEfobBelowM, loadedFpIndex]) => destEfobBelowM && loadedFpIndex === FlightPlanIndex.Active,
    this.props.fmcService.master.fmgc.data.destEfobBelowMinInActive,
    this.loadedFlightPlanIndex,
  );

  private readonly mandatoryAndActiveFpln = this.loadedFlightPlanIndex.map(
    (it) => it === FlightPlanIndex.Active || it === FlightPlanIndex.Temporary,
  );

  private readonly grossWeight = Subject.create<number | null>(null);
  private readonly grossWeightText = this.grossWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'));

  private readonly centerOfGravity = Subject.create<number | null>(null);
  private readonly centerOfGravityText = this.centerOfGravity.map((it) => (it ? it.toFixed(1) : '--.-'));

  private readonly fuelOnBoard = Subject.create<number | null>(null);
  private readonly fuelOnBoardText = this.fuelOnBoard.map((it) => (it ? it.toFixed(1) : '---.-'));

  private readonly zeroFuelWeight = Subject.create<number | null>(null);

  private readonly zeroFuelWeightCenterOfGravity = Subject.create<number | null>(null);

  private readonly blockFuel = Subject.create<number | null>(null);

  private readonly tripFuelWeight = Subject.create<number | null>(null);

  private readonly taxiFuel = Subject.create<number | null>(null);
  private readonly taxiFuelIsPilotEntered = Subject.create<boolean>(false);

  private readonly routeReserveFuelPilotEntry = Subject.create<number | null>(null);
  private readonly routeReserveFuelIsPilotEntered = Subject.create<boolean>(false);

  private readonly routeReserveFuelPercentage = Subject.create<number | null>(null);
  private readonly routeReserveFuelPercentageIsPilotEntered = Subject.create<boolean>(false);

  private readonly routeReserveFuel = Subject.create<number | null>(null);

  private readonly alternateFuel = Subject.create<number | null>(null);
  private readonly alternateFuelIsPilotEntered = Subject.create<boolean>(false);

  private readonly finalFuel = Subject.create<number | null>(null);
  private readonly finalFuelIsPilotEntered = Subject.create<boolean>(false);

  private readonly finalFuelTime = Subject.create<number | null>(null);
  private readonly finalFuelTimeIsPilotEntered = Subject.create<boolean>(false);

  private readonly paxNumber = Subject.create<number | null>(null);

  private readonly minimumFuelAtDestination = Subject.create<number | null>(null);
  private readonly minimumFuelAtDestinationIsPilotEntered = Subject.create<boolean>(false);

  private readonly fuelPlanningIsDisabled = Subject.create<boolean>(true);

  private readonly destinationAlternateTimeHeader = this.activeFlightPhase.map((v) =>
    v === FmgcFlightPhase.Preflight ? 'TIME' : 'UTC',
  );

  private readonly tripFuelWeightText = this.tripFuelWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'));

  private readonly tripFuelTime = Subject.create('--:--');

  private readonly costIndex = Subject.create<number | null>(null);

  private readonly costIndexModeLabels = ArraySubject.create(['LRC', 'ECON']);

  private readonly costIndexMode = Subject.create<CostIndexMode | null>(null);

  private readonly costIndexDisabled = MappedSubject.create(
    ([flightPhase, ciMode, fpIndex]) =>
      ciMode == CostIndexMode.LRC ||
      (flightPhase >= FmgcFlightPhase.Descent &&
        this.props.flightPlanInterface.get(fpIndex).isActiveOrCopiedFromActive()),
    this.activeFlightPhase,
    this.costIndexMode,
    this.loadedFlightPlanIndex,
  );

  private readonly jettisonGrossWeight = Subject.create<number | null>(null);

  private readonly takeoffWeight = Subject.create<number | null>(null);

  private readonly landingWeight = Subject.create<number | null>(null);

  private readonly destIcao = Subject.create<string>('----');

  private readonly destEta = Subject.create<string>('--:--');

  private readonly destEfob = Subject.create<string>('---.-');

  private readonly altnIcao = Subject.create<string>('----');

  private readonly altnEta = Subject.create<string>('--:--');

  private readonly altnEfob = Subject.create<number | null>(null);
  private readonly altnEfobText = this.altnEfob.map((it) => (it ? it.toFixed(1) : '---.-'));

  private readonly extraFuelWeight = Subject.create<number | null>(null);
  private readonly extraFuelWeightText = this.extraFuelWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'));

  private readonly extraFuelTime = Subject.create<number | null>(null);
  private readonly extraFuelTimeText = this.extraFuelTime.map((it) => hhmmFormatter(it ?? NaN));

  private readonly blockLineRef = FSComponent.createRef<HTMLDivElement>();

  private readonly taxiAndRouteRsvDisabled = MappedSubject.create(
    ([flightPhase, fpIndex]) =>
      flightPhase >= FmgcFlightPhase.Takeoff &&
      this.props.flightPlanInterface.get(fpIndex).isActiveOrCopiedFromActive(),
    this.activeFlightPhase,
    this.loadedFlightPlanIndex,
  );

  private readonly alternateExists = Subject.create(true);
  private readonly alternateFuelDisabled = this.alternateExists.map((v) => !v);
  private readonly jettisonGrossWeightVisibility = this.mandatoryAndActiveFpln.map((isActive) =>
    isActive ? 'visible' : 'hidden',
  );

  protected onNewData() {
    if (!this.props.fmcService.master || !this.loadedFlightPlan) {
      return;
    }

    this.costIndex.set(this.loadedFlightPlan.performanceData.costIndex.get());

    this.updateDestAndAltnPredictions();
  }

  updateDestAndAltnPredictions() {
    if (!this.props.fmcService.master || !this.loadedFlightPlan) {
      return;
    }

    const fpIndex = this.loadedFlightPlanIndex.get();
    if (this.loadedFlightPlan.destinationAirport) {
      this.destIcao.set(this.loadedFlightPlan.destinationAirport.ident);

      // TODO SEC predictions
      const destPred =
        fpIndex === FlightPlanIndex.Active || fpIndex === FlightPlanIndex.Temporary
          ? this.props.fmcService.master.guidanceController.vnavDriver.getDestinationPrediction()
          : null;
      // TODO Should display ETA if EET present
      this.destEta.set(
        getEtaFromUtcOrPresent(destPred?.secondsFromPresent, this.activeFlightPhase.get() == FmgcFlightPhase.Preflight),
      );
      const destEfob = this.props.fmcService.master.fmgc.getDestEFOB(true, this.loadedFlightPlanIndex.get());
      this.destEfob.set(destEfob !== null ? destEfob.toFixed(1) : '---.-');
    }

    const fp = this.props.flightPlanInterface.get(this.loadedFlightPlanIndex.get());
    if (fp.alternateDestinationAirport) {
      this.altnIcao.set(fp.alternateDestinationAirport.ident);
      this.altnEta.set('--:--');
      this.altnEfob.set(this.props.fmcService.master.fmgc.getAltEFOB(fpIndex));
    } else {
      this.altnIcao.set('NONE');
      this.altnEta.set('--:--');
      this.altnEfob.set(null);
    }
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();

    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(1)
        .handle((_t) => {
          if (!this.props.fmcService.master || !this.loadedFlightPlan) {
            return;
          }

          const loadedfpIndex = this.loadedFlightPlanIndex.get();
          // FIXME: Move to main update loop once calculated by the predictions
          this.props.fmcService.master.acInterface.calculateFinalAndAlternateFuel(loadedfpIndex);
          const fp = this.props.flightPlanInterface.get(loadedfpIndex);
          this.alternateExists.set(fp.alternateDestinationAirport !== undefined);
          const pd = this.loadedFlightPlan!.performanceData;
          this.landingWeight.set(this.props.fmcService.master.getLandingWeight(loadedfpIndex));
          this.takeoffWeight.set(this.props.fmcService.master.getTakeoffWeight(loadedfpIndex));
          const rteRsv = this.props.fmcService.master.getRouteReserveFuel(loadedfpIndex);
          this.routeReserveFuel.set(rteRsv !== null ? rteRsv / 1000 : null);
          // Calculate RTE RSV percentage
          if (pd.isRouteReserveFuelPercentagePilotEntered.get()) {
            this.routeReserveFuelPercentage.set(pd.routeReserveFuelPercentage.get());
          } else {
            let caclulatedRteRsvPercentage: number | null = null;
            // If route reserve is pilot entry, calculate new percentage.
            if (pd.isRouteReserveFuelPilotEntered.get()) {
              const trip = this.props.fmcService.master.getTripFuel(loadedfpIndex);
              if (trip !== null) {
                caclulatedRteRsvPercentage = ((pd.pilotRouteReserveFuel.get()! * 1000) / trip) * 100;
              }
            } else {
              caclulatedRteRsvPercentage = pd.routeReserveFuelPercentage.get();
            }
            this.routeReserveFuelPercentage.set(caclulatedRteRsvPercentage);
          }

          if (!this.props.fmcService.master.enginesWereStarted.get()) {
            this.grossWeight.set(null);
            this.centerOfGravity.set(null);
            this.fuelOnBoard.set(null);
          } else {
            // GW only displayed after engine start. Value received from FQMS, or falls back to ZFW + FOB
            this.grossWeight.set(this.props.fmcService.master.fmgc.getGrossWeightKg(loadedfpIndex));

            // CG only displayed after engine start. Value received from FQMS, or falls back to value from WBBC
            this.centerOfGravity.set(this.props.fmcService.master.fmgc.getGrossWeightCg());

            // FOB only displayed after engine start. Value received from FQMS, or falls back to FOB stored at engine start + fuel used by FADEC
            this.fuelOnBoard.set(this.props.fmcService.master.fmgc.getFOB(loadedfpIndex));
          }

          const tripFuel = this.props.fmcService.master.getTripFuel(loadedfpIndex);
          this.tripFuelWeight.set(tripFuel);
          if (loadedfpIndex === FlightPlanIndex.Active) {
            // TODO SEC predictions
            const destPred = this.props.fmcService.master.guidanceController.vnavDriver.getDestinationPrediction();
            this.tripFuelTime.set(getEtaFromUtcOrPresent(destPred?.secondsFromPresent, true));
          }

          this.extraFuelWeight.set(this.props.fmcService.master.getExtraFuel(loadedfpIndex));
          this.updateDestAndAltnPredictions();
        }),
    );

    if (this.props.fmcService.master) {
      this.subs.push(
        this.props.fmcService.master.enginesWereStarted.sub((val) => {
          if (this.blockLineRef.getOrDefault()) {
            this.blockLineRef.instance.style.visibility = val ? 'hidden' : 'visible';
          }
        }, true),
      );
    }

    this.subs.push(
      this.eoActive.sub((v) => {
        this.costIndexModeLabels.set(v ? ['EO-LRC', 'EO-ECON'] : ['LRC', 'ECON']);
      }, true),
    );

    this.subs.push(
      this.flightPlanChangeNotifier.flightPlanChanged.sub(() => {
        if (this.loadedFlightPlan) {
          this.flightPlanPerfSubs.forEach((sub) => sub.destroy());
          this.flightPlanPerfSubs = [];
          this.flightPlanPerfSubs.push(
            this.loadedFlightPlan.performanceData.zeroFuelWeight.pipe(this.zeroFuelWeight),
            this.loadedFlightPlan.performanceData.zeroFuelWeightCenterOfGravity.pipe(
              this.zeroFuelWeightCenterOfGravity,
            ),
            this.loadedFlightPlan.performanceData.blockFuel.pipe(this.blockFuel),
            this.loadedFlightPlan.performanceData.taxiFuel.pipe(this.taxiFuel),
            this.loadedFlightPlan.performanceData.taxiFuelIsPilotEntered.pipe(this.taxiFuelIsPilotEntered),
            this.loadedFlightPlan.performanceData.pilotRouteReserveFuel.pipe(this.routeReserveFuelPilotEntry),
            this.loadedFlightPlan.performanceData.isRouteReserveFuelPilotEntered.pipe(
              this.routeReserveFuelIsPilotEntered,
            ),
            this.loadedFlightPlan.performanceData.isRouteReserveFuelPercentagePilotEntered.pipe(
              this.routeReserveFuelPercentageIsPilotEntered,
            ),
            this.loadedFlightPlan.performanceData.alternateFuel.pipe(this.alternateFuel),
            this.loadedFlightPlan.performanceData.isAlternateFuelPilotEntered.pipe(this.alternateFuelIsPilotEntered),
            this.loadedFlightPlan.performanceData.finalHoldingTime.pipe(this.finalFuelTime),
            this.loadedFlightPlan.performanceData.isFinalHoldingFuelPilotEntered.pipe(this.finalFuelIsPilotEntered),
            this.loadedFlightPlan.performanceData.isFinalHoldingTimePilotEntered.pipe(this.finalFuelTimeIsPilotEntered),
            this.loadedFlightPlan.performanceData.finalHoldingFuel.pipe(this.finalFuel),

            this.loadedFlightPlan.performanceData.minimumDestinationFuelOnBoard.pipe(this.minimumFuelAtDestination),
            this.loadedFlightPlan.performanceData.isMinimumDestinationFuelOnBoardPilotEntered.pipe(
              this.minimumFuelAtDestinationIsPilotEntered,
            ),

            this.loadedFlightPlan.performanceData.paxNumber!.pipe(this.paxNumber),
            this.loadedFlightPlan.performanceData.costIndexMode!.pipe(this.costIndexMode),
          );
        }
      }, true),
    );

    this.subs.push(
      this.mandatoryAndActiveFpln,
      this.grossWeightText,
      this.centerOfGravityText,
      this.fuelOnBoardText,
      this.destinationAlternateTimeHeader,
      this.tripFuelWeightText,
      this.altnEfobText,
      this.extraFuelWeightText,
      this.extraFuelTimeText,
      this.taxiAndRouteRsvDisabled,
      this.costIndexDisabled,
      this.jettisonGrossWeightVisibility,
      this.destEfobAmber,
    );
  }

  public destroy(): void {
    this.flightPlanPerfSubs.forEach((sub) => sub.destroy());

    this.flightPlanChangeNotifier.destroy();

    super.destroy();
  }

  render(): VNode {
    return (
      this.props.fmcService.master && (
        <>
          {super.render()}
          {/* begin page content */}
          <div class="mfd-page-container">
            <div style="display: flex; flex-direction: row; justify-content: space-between; margin: 10px 25px 10px 25px;">
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">GW</span>
                <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.grossWeightText}</span>
                <span class="mfd-label-unit mfd-unit-trailing">T</span>
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">CG</span>
                <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.centerOfGravityText}</span>
                <span class="mfd-label-unit mfd-unit-trailing">%</span>
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">FOB</span>
                <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.fuelOnBoardText}</span>
                <span class="mfd-label-unit mfd-unit-trailing">T</span>
              </div>
            </div>
            <div style="display: flex; flex-direction: row; margin-bottom: 15px; align-items: center;">
              <div class="mfd-label mfd-spacing-right fuelLoad">ZFW</div>
              <InputField<number, number, false>
                dataEntryFormat={new WeightFormat(Subject.create(minZfw / 1_000), Subject.create(maxZfw / 1_000))}
                dataHandlerDuringValidation={async (v) =>
                  this.props.flightPlanInterface.setPerformanceData(
                    'zeroFuelWeight',
                    v,
                    this.loadedFlightPlanIndex.get(),
                  )
                }
                readonlyValue={this.zeroFuelWeight}
                mandatory={this.mandatoryAndActiveFpln}
                canBeCleared={Subject.create(false)}
                alignText="flex-end"
                containerStyle="width: 150px;"
                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <div class="mfd-label mfd-spacing-right fuelLoad">ZFWCG</div>
              <InputField<number, number, false>
                dataEntryFormat={new PercentageFormat(Subject.create(minZfwCg), Subject.create(maxZfwCg))}
                dataHandlerDuringValidation={async (v) =>
                  this.props.flightPlanInterface.setPerformanceData(
                    'zeroFuelWeightCenterOfGravity',
                    v,
                    this.loadedFlightPlanIndex.get(),
                  )
                }
                readonlyValue={this.zeroFuelWeightCenterOfGravity}
                mandatory={this.mandatoryAndActiveFpln}
                canBeCleared={Subject.create(false)}
                alignText="center"
                containerStyle="width: 125px;"
                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
            <div ref={this.blockLineRef} class="mfd-fms-fuel-load-block-line">
              <div class="mfd-label mfd-spacing-right fuelLoad">BLOCK</div>
              <InputField<number, number, false>
                dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxBlockFuel / 1_000))}
                dataHandlerDuringValidation={async (v) =>
                  this.props.flightPlanInterface.setPerformanceData('blockFuel', v, this.loadedFlightPlanIndex.get())
                }
                readonlyValue={this.blockFuel}
                mandatory={this.mandatoryAndActiveFpln}
                alignText="flex-end"
                containerStyle="width: 150px;"
                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <div style="display: flex; flex: 1; justify-content: center;">
                <Button
                  disabled={this.fuelPlanningIsDisabled}
                  label={Subject.create(
                    <div style="display: flex; flex-direction: row;">
                      <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                        FUEL
                        <br />
                        PLANNING
                      </span>
                      <span style="display: flex; align-items: center; justify-content: center;">*</span>
                    </div>,
                  )}
                  onClick={() => console.log('FUEL PLANNING')}
                  buttonStyle="padding-right: 2px;"
                />
              </div>
            </div>
            <div class="mfd-fms-fuel-load-middle-flex">
              <div class="mfd-fms-fuel-load-middle-flex-left">
                <div class="mfd-label mfd-spacing-right middleGrid">TAXI</div>
                <div style="margin-bottom: 20px;">
                  <InputField<number, number, false>
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxTaxiFuel / 1_000))}
                    dataHandlerDuringValidation={async (v) =>
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotTaxiFuel',
                        v,
                        this.loadedFlightPlanIndex.get(),
                      )
                    }
                    enteredByPilot={this.taxiFuelIsPilotEntered}
                    readonlyValue={this.taxiFuel}
                    disabled={this.taxiAndRouteRsvDisabled}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div />

                <div class="mfd-label mfd-spacing-right middleGrid">TRIP</div>
                <div class="mfd-label-value-container" style="justify-content: flex-end; margin-bottom: 20px;">
                  <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.tripFuelWeightText}</span>
                  <span class="mfd-label-unit mfd-unit-trailing">T</span>
                </div>
                <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                  <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.tripFuelTime}</span>
                </div>

                <div class="mfd-label mfd-spacing-right middleGrid">RTE RSV</div>
                <div style="margin-bottom: 20px;">
                  <InputField<number, number, false>
                    disabled={this.taxiAndRouteRsvDisabled}
                    dataEntryFormat={
                      new WeightFormat(
                        Subject.create(AirlineModifiableInformation.EK.rsvMin / 1_000),
                        Subject.create(AirlineModifiableInformation.EK.rsvMax / 1_000),
                      )
                    }
                    dataHandlerDuringValidation={async (v) => {
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotRouteReserveFuel',
                        v,
                        this.loadedFlightPlanIndex.get(),
                      );

                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotRouteReserveFuelPercentage',
                        null,
                        this.loadedFlightPlanIndex.get(),
                      );
                    }}
                    enteredByPilot={this.routeReserveFuelIsPilotEntered}
                    readonlyValue={this.routeReserveFuel}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div style="margin-bottom: 20px; margin-left: 5px;">
                  <InputField<number, number, false>
                    disabled={this.taxiAndRouteRsvDisabled}
                    dataEntryFormat={new PercentageFormat(Subject.create(0), Subject.create(maxRteRsvFuelPerc))}
                    dataHandlerDuringValidation={async (v) => {
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotRouteReserveFuel',
                        null,
                        this.loadedFlightPlanIndex.get(),
                      );
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotRouteReserveFuelPercentage',
                        v,
                        this.loadedFlightPlanIndex.get(),
                      );
                    }}
                    enteredByPilot={this.routeReserveFuelPercentageIsPilotEntered}
                    readonlyValue={this.routeReserveFuelPercentage}
                    alignText="center"
                    containerStyle="width: 120px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>

                <div class="mfd-label mfd-spacing-right middleGrid">ALTN</div>
                <div style="margin-bottom: 20px;">
                  <InputField<number, number, false>
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxAltnFuel / 1_000))}
                    dataHandlerDuringValidation={async (v) =>
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotAlternateFuel',
                        v,
                        this.loadedFlightPlanIndex.get(),
                      )
                    }
                    disabled={this.alternateFuelDisabled}
                    enteredByPilot={this.alternateFuelIsPilotEntered}
                    readonlyValue={this.alternateFuel}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                  <span class={{ 'mfd-value': true, sec: this.secActive }}>--:--</span>
                </div>

                <div class="mfd-label mfd-spacing-right middleGrid">FINAL</div>
                <div style="margin-bottom: 20px;">
                  <InputField<number, number, false>
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxFinalFuel / 1_000))}
                    dataHandlerDuringValidation={async (v) => {
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotFinalHoldingFuel',
                        v,
                        this.loadedFlightPlanIndex.get(),
                      );
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotFinalHoldingTime',
                        null,
                        this.loadedFlightPlanIndex.get(),
                      );
                    }}
                    enteredByPilot={this.finalFuelIsPilotEntered}
                    readonlyValue={this.finalFuel}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div style="margin-bottom: 20px; margin-left: 5px;">
                  <InputField<number, number, false>
                    dataEntryFormat={new TimeHHMMFormat()}
                    dataHandlerDuringValidation={async (v) => {
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotFinalHoldingFuel',
                        null,
                        this.loadedFlightPlanIndex.get(),
                      );
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotFinalHoldingTime',
                        v,
                        this.loadedFlightPlanIndex.get(),
                      );
                    }}
                    enteredByPilot={this.finalFuelTimeIsPilotEntered}
                    readonlyValue={this.finalFuelTime}
                    alignText="center"
                    containerStyle="width: 120px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
              </div>
              <div class="mfd-fms-fuel-load-middle-flex-right">
                <div class="mfd-label mfd-spacing-right middleGridSmall">PAX NBR</div>
                <div style="margin-bottom: 10px;">
                  <InputField<number>
                    dataEntryFormat={new PaxNbrFormat()}
                    dataHandlerDuringValidation={async (v) => {
                      if (v !== null) {
                        this.props.flightPlanInterface.setPerformanceData(
                          'paxNumber',
                          v,
                          this.loadedFlightPlanIndex.get(),
                        );
                        this.props.fmcService.master.acInterface.updatePaxNumber(v);
                      }
                    }}
                    value={this.paxNumber}
                    mandatory={this.mandatoryAndActiveFpln}
                    alignText="center"
                    containerStyle="width: 75px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div class="mfd-label mfd-spacing-right middleGridSmall">MODE</div>
                <div style="margin-bottom: 10px;">
                  <DropdownMenu
                    values={this.costIndexModeLabels}
                    selectedIndex={this.costIndexMode}
                    idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_initCostIndexModeDropdown`}
                    freeTextAllowed={false}
                    containerStyle="width: 175px; margin-right: 65px;"
                    numberOfDigitsForInputField={7}
                    alignLabels="center"
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div class="mfd-label mfd-spacing-right middleGridSmall">CI</div>
                <div style="margin-bottom: 10px;">
                  <InputField<number>
                    dataEntryFormat={new CostIndexFormat()}
                    dataHandlerDuringValidation={async (v) => {
                      this.props.flightPlanInterface?.setPerformanceData(
                        'costIndex',
                        v,
                        this.loadedFlightPlanIndex.get(),
                      );
                    }}
                    value={this.costIndex}
                    mandatory={this.mandatoryAndActiveFpln}
                    disabled={this.costIndexDisabled}
                    alignText="center"
                    containerStyle="width: 75px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div
                  class="mfd-label mfd-spacing-right middleGridSmall"
                  style={{ visibility: this.jettisonGrossWeightVisibility }}
                >
                  JTSN GW
                </div>
                <div style={{ 'margin-bottom': '10px', visibility: this.jettisonGrossWeightVisibility }}>
                  <InputField<number, number, false>
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxJtsnGw / 1_000))}
                    disabled={Subject.create(true)}
                    readonlyValue={this.jettisonGrossWeight}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div class="mfd-label mfd-spacing-right middleGridSmall">TOW</div>
                <div class="mfd-label-value-container" style="justify-content: center; margin-bottom: 10px;">
                  <span class={{ 'mfd-value': true, sec: this.secActive }}>
                    {this.takeoffWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'))}
                  </span>
                  <span class="mfd-label-unit mfd-unit-trailing">T</span>
                </div>
                <div class="mfd-label mfd-spacing-right middleGridSmall">LW</div>
                <div class="mfd-label-value-container" style="justify-content: center; margin-bottom: 10px;">
                  <span class={{ 'mfd-value': true, sec: this.secActive }}>
                    {this.landingWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'))}
                  </span>
                  <span class="mfd-label-unit mfd-unit-trailing">T</span>
                </div>
              </div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: row; margin-top: 25px;">
              <div style="width: 62.5%">
                <div style="display: grid; grid-template-columns: auto auto auto auto;">
                  <div class="mfd-fms-fuel-load-dest-grid-top-cell" />
                  <div class="mfd-fms-fuel-load-dest-grid-top-cell" />
                  <div class="mfd-label mfd-fms-fuel-load-dest-grid-top-cell">
                    {this.destinationAlternateTimeHeader}
                  </div>
                  <div class="mfd-label mfd-fms-fuel-load-dest-grid-top-cell">EFOB</div>
                  <div class="mfd-label mfd-fms-fuel-load-dest-grid-middle-cell">DEST</div>
                  <div
                    class={{
                      'mfd-label': true,
                      bigger: true,
                      green: this.mandatoryAndActiveFpln,
                      sec: this.secActive,
                      'mfd-fms-fuel-load-dest-grid-middle-cell': true,
                    }}
                  >
                    {this.destIcao}
                  </div>
                  <div
                    class={{
                      'mfd-label': true,
                      bigger: true,
                      green: this.mandatoryAndActiveFpln,
                      sec: this.secActive,
                      'mfd-fms-fuel-load-dest-grid-middle-cell': true,
                    }}
                  >
                    {this.destEta}
                  </div>
                  <div class="mfd-label-value-container mfd-fms-fuel-load-dest-grid-efob-cell">
                    <span
                      class={{
                        'mfd-value': true,
                        amber: this.destEfobAmber,
                        sec: this.secActive,
                      }}
                    >
                      {this.destEfob}
                    </span>
                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                  </div>
                  <div class="mfd-label" style="text-align: center; align-self: center;">
                    ALTN
                  </div>
                  <div
                    class={{ 'mfd-label': true, bigger: true, green: this.mandatoryAndActiveFpln }}
                    style="text-align: center; align-self: center;"
                  >
                    {this.altnIcao}
                  </div>
                  <div
                    class={{ 'mfd-label': true, bigger: true, green: this.mandatoryAndActiveFpln }}
                    style="text-align: center; align-self: center;"
                  >
                    {this.altnEta}
                  </div>
                  <div class="mfd-label-value-container mfd-fms-fuel-load-dest-grid-efob-cell">
                    <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.altnEfobText}</span>
                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                  </div>
                </div>
              </div>
              <div style="flex: 1; flex-direction: column; justify-content: center; align-items: center;">
                <div class="mfd-label" style="margin-bottom: 20px; text-align: center;">
                  MIN FUEL AT DEST
                </div>
                <div style="margin-bottom: 30px; display: flex; justify-content: center;">
                  <InputField<number, number, false>
                    dataEntryFormat={new WeightFormat(undefined, undefined)}
                    dataHandlerDuringValidation={async (v) =>
                      this.props.flightPlanInterface?.setPerformanceData(
                        'pilotMinimumDestinationFuelOnBoard',
                        v,
                        this.loadedFlightPlanIndex.get(),
                      )
                    }
                    enteredByPilot={this.minimumFuelAtDestinationIsPilotEntered}
                    readonlyValue={this.minimumFuelAtDestination}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div class="mfd-label" style="margin-bottom: 5px; text-align: center;">
                  EXTRA
                </div>
                <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                  <div class="mfd-label-value-container" style="margin-right: 20px;">
                    <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.extraFuelWeightText}</span>
                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                  </div>
                  <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.extraFuelTimeText}</span>
                </div>
              </div>
            </div>
            <div style="flex-grow: 1;" />
            {/* fill space vertically */}
            <div style="width: 150px;">
              <Button
                label="RETURN"
                onClick={() => this.props.mfd.uiService.navigateTo('back')}
                buttonStyle="margin-right: 5px;"
              />
            </div>

            {/* end page content */}
          </div>
          <Footer
            bus={this.props.bus}
            mfd={this.props.mfd}
            fmcService={this.props.fmcService}
            flightPlanInterface={this.props.fmcService.master.flightPlanInterface}
          />
        </>
      )
    );
  }
}
