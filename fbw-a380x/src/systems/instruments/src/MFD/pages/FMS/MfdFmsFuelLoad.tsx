import {
  ClockEvents,
  FSComponent,
  NumberFormatter,
  NumberUnitSubject,
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
import { getEtaFromUtcOrPresent } from '../../shared/utils';
import { NXDataStore, Units } from '@flybywiresim/fbw-sdk';

interface MfdFmsFuelLoadProps extends AbstractMfdPageProps {}

export class MfdFmsFuelLoad extends FmsPage<MfdFmsFuelLoadProps> {
  private grossWeight = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));
  private readonly grossWeightText = this.grossWeight.map((it) => (it ? (it.number / 1000).toFixed(1) : '---.-'));

  private readonly centerOfGravity = Subject.create<number | null>(null);
  private readonly centerOfGravityText = this.centerOfGravity.map((it) => (it ? it.toFixed(1) : '--.-'));

  private fuelOnBoard = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));

  private readonly fuelOnBoardText = this.fuelOnBoard.map((it) => (it ? it.number.toFixed(1) : '---.-'));

  private readonly fuelPlanningIsDisabled = Subject.create<boolean>(true);

  private readonly destinationAlternateTimeHeader = this.activeFlightPhase.map((v) =>
    v === FmgcFlightPhase.Preflight ? 'TIME' : 'UTC',
  );
  private tripFuelWeight = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));

  private readonly tripFuelWeightText = this.tripFuelWeight.map((it) => (it ? (it.number / 1000).toFixed(1) : '---.-'));

  private readonly tripFuelTime = Subject.create('--:--');

  private readonly costIndex = Subject.create<number | null>(null);

  private takeoffWeight = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));

  private landingWeight = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));

  private readonly destIcao = Subject.create<string>('----');

  private readonly destEta = Subject.create<string>('--:--');
  private destEfob = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));

  private readonly destEfobBelowMin = Subject.create(false);

  private readonly altnIcao = Subject.create<string>('----');

  private readonly altnEta = Subject.create<string>('--:--');
  private altnEfob = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));

  private readonly altnEfobBelowMin = Subject.create(false);
  private extraFuelWeight = NumberUnitSubject.create(UnitType.KILOGRAM.createNumber(NaN));

  private readonly extraFuelWeightText = this.extraFuelWeight.map((it) =>
    it ? (it.number / 1000).toFixed(1) : '---.-',
  );

  private readonly extraFuelTime = Subject.create<number | null>(null);
  private readonly extraFuelTimeText = this.extraFuelTime.map((it) => new TimeHHMMFormat().format(it ?? 0));

  private readonly blockLineRef = FSComponent.createRef<HTMLDivElement>();

  private readonly flightPhaseAtLeastTakeoff = this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff);
  private readonly flightPhaseAtLeastDescent = this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Descent);

  private weightUnit = Subject.create<Unit<UnitFamily.Weight>>(UnitType.KILOGRAM);

  protected onNewData() {
    if (!this.props.fmcService.master || !this.loadedFlightPlan) {
      return;
    }

    if (this.loadedFlightPlan.performanceData.costIndex) {
      this.costIndex.set(this.loadedFlightPlan.performanceData.costIndex);
    }

    if (!this.props.fmcService.master.fmgc.data.finalFuelIsPilotEntered.get()) {
      // Calculate final res fuel for 00:30 time
      this.props.fmcService.master.fmgc.data.finalFuelWeightCalculated.set(4_650); // FIXME
    }

    // FIXME calculate altn fuel
    this.props.fmcService.master.fmgc.data.alternateFuelCalculated.set(6_500); // FIXME

    this.updateDestAndAltnPredictions();
  }

  updateDestAndAltnPredictions() {
    if (!this.props.fmcService.master || !this.loadedFlightPlan) {
      return;
    }

    if (this.loadedFlightPlan.destinationAirport) {
      this.destIcao.set(this.loadedFlightPlan.destinationAirport.ident);
      const destPred = this.props.fmcService.master.guidanceController.vnavDriver.getDestinationPrediction();

      // TODO Should display ETA if EET present
      this.destEta.set(
        getEtaFromUtcOrPresent(destPred?.secondsFromPresent, this.activeFlightPhase.get() == FmgcFlightPhase.Preflight),
      );
      const destEfob = this.props.fmcService.master.fmgc.getDestEFOB(true);
      if (destEfob !== null) {
        this.destEfob.set(destEfob, UnitType.KILOGRAM);
      } else {
        this.destEfob.set(NaN);
      }
      this.destEfobBelowMin.set(
        destEfob * 1_000 < (this.props.fmcService.master.fmgc.data.minimumFuelAtDestination.get() ?? 0),
      );
    }

    if (this.loadedFlightPlan.alternateDestinationAirport) {
      this.altnIcao.set(this.loadedFlightPlan.alternateDestinationAirport.ident);
      this.altnEta.set('--:--');
      this.altnEfob.set(NaN);
      this.altnEfobBelowMin.set(false);
    } else {
      this.altnIcao.set('NONE');
      this.altnEta.set('--:--');
      this.altnEfob.set(NaN);
      this.altnEfobBelowMin.set(false);
    }
  }

  private weightNumberFormatter(precision: number, nanString: string) {
    return NumberFormatter.create({
      nanString: nanString,
      precision: precision,
    });
  }

  private weightUnitFormatter(unit: Unit<UnitFamily.Weight>) {
    return unit === UnitType.KILOGRAM ? 'T' : 'LBS';
  }

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const sub = this.props.bus.getSubscriber<ClockEvents & MfdSimvars>();

    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(1)
        .handle((_t) => {
          if (!this.props.fmcService.master) {
            return;
          }

          this.landingWeight.set(this.props.fmcService.master.getLandingWeight() ?? NaN, UnitType.KILOGRAM);
          this.takeoffWeight.set(this.props.fmcService.master.getTakeoffWeight() ?? NaN, UnitType.KILOGRAM);

          if (!this.props.fmcService.master.enginesWereStarted.get()) {
            this.grossWeight.set(NaN);
            this.centerOfGravity.set(null);
            this.fuelOnBoard.set(NaN);
          } else {
            // GW only displayed after engine start. Value received from FQMS, or falls back to ZFW + FOB
            this.grossWeight.set(this.props.fmcService.master.fmgc.getGrossWeightKg() ?? NaN, UnitType.KILOGRAM);

            // CG only displayed after engine start. Value received from FQMS, or falls back to value from WBBC
            const cg: number = SimVar.GetSimVarValue('L:A32NX_AIRFRAME_GW_CG_PERCENT_MAC', 'number');
            this.centerOfGravity.set(cg);

            // FOB only displayed after engine start. Value received from FQMS, or falls back to FOB stored at engine start + fuel used by FADEC
            this.fuelOnBoard.set(this.props.fmcService.master.fmgc.getFOB() ?? NaN, UnitType.KILOGRAM);
          }

          const destPred = this.props.fmcService.master.guidanceController.vnavDriver.getDestinationPrediction();
          const tripFuel = this.props.fmcService.master.getTripFuel() ?? NaN;
          this.tripFuelWeight.set(tripFuel);
          this.tripFuelTime.set(getEtaFromUtcOrPresent(destPred?.secondsFromPresent, true));
          this.extraFuelWeight.set(this.props.fmcService.master.getExtraFuel() ?? NaN);
          if (this.activeFlightPhase.get() === FmgcFlightPhase.Preflight) {
            const destPred = this.props.fmcService.master.guidanceController.vnavDriver.getDestinationPrediction();
            // EXTRA = BLOCK - TAXI - TRIP - MIN FUEL DEST - RTE RSV
            const fob = this.props.fmcService.master.fmgc.getFOB() * 1_000;
            const tripFuel =
              fob - (destPred?.estimatedFuelOnBoard ? Units.poundToKilogram(destPred?.estimatedFuelOnBoard) : fob);
            this.tripFuelWeight.set(tripFuel, UnitType.KILOGRAM);

            // Calculate Rte Rsv fuel for 5.0% reserve
            this.props.fmcService.master.fmgc.data.routeReserveFuelWeightCalculated.set(
              tripFuel ? tripFuel * 0.05 : null,
            );
            this.props.fmcService.master.fmgc.data.routeReserveFuelWeightPilotEntry.set(
              tripFuel ? tripFuel * 0.05 : null,
            );

            const block = this.props.fmcService.master.fmgc.data.blockFuel.get() ?? 0;
            this.extraFuelWeight.set(
              (this.props.fmcService.master.enginesWereStarted.get() ? fob : block) -
                (this.props.fmcService.master.fmgc.data.taxiFuel.get() ?? 0) -
                (this.tripFuelWeight.get().number ?? 0) -
                (this.props.fmcService.master.fmgc.data.minimumFuelAtDestination.get() ?? 0) -
                (this.props.fmcService.master.fmgc.data.routeReserveFuelWeight.get() ?? 0),
              UnitType.KILOGRAM,
            );
          } else {
            // EXTRA = FOB - TRIP - MIN FUEL DEST
            this.extraFuelWeight.set(
              (this.fuelOnBoard.get().number ?? 0) -
                ((this.tripFuelWeight.get().number ?? 0) -
                  (this.props.fmcService.master.fmgc.data.minimumFuelAtDestination.get() ?? 0)),
            );
          }
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
      this.grossWeightText,
      this.centerOfGravityText,
      this.fuelOnBoardText,
      this.destinationAlternateTimeHeader,
      this.tripFuelWeightText,
      this.extraFuelWeightText,
      this.extraFuelTimeText,
      this.flightPhaseAtLeastTakeoff,
      this.flightPhaseAtLeastDescent,
    );
    NXDataStore.getAndSubscribe('CONFIG_USING_METRIC_UNIT', (key, value) => {
      value === '1' ? this.weightUnit.set(UnitType.KILOGRAM) : this.weightUnit.set(UnitType.POUND);
    });
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
                <span class="mfd-value">
                  {this.grossWeight.map((it) =>
                    this.weightNumberFormatter(2, '---.-')(it.asUnit(this.weightUnit.get()) / 1000),
                  )}
                </span>
                <span class="mfd-label-unit mfd-unit-trailing">
                  {this.weightUnit.map((v) => this.weightUnitFormatter(v))}
                </span>
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">CG</span>
                <span class="mfd-value">{this.centerOfGravityText}</span>
                <span class="mfd-label-unit mfd-unit-trailing">%</span>
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">FOB</span>
                <span class="mfd-value">
                  {this.fuelOnBoard.map((it) =>
                    this.weightNumberFormatter(2, '---.-')(it.asUnit(this.weightUnit.get()) / 1000),
                  )}
                </span>
                <span class="mfd-label-unit mfd-unit-trailing">
                  {this.weightUnit.map((v) => this.weightUnitFormatter(v))}
                </span>
              </div>
            </div>
            <div style="display: flex; flex-direction: row; margin-bottom: 15px; align-items: center; ">
              <div class="mfd-label mfd-spacing-right fuelLoad">ZFW</div>
              <InputField<number>
                dataEntryFormat={new WeightFormat(Subject.create(minZfw), Subject.create(maxZfw), this.weightUnit)}
                value={this.props.fmcService.master.fmgc.data.zeroFuelWeight}
                mandatory={Subject.create(true)}
                canBeCleared={Subject.create(false)}
                alignText="flex-end"
                containerStyle="width: 150px;"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <div class="mfd-label mfd-spacing-right fuelLoad">ZFWCG</div>
              <InputField<number>
                dataEntryFormat={new PercentageFormat(Subject.create(minZfwCg), Subject.create(maxZfwCg))}
                value={this.props.fmcService.master.fmgc.data.zeroFuelWeightCenterOfGravity}
                mandatory={Subject.create(true)}
                canBeCleared={Subject.create(false)}
                alignText="center"
                containerStyle="width: 125px;"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
            <div ref={this.blockLineRef} class="mfd-fms-fuel-load-block-line">
              <div class="mfd-label mfd-spacing-right fuelLoad">BLOCK</div>
              <InputField<number>
                dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxBlockFuel), this.weightUnit)}
                value={this.props.fmcService.master.fmgc.data.blockFuel}
                mandatory={Subject.create(true)}
                alignText="flex-end"
                containerStyle="width: 150px;"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
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
            <div class="mfd-fms-fuel-load-middle-grid">
              <div class="mfd-label mfd-spacing-right middleGrid">TAXI</div>
              <div style="margin-bottom: 20px;">
                <InputField<number>
                  dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxTaxiFuel), this.weightUnit)}
                  dataHandlerDuringValidation={async (v) =>
                    this.props.fmcService.master?.fmgc.data.taxiFuelPilotEntry.set(v)
                  }
                  enteredByPilot={this.props.fmcService.master.fmgc.data.taxiFuelIsPilotEntered}
                  value={this.props.fmcService.master.fmgc.data.taxiFuel}
                  unitConversion={'unitWeightConversion'}
                  disabled={this.flightPhaseAtLeastTakeoff}
                  alignText="flex-end"
                  containerStyle="width: 150px;"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div />
              <div class="mfd-label mfd-spacing-right middleGrid">PAX NBR</div>
              <div style="margin-bottom: 20px;">
                <InputField<number>
                  dataEntryFormat={new PaxNbrFormat()}
                  dataHandlerDuringValidation={async (v) => {
                    if (v !== null) {
                      this.props.fmcService.master?.fmgc.data.paxNumber.set(v);
                      this.props.fmcService.master?.acInterface.updatePaxNumber(v);
                    }
                  }}
                  value={this.props.fmcService.master.fmgc.data.paxNumber}
                  mandatory={Subject.create(true)}
                  alignText="center"
                  containerStyle="width: 75px;"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div class="mfd-label mfd-spacing-right middleGrid">TRIP</div>
              <div class="mfd-label-value-container" style="justify-content: flex-end; margin-bottom: 20px;">
                <span class="mfd-value">
                  {this.tripFuelWeight.map((it) =>
                    this.weightNumberFormatter(2, '---.-')(it.asUnit(this.weightUnit.get()) / 1000),
                  )}
                </span>
                <span class="mfd-label-unit mfd-unit-trailing">
                  {this.weightUnit.map((v) => this.weightUnitFormatter(v))}
                </span>
              </div>
              <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                <span class="mfd-value">{this.tripFuelTime}</span>
              </div>
              <div class="mfd-label mfd-spacing-right middleGrid">CI</div>
              <div style="margin-bottom: 20px;">
                <InputField<number>
                  dataEntryFormat={new CostIndexFormat()}
                  dataHandlerDuringValidation={async (v) => {
                    this.loadedFlightPlan?.setPerformanceData('costIndex', v);
                  }}
                  value={this.costIndex}
                  mandatory={Subject.create(true)}
                  disabled={this.flightPhaseAtLeastDescent}
                  alignText="center"
                  containerStyle="width: 75px;"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div class="mfd-label mfd-spacing-right middleGrid">RTE RSV</div>
              <div style="margin-bottom: 20px;">
                <InputField<number>
                  disabled={this.flightPhaseAtLeastTakeoff}
                  dataEntryFormat={
                    new WeightFormat(
                      Subject.create(AirlineModifiableInformation.EK.rsvMin),
                      Subject.create(AirlineModifiableInformation.EK.rsvMax),
                    )
                  }
                  dataHandlerDuringValidation={async (v) =>
                    this.props.fmcService.master?.fmgc.data.routeReserveFuelWeightPilotEntry.set(v)
                  }
                  enteredByPilot={this.props.fmcService.master.fmgc.data.routeReserveFuelIsPilotEntered}
                  value={this.props.fmcService.master.fmgc.data.routeReserveFuelWeight}
                  alignText="flex-end"
                  containerStyle="width: 150px;"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div style="margin-bottom: 20px; margin-left: 5px">
                <InputField<number>
                  disabled={this.flightPhaseAtLeastTakeoff}
                  dataEntryFormat={new PercentageFormat(Subject.create(0), Subject.create(maxRteRsvFuelPerc))}
                  dataHandlerDuringValidation={async (v) => {
                    this.props.fmcService.master?.fmgc.data.routeReserveFuelWeightPilotEntry.set(null);
                    this.props.fmcService.master?.fmgc.data.routeReserveFuelPercentagePilotEntry.set(v);
                  }}
                  enteredByPilot={this.props.fmcService.master.fmgc.data.routeReserveFuelPercentageIsPilotEntered}
                  value={this.props.fmcService.master.fmgc.data.routeReserveFuelPercentage}
                  alignText="center"
                  containerStyle="width: 120px;"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div class="mfd-label mfd-spacing-right middleGrid">JTSN GW</div>
              <div style="margin-bottom: 20px;">
                <InputField<number>
                  dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxJtsnGw))}
                  value={this.props.fmcService.master.fmgc.data.jettisonGrossWeight}
                  alignText="flex-end"
                  containerStyle="width: 150px;"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div class="mfd-label mfd-spacing-right middleGrid">ALTN</div>
              <div style="margin-bottom: 20px;">
                <InputField<number>
                  dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxAltnFuel), this.weightUnit)}
                  dataHandlerDuringValidation={async (v) =>
                    this.props.fmcService.master?.fmgc.data.alternateFuelPilotEntry.set(v)
                  }
                  enteredByPilot={this.props.fmcService.master.fmgc.data.alternateFuelIsPilotEntered}
                  value={this.props.fmcService.master.fmgc.data.alternateFuel}
                  alignText="flex-end"
                  containerStyle="width: 150px;"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                <span class="mfd-value">--:--</span>
              </div>
              <div class="mfd-label mfd-spacing-right middleGrid">TOW</div>
              <div class="mfd-label-value-container" style="justify-content: flex-end; margin-bottom: 20px;">
                <span class="mfd-value">
                  {this.takeoffWeight.map((it) =>
                    this.weightNumberFormatter(2, '---.-')(it.asUnit(this.weightUnit.get()) / 1000),
                  )}
                </span>
                <span class="mfd-label-unit mfd-unit-trailing">
                  {this.weightUnit.map((v) => this.weightUnitFormatter(v))}
                </span>
              </div>
              <div class="mfd-label mfd-spacing-right middleGrid">FINAL</div>
              <div style="margin-bottom: 20px;">
                <InputField<number>
                  dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxFinalFuel), this.weightUnit)}
                  dataHandlerDuringValidation={async (v) => {
                    this.props.fmcService.master?.fmgc.data.finalFuelWeightPilotEntry.set(v);
                    this.props.fmcService.master?.fmgc.data.finalFuelTimePilotEntry.set(v ? v / 200 : null); // assuming 200kg fuel burn per minute FIXME
                  }}
                  enteredByPilot={this.props.fmcService.master.fmgc.data.finalFuelIsPilotEntered}
                  value={this.props.fmcService.master.fmgc.data.finalFuelWeight}
                  alignText="flex-end"
                  containerStyle="width: 150px;"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div style="margin-bottom: 20px; margin-left: 5px;">
                <InputField<number>
                  dataEntryFormat={new TimeHHMMFormat()}
                  dataHandlerDuringValidation={async (v) => {
                    this.props.fmcService.master?.fmgc.data.finalFuelTimePilotEntry.set(v);
                    this.props.fmcService.master?.fmgc.data.finalFuelWeightPilotEntry.set(v ? v * 200 : null); // assuming 200kg fuel burn per minute FIXME
                  }}
                  enteredByPilot={this.props.fmcService.master.fmgc.data.finalFuelIsPilotEntered}
                  value={this.props.fmcService.master.fmgc.data.finalFuelTime}
                  alignText="center"
                  containerStyle="width: 120px;"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div class="mfd-label mfd-spacing-right middleGrid">LW</div>
              <div class="mfd-label-value-container" style="justify-content: flex-end; margin-bottom: 20px;">
                <span class="mfd-value">
                  {this.landingWeight.map((it) =>
                    this.weightNumberFormatter(2, '---.-')(it.asUnit(this.weightUnit.get()) / 1000),
                  )}
                </span>
                <span class="mfd-label-unit mfd-unit-trailing">
                  {this.weightUnit.map((v) => this.weightUnitFormatter(v))}
                </span>
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
                  <div class="mfd-label bigger green mfd-fms-fuel-load-dest-grid-middle-cell">{this.destIcao}</div>
                  <div class="mfd-label bigger green mfd-fms-fuel-load-dest-grid-middle-cell">{this.destEta}</div>
                  <div class="mfd-label-value-container mfd-fms-fuel-load-dest-grid-efob-cell">
                    <span class={{ 'mfd-value': true, amber: this.destEfobBelowMin }}>
                      {this.destEfob.map((it) =>
                        this.weightNumberFormatter(2, '---.-')(it.asUnit(this.weightUnit.get()) / 1000),
                      )}
                    </span>
                    <span class="mfd-label-unit mfd-unit-trailing">
                      {this.weightUnit.map((v) => this.weightUnitFormatter(v))}
                    </span>
                  </div>
                  <div class="mfd-label" style="text-align: center; align-self: center;">
                    ALTN
                  </div>
                  <div class="mfd-label bigger green" style="text-align: center; align-self: center;">
                    {this.altnIcao}
                  </div>
                  <div class="mfd-label bigger green" style="text-align: center; align-self: center;">
                    {this.altnEta}
                  </div>
                  <div class="mfd-label-value-container mfd-fms-fuel-load-dest-grid-efob-cell">
                    <span class={{ 'mfd-value': true, amber: this.altnEfobBelowMin }}>
                      {this.altnEfob.map((it) =>
                        this.weightNumberFormatter(2, '---.-')(it.asUnit(this.weightUnit.get()) / 1000),
                      )}
                    </span>
                    <span class="mfd-label-unit mfd-unit-trailing">
                      {this.weightUnit.map((v) => this.weightUnitFormatter(v))}
                    </span>
                  </div>
                </div>
              </div>
              <div style="flex: 1; flex-direction: column; justify-content: center; align-items: center;">
                <div class="mfd-label" style="margin-bottom: 20px; text-align: center;">
                  MIN FUEL AT DEST
                </div>
                <div style="margin-bottom: 30px; display: flex; justify-content: center;">
                  <InputField<number>
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxBlockFuel), this.weightUnit)}
                    dataHandlerDuringValidation={async (v) =>
                      this.props.fmcService.master?.fmgc.data.minimumFuelAtDestinationPilotEntry.set(v)
                    }
                    enteredByPilot={this.props.fmcService.master.fmgc.data.minimumFuelAtDestinationIsPilotEntered}
                    value={this.props.fmcService.master.fmgc.data.minimumFuelAtDestination}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div class="mfd-label" style="margin-bottom: 5px; text-align: center;">
                  EXTRA
                </div>
                <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                  <div class="mfd-label-value-container" style="margin-right: 20px;">
                    <span class="mfd-value">
                      {this.extraFuelWeight.map((it) =>
                        this.weightNumberFormatter(2, '---.-')(it.asUnit(this.weightUnit.get()) / 1000),
                      )}
                    </span>
                    <span class="mfd-label-unit mfd-unit-trailing">
                      {this.weightUnit.map((v) => this.weightUnitFormatter(v))}
                    </span>
                  </div>
                  <span class="mfd-value">{this.extraFuelTimeText}</span>
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
          <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
        </>
      )
    );
  }
}
