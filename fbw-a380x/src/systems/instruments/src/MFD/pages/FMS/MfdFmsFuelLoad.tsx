// Copyright (c) 2024-2026 FlyByWire Simulations
// SPDX-License-Identifier: GPL-3.0
import {
  ArraySubject,
  ClockEvents,
  FSComponent,
  MappedSubject,
  NumberFormatter,
  NumberUnitInterface,
  NumberUnitSubject,
  SimpleUnit,
  Subject,
  Unit,
  UnitFamily,
  UnitType,
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
  maxMinDestFuel,
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
import { CostIndexMode } from '../../FMC/fmgc';
import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';
import { FlightPlanChangeNotifier } from '@fmgc/flightplanning/sync/FlightPlanChangeNotifier';

interface MfdFmsFuelLoadProps extends AbstractMfdPageProps {}

export class MfdFmsFuelLoad extends FmsPage<MfdFmsFuelLoadProps> {
  private readonly weightUnit = NXDataStore.getSetting('CONFIG_USING_METRIC_UNIT').map((v) =>
    v ? UnitType.KILOGRAM : UnitType.POUND,
  );

  private readonly weightFormatter = NumberFormatter.create({
    nanString: '---.-',
    precision: 0.1,
  });

  private readonly grossWeight = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));
  private readonly grossWeightText = this.createWeightSubscribable(this.grossWeight);

  private readonly flightPlanChangeNotifier = new FlightPlanChangeNotifier(this.props.bus);

  private readonly destEfobAmber = MappedSubject.create(
    ([destEfobBelowM, loadedFpIndex]) => destEfobBelowM && loadedFpIndex === FlightPlanIndex.Active,
    this.props.fmcService.master.fmgc.data.destEfobBelowMinInActive,
    this.loadedFlightPlanIndex,
  );

  private readonly mandatoryAndActiveFpln = this.loadedFlightPlanIndex.map(
    (it) => it === FlightPlanIndex.Active || it === FlightPlanIndex.Temporary,
  );

  private readonly centerOfGravity = Subject.create<number | null>(null);
  private readonly centerOfGravityText = this.centerOfGravity.map((it) => (it ? it.toFixed(1) : '--.-'));

  private readonly fuelOnBoard = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));
  private readonly fuelOnBoardText = this.createWeightSubscribable(this.fuelOnBoard);

  /** Zero Fuel Weight in kg, or null if no value. */
  private readonly zeroFuelWeight = Subject.create<number | null>(null);

  private readonly zeroFuelWeightCenterOfGravity = Subject.create<number | null>(null);

  /** Block fuel weight in kg, or null if no value. */
  private readonly blockFuel = Subject.create<number | null>(null);

  /** Taxi fuel weight in kg, or null if no value. */
  private readonly taxiFuel = Subject.create<number | null>(null);
  private readonly taxiFuelIsPilotEntered = Subject.create<boolean>(false);

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
  private readonly tripFuelWeight = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));
  private readonly tripFuelWeightText = this.createWeightSubscribable(this.tripFuelWeight);

  private readonly tripFuelTime = Subject.create('--:--');

  private readonly costIndex = Subject.create<number | null>(null);

  private readonly costIndexModeLabels = ArraySubject.create(['LRC', 'ECON']);

  private readonly costIndexMode = Subject.create<CostIndexMode | null>(null);

  private readonly jettisonGrossWeight = Subject.create(null);
  private readonly takeoffWeight = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));
  private readonly takeoffWeightText = this.createWeightSubscribable(this.takeoffWeight);
  private readonly landingWeight = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));
  private readonly landingWeightText = this.createWeightSubscribable(this.landingWeight);

  private readonly destIcao = Subject.create<string | null>(null);

  private readonly destIcaoDisplay = this.destIcao.map((v) => (v ? v : 'NONE'));

  private readonly destEta = Subject.create<string>('--:--');
  private readonly destEfob = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));
  private readonly destEfobText = this.createWeightSubscribable(this.destEfob);

  private readonly altnIcao = Subject.create<string>('----');

  private readonly altnEta = Subject.create<string>('--:--');

  private readonly altnEfob = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));
  private readonly altnEfobText = this.createWeightSubscribable(this.altnEfob);

  private readonly extraFuelWeight = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));
  private readonly extraFuelWeightText = this.createWeightSubscribable(this.extraFuelWeight);

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

  private createWeightSubscribable(
    value: NumberUnitSubject<UnitFamily.Weight, SimpleUnit<UnitFamily.Weight>>,
  ): MappedSubject<
    [NumberUnitInterface<UnitFamily.Weight, SimpleUnit<UnitFamily.Weight>>, Unit<UnitFamily.Weight>],
    string
  > {
    return MappedSubject.create(
      ([value, weightUnit]) => this.weightFormatter(value.asUnit(weightUnit) / 1000),
      value,
      this.weightUnit,
    );
  }

  private readonly costIndexModeDisabled = MappedSubject.create(
    ([flightPhase, dest, fpIndex]) =>
      (this.props.flightPlanInterface.get(fpIndex).isActiveOrCopiedFromActive() &&
        flightPhase >= FmgcFlightPhase.Descent) ||
      !dest,
    this.activeFlightPhase,
    this.destIcao,
    this.loadedFlightPlanIndex,
  );

  private readonly costIndexDisabled = MappedSubject.create(
    ([ciModeDisabled, ciMode]) => ciModeDisabled || ciMode === CostIndexMode.LRC,
    this.costIndexModeDisabled,
    this.costIndexMode,
  );

  protected onNewData() {
    // no op
  }
  private readonly weightUnitText = this.weightUnit.map((v) => (v === UnitType.KILOGRAM ? 'T' : 'KLB'));

  /** @inheritdoc */
  public override onAfterRender(node: VNode): void {
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

          this.loadFlightPlanPerformanceData();

          const loadedfpIndex = this.loadedFlightPlanIndex.get();
          // FIXME: Move to main update loop once calculated by the predictions
          this.props.fmcService.master.acInterface.calculateFinalAndAlternateFuel(loadedfpIndex);
          const fp = this.props.flightPlanInterface.get(loadedfpIndex);
          this.alternateExists.set(fp.alternateDestinationAirport !== undefined);
          const pd = this.loadedFlightPlan!.performanceData;
          this.landingWeight.set(
            this.props.fmcService.master.getLandingWeight(loadedfpIndex) ?? NaN,
            UnitType.KILOGRAM,
          );
          this.takeoffWeight.set(
            this.props.fmcService.master.getTakeoffWeight(loadedfpIndex) ?? NaN,
            UnitType.KILOGRAM,
          );
          const rteRsv = this.props.fmcService.master.getRouteReserveFuel(loadedfpIndex);
          this.routeReserveFuel.set(rteRsv);
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
            this.grossWeight.set(NaN);
            this.centerOfGravity.set(null);
            this.fuelOnBoard.set(NaN);
          } else {
            // GW only displayed after engine start. Value received from FQMS, or falls back to ZFW + FOB
            this.grossWeight.set(
              this.props.fmcService.master.fmgc.getGrossWeightKg(loadedfpIndex) ?? NaN,
              UnitType.KILOGRAM,
            );

            // CG only displayed after engine start. Value received from FQMS, or falls back to value from WBBC
            this.centerOfGravity.set(this.props.fmcService.master.fmgc.getGrossWeightCg());

            // FOB only displayed after engine start. Value received from FQMS, or falls back to FOB stored at engine start + fuel used by FADEC
            this.fuelOnBoard.set(
              (this.props.fmcService.master.fmgc.getFOB(loadedfpIndex) ?? NaN) * 1000,
              UnitType.KILOGRAM,
            );
          }

          const tripFuel = this.props.fmcService.master.getTripFuel(loadedfpIndex) ?? NaN;
          this.tripFuelWeight.set(tripFuel);

          if (loadedfpIndex === FlightPlanIndex.Active) {
            // TODO SEC predictions
            const destPred = this.props.fmcService.master.guidanceController.vnavDriver.getDestinationPrediction();
            this.tripFuelTime.set(getEtaFromUtcOrPresent(destPred?.secondsFromPresent, true));
          }

          this.extraFuelWeight.set(this.props.fmcService.master.getExtraFuel(loadedfpIndex) ?? NaN);
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
        this.loadFlightPlanPerformanceData();
      }, true),
    );

    this.subs.push(
      this.weightUnit,
      this.mandatoryAndActiveFpln,
      this.grossWeightText,
      this.fuelOnBoardText,
      this.tripFuelWeightText,
      this.takeoffWeightText,
      this.landingWeightText,
      this.destEfobText,
      this.centerOfGravityText,
      this.fuelOnBoardText,
      this.destinationAlternateTimeHeader,
      this.tripFuelWeightText,
      this.altnEfobText,
      this.extraFuelWeightText,
      this.extraFuelTimeText,
      this.taxiAndRouteRsvDisabled,
      this.costIndexDisabled,
      this.costIndexModeDisabled,
      this.jettisonGrossWeightVisibility,
      this.destEfobAmber,
    );
  }

  public destroy(): void {
    this.flightPlanChangeNotifier.destroy();

    super.destroy();
  }

  private loadFlightPlanPerformanceData(): void {
    const pd = this.loadedFlightPlan?.performanceData;

    const pdZfw = pd?.zeroFuelWeight.get();
    if (pdZfw !== undefined && pdZfw !== null) {
      this.zeroFuelWeight.set(pdZfw * 1000);
    } else {
      this.zeroFuelWeight.set(null);
    }
    this.zeroFuelWeightCenterOfGravity.set(pd?.zeroFuelWeightCenterOfGravity.get() ?? null);

    const pdBlockFuel = pd?.blockFuel.get();
    if (pdBlockFuel !== undefined && pdBlockFuel !== null) {
      this.blockFuel.set(pdBlockFuel * 1000);
    } else {
      this.blockFuel.set(null);
    }
    const pdTaxiFuel = pd?.taxiFuel.get();
    if (pdTaxiFuel !== undefined && pdTaxiFuel !== null) {
      this.taxiFuel.set(pdTaxiFuel * 1000);
    } else {
      this.taxiFuel.set(null);
    }
    this.taxiFuelIsPilotEntered.set(pd?.taxiFuelIsPilotEntered.get() ?? false);
    this.routeReserveFuelIsPilotEntered.set(pd?.isRouteReserveFuelPilotEntered.get() ?? false);
    this.routeReserveFuelPercentageIsPilotEntered.set(pd?.isRouteReserveFuelPercentagePilotEntered.get() ?? false);
    const pdAlternateFuel = pd?.alternateFuel.get();
    if (pdAlternateFuel !== undefined && pdAlternateFuel !== null) {
      this.alternateFuel.set(pdAlternateFuel * 1000);
    } else {
      this.alternateFuel.set(null);
    }
    this.alternateFuelIsPilotEntered.set(pd?.isAlternateFuelPilotEntered.get() ?? false);
    this.finalFuelTime.set(pd?.finalHoldingTime.get() ?? null);
    this.finalFuelIsPilotEntered.set(pd?.isFinalHoldingFuelPilotEntered.get() ?? false);
    this.finalFuelTimeIsPilotEntered.set(pd?.isFinalHoldingTimePilotEntered.get() ?? false);
    const pdFinalFuel = pd?.finalHoldingFuel.get();
    if (pdFinalFuel !== undefined && pdFinalFuel !== null) {
      this.finalFuel.set(pdFinalFuel * 1000);
    } else {
      this.finalFuel.set(null);
    }
    const pdMinDestFuel = pd?.minimumDestinationFuelOnBoard.get();
    if (pdMinDestFuel !== undefined && pdMinDestFuel !== null) {
      this.minimumFuelAtDestination.set(pdMinDestFuel * 1000);
    } else {
      this.minimumFuelAtDestination.set(null);
    }
    this.minimumFuelAtDestinationIsPilotEntered.set(pd?.isMinimumDestinationFuelOnBoardPilotEntered.get() ?? false);
    this.paxNumber.set(pd?.paxNumber ? pd.paxNumber.get() : null);
    this.costIndexMode.set(pd?.costIndexMode ? pd.costIndexMode.get() : null);
    this.costIndex.set(pd?.costIndex ? pd.costIndex.get() : null);
  }

  updateDestAndAltnPredictions() {
    const hasFp = this.loadedFlightPlan !== null;
    const fpIndex = hasFp ? this.loadedFlightPlanIndex.get() : null;
    this.destIcao.set(this.loadedFlightPlan?.destinationAirport?.ident ?? null);

    // TODO SEC predictions
    const destPred =
      hasFp && (fpIndex === FlightPlanIndex.Active || fpIndex === FlightPlanIndex.Temporary)
        ? this.props.fmcService.master.guidanceController.vnavDriver.getDestinationPrediction()
        : null;
    // TODO Should display ETA if EET present
    this.destEta.set(
      getEtaFromUtcOrPresent(destPred?.secondsFromPresent, this.activeFlightPhase.get() == FmgcFlightPhase.Preflight),
    );
    const destEfob = hasFp ? this.props.fmcService.master.fmgc.getDestEFOB(true, fpIndex!) : null;
    if (destEfob !== null) {
      this.destEfob.set(destEfob * 1000, UnitType.KILOGRAM);
    } else {
      this.destEfob.set(NaN);
    }

    const fp = hasFp ? this.props.flightPlanInterface.get(fpIndex!) : null;
    this.altnIcao.set(fp?.alternateDestinationAirport?.ident ?? 'NONE');
    this.altnEta.set('--:--');
    if (fp) {
      this.altnEfob.set(this.props.fmcService.master.fmgc.getAltEFOB(fpIndex!) ?? NaN, UnitType.KILOGRAM);
    } else {
      this.altnEfob.set(NaN);
    }
    this.altnEfob.set(hasFp ? this.props.fmcService.master.fmgc.getAltEFOB(fpIndex!) ?? NaN : NaN, UnitType.KILOGRAM);
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
                <span class="mfd-label-unit mfd-unit-trailing">{this.weightUnitText}</span>
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">CG</span>
                <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.centerOfGravityText}</span>
                <span class="mfd-label-unit mfd-unit-trailing">%</span>
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">FOB</span>
                <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.fuelOnBoardText}</span>
                <span class="mfd-label-unit mfd-unit-trailing">{this.weightUnitText}</span>
              </div>
            </div>
            <div style="display: flex; flex-direction: row; margin-bottom: 15px; align-items: center;">
              <div class="mfd-label mfd-spacing-right fuelLoad">ZFW</div>
              <InputField<number, number, false>
                dataEntryFormat={new WeightFormat(Subject.create(minZfw), Subject.create(maxZfw), this.weightUnit)}
                dataHandlerDuringValidation={async (v) => {
                  this.props.flightPlanInterface.setPerformanceData(
                    'zeroFuelWeight',
                    v !== null ? v / 1000 : null, // FIXME the perf plan should be in kg
                    this.loadedFlightPlanIndex.get(),
                  );
                }}
                readonlyValue={this.zeroFuelWeight}
                mandatory={this.mandatoryAndActiveFpln}
                canBeCleared={Subject.create(false)}
                alignText="flex-end"
                containerStyle="width: 150px;"
                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
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
                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
            <div ref={this.blockLineRef} class="mfd-fms-fuel-load-block-line">
              <div class="mfd-label mfd-spacing-right fuelLoad">BLOCK</div>
              <InputField<number, number, false>
                dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxBlockFuel), this.weightUnit)}
                dataHandlerDuringValidation={async (v) =>
                  this.props.flightPlanInterface.setPerformanceData(
                    'blockFuel',
                    v !== null ? v / 1000 : null,
                    this.loadedFlightPlanIndex.get(),
                  )
                }
                readonlyValue={this.blockFuel}
                mandatory={this.mandatoryAndActiveFpln}
                alignText="flex-end"
                containerStyle="width: 150px;"
                errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <div style="display: flex; flex: 1; justify-content: center;">
                <Button
                  disabled={this.fuelPlanningIsDisabled}
                  label={
                    <div style="display: flex; flex-direction: row;">
                      <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                        FUEL
                        <br />
                        PLANNING
                      </span>
                      <span style="display: flex; align-items: center; justify-content: center;">*</span>
                    </div>
                  }
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
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxTaxiFuel), this.weightUnit)}
                    dataHandlerDuringValidation={async (v) =>
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotTaxiFuel',
                        v !== null ? v / 1000 : null, // FIXME the perf plan should be in kg
                        this.loadedFlightPlanIndex.get(),
                      )
                    }
                    enteredByPilot={this.taxiFuelIsPilotEntered}
                    readonlyValue={this.taxiFuel}
                    disabled={this.taxiAndRouteRsvDisabled}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div />

                <div class="mfd-label mfd-spacing-right middleGrid">TRIP</div>
                <div class="mfd-label-value-container" style="justify-content: flex-end; margin-bottom: 20px;">
                  <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.tripFuelWeightText}</span>
                  <span class="mfd-label-unit mfd-unit-trailing">{this.weightUnitText}</span>
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
                        Subject.create(AirlineModifiableInformation.EK.rsvMin),
                        Subject.create(AirlineModifiableInformation.EK.rsvMax),
                        this.weightUnit,
                      )
                    }
                    dataHandlerDuringValidation={async (v) => {
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotRouteReserveFuel',
                        v !== null ? v / 1000 : null, // FIXME the perf plan should be in kg
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
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
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
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>

                <div class="mfd-label mfd-spacing-right middleGrid">ALTN</div>
                <div style="margin-bottom: 20px;">
                  <InputField<number, number, false>
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxAltnFuel), this.weightUnit)}
                    dataHandlerDuringValidation={async (v) =>
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotAlternateFuel',
                        v !== null ? v / 1000 : null, // FIXME the perf plan should be in kg
                        this.loadedFlightPlanIndex.get(),
                      )
                    }
                    disabled={this.alternateFuelDisabled}
                    enteredByPilot={this.alternateFuelIsPilotEntered}
                    readonlyValue={this.alternateFuel}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
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
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxFinalFuel), this.weightUnit)}
                    dataHandlerDuringValidation={async (v) => {
                      this.props.flightPlanInterface.setPerformanceData(
                        'pilotFinalHoldingFuel',
                        v !== null ? v / 1000 : null, // FIXME the perf plan should be in kg
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
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
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
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
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
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div class="mfd-label mfd-spacing-right middleGridSmall">MODE</div>
                <div style="margin-bottom: 10px;">
                  <DropdownMenu
                    disabled={this.costIndexModeDisabled}
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
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
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
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxJtsnGw), this.weightUnit)}
                    disabled={Subject.create(true)}
                    readonlyValue={this.jettisonGrossWeight}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div class="mfd-label mfd-spacing-right middleGridSmall">TOW</div>
                <div class="mfd-label-value-container" style="justify-content: center; margin-bottom: 10px;">
                  <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.takeoffWeightText}</span>
                  <span class="mfd-label-unit mfd-unit-trailing">{this.weightUnitText}</span>
                </div>
                <div class="mfd-label mfd-spacing-right middleGridSmall">LW</div>
                <div class="mfd-label-value-container" style="justify-content: center; margin-bottom: 10px;">
                  <span class={{ 'mfd-value': true, sec: this.secActive }}>{this.landingWeightText}</span>
                  <span class="mfd-label-unit mfd-unit-trailing">{this.weightUnitText}</span>
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
                    {this.destIcaoDisplay}
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
                      {this.destEfobText}
                    </span>
                    <span class="mfd-label-unit mfd-unit-trailing">{this.weightUnitText}</span>
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
                    <span class="mfd-label-unit mfd-unit-trailing">{this.weightUnitText}</span>
                  </div>
                </div>
              </div>
              <div style="flex: 1; flex-direction: column; justify-content: center; align-items: center;">
                <div class="mfd-label" style="margin-bottom: 20px; text-align: center;">
                  MIN FUEL AT DEST
                </div>
                <div style="margin-bottom: 30px; display: flex; justify-content: center;">
                  <InputField<number, number, false>
                    dataEntryFormat={new WeightFormat(undefined, Subject.create(maxMinDestFuel), this.weightUnit)}
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
                    errorHandler={(e) => this.props.fmcService.master.showFmsErrorMessage(e.type, e.details)}
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
                    <span class="mfd-label-unit mfd-unit-trailing">{this.weightUnitText}</span>
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
