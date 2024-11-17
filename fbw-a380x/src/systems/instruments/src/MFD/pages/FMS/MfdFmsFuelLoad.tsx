import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsFuelLoad.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';

import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import {
  CostIndexFormat,
  PaxNbrFormat,
  PercentageFormat,
  TimeHHMMFormat,
  WeightFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button } from 'instruments/src/MFD/pages/common/Button';
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
import { Units } from '@flybywiresim/fbw-sdk';
import { getEtaFromUtcOrPresent } from '../../shared/utils';

interface MfdFmsFuelLoadProps extends AbstractMfdPageProps {}

export class MfdFmsFuelLoad extends FmsPage<MfdFmsFuelLoadProps> {
  private grossWeight = Subject.create<number | null>(null);

  private centerOfGravity = Subject.create<number | null>(null);

  private fuelOnBoard = Subject.create<number | null>(null);

  private fuelPlanningIsDisabled = Subject.create<boolean>(true);

  private DestinationAlternateTimeHeader = this.activeFlightPhase.map((v) =>
    v === FmgcFlightPhase.Preflight ? 'TIME' : 'UTC',
  );

  private tripFuelWeight = Subject.create<number | null>(null);

  private tripFuelTime = Subject.create('--:--');

  private costIndex = Subject.create<number | null>(null);

  private takeoffWeight = Subject.create<number | null>(null);

  private landingWeight = Subject.create<number | null>(null);

  private destIcao = Subject.create<string>('----');

  private destEta = Subject.create<string>('--:--');

  private destEfob = Subject.create<string>('---.-');

  private destEfobBelowMin = Subject.create(false);

  private altnIcao = Subject.create<string>('----');

  private altnEta = Subject.create<string>('--:--');

  private altnEfob = Subject.create<string>('---.-');

  private altnEfobBelowMin = Subject.create(false);

  private extraFuelWeight = Subject.create<number | null>(null);

  private extraFuelTime = Subject.create<number | null>(null);

  private blockLineRef = FSComponent.createRef<HTMLDivElement>();

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
      this.destEfob.set(destEfob !== null ? destEfob.toFixed(1) : '---.-');
      this.destEfobBelowMin.set(
        destEfob * 1_000 < (this.props.fmcService.master.fmgc.data.minimumFuelAtDestination.get() ?? 0),
      );
    }

    if (this.loadedFlightPlan.alternateDestinationAirport) {
      this.altnIcao.set(this.loadedFlightPlan.alternateDestinationAirport.ident);
      this.altnEta.set('--:--');
      this.altnEfob.set('---.-');
      this.altnEfobBelowMin.set(false);
    } else {
      this.altnIcao.set('NONE');
      this.altnEta.set('--:--');
      this.altnEfob.set('---.-');
      this.altnEfobBelowMin.set(false);
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
          if (!this.props.fmcService.master) {
            return;
          }

          this.landingWeight.set(this.props.fmcService.master.getLandingWeight());
          this.takeoffWeight.set(this.props.fmcService.master.getTakeoffWeight());

          if (!this.props.fmcService.master.enginesWereStarted.get()) {
            this.grossWeight.set(null);
            this.centerOfGravity.set(null);
            this.fuelOnBoard.set(null);
          } else {
            // GW only displayed after engine start. Value received from FQMS, or falls back to ZFW + FOB
            this.grossWeight.set(this.props.fmcService.master.fmgc.getGrossWeightKg());

            // CG only displayed after engine start. Value received from FQMS, or falls back to value from WBBC
            const cg: number = SimVar.GetSimVarValue('CG PERCENT', 'Percent over 100') * 100;
            this.centerOfGravity.set(cg);

            // FOB only displayed after engine start. Value received from FQMS, or falls back to FOB stored at engine start + fuel used by FADEC
            this.fuelOnBoard.set(this.props.fmcService.master.fmgc.getFOB());
          }

          const destPred = this.props.fmcService.master.guidanceController.vnavDriver.getDestinationPrediction();
          if (this.activeFlightPhase.get() === FmgcFlightPhase.Preflight) {
            // EXTRA = BLOCK - TAXI - TRIP - MIN FUEL DEST - RTE RSV
            const fob = this.props.fmcService.master.fmgc.getFOB() * 1_000;
            const tripFuel =
              fob - (destPred?.estimatedFuelOnBoard ? Units.poundToKilogram(destPred?.estimatedFuelOnBoard) : fob);
            this.tripFuelWeight.set(tripFuel);
            this.tripFuelTime.set(getEtaFromUtcOrPresent(destPred?.secondsFromPresent, true));

            // Calculate Rte Rsv fuel if not manually entered
            const pilotEnteredReserveFuel = this.props.fmcService.master.fmgc.data.routeReserveFuelIsPilotEntered.get();
            this.props.fmcService.master.fmgc.data.routeReserveFuelWeightCalculated.set(
              !pilotEnteredReserveFuel && tripFuel
                ? (tripFuel * this.props.fmcService.master.fmgc.data.routeReserveFuelPercentage.get()!) / 100
                : null,
            );
            if (!pilotEnteredReserveFuel) {
              this.props.fmcService.master.fmgc.data.routeReserveFuelWeightPilotEntry.set(null);
            }

            const block = this.props.fmcService.master.fmgc.data.blockFuel.get() ?? 0;
            this.extraFuelWeight.set(
              (this.props.fmcService.master.enginesWereStarted.get() ? fob : block) -
                (this.props.fmcService.master.fmgc.data.taxiFuel.get() ?? 0) -
                (this.tripFuelWeight.get() ?? 0) -
                (this.props.fmcService.master.fmgc.data.minimumFuelAtDestination.get() ?? 0) -
                (this.props.fmcService.master.fmgc.data.routeReserveFuelWeight.get() ?? 0),
            );
          } else {
            if (destPred) {
              const fobKg = this.props.fmcService.master.fmgc.getFOB() * 1000;
              const destFuelKg = Units.poundToKilogram(destPred?.estimatedFuelOnBoard);
              const remainingTripFuel = fobKg - destFuelKg;
              this.tripFuelWeight.set(remainingTripFuel);
              this.tripFuelTime.set(getEtaFromUtcOrPresent(destPred.secondsFromPresent, true));
              this.extraFuelWeight.set(
                destFuelKg - (this.props.fmcService.master.fmgc.data.minimumFuelAtDestination.get() ?? 0),
              );
            }
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
                <span class="mfd-value">{this.grossWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'))}</span>
                <span class="mfd-label-unit mfd-unit-trailing">T</span>
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">CG</span>
                <span class="mfd-value">{this.centerOfGravity.map((it) => (it ? it.toFixed(1) : '--.-'))}</span>
                <span class="mfd-label-unit mfd-unit-trailing">%</span>
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">FOB</span>
                <span class="mfd-value">{this.fuelOnBoard.map((it) => (it ? it.toFixed(1) : '---.-'))}</span>
                <span class="mfd-label-unit mfd-unit-trailing">T</span>
              </div>
            </div>
            <div style="display: flex; flex-direction: row; margin-bottom: 15px; align-items: center; ">
              <div class="mfd-label mfd-spacing-right fuelLoad">ZFW</div>
              <InputField<number>
                dataEntryFormat={new WeightFormat(Subject.create(minZfw), Subject.create(maxZfw))}
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
                dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxBlockFuel))}
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
                  dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxTaxiFuel))}
                  dataHandlerDuringValidation={async (v) =>
                    this.props.fmcService.master?.fmgc.data.taxiFuelPilotEntry.set(v)
                  }
                  enteredByPilot={this.props.fmcService.master.fmgc.data.taxiFuelIsPilotEntered}
                  value={this.props.fmcService.master.fmgc.data.taxiFuel}
                  inactive={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
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
                  {this.tripFuelWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'))}
                </span>
                <span class="mfd-label-unit mfd-unit-trailing">T</span>
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
                  disabled={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Descent)}
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
                  disabled={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
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
                  disabled={this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff)}
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
                  dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxAltnFuel))}
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
                <span class="mfd-value">{this.takeoffWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'))}</span>
                <span class="mfd-label-unit mfd-unit-trailing">T</span>
              </div>
              <div class="mfd-label mfd-spacing-right middleGrid">FINAL</div>
              <div style="margin-bottom: 20px;">
                <InputField<number>
                  dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxFinalFuel))}
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
                <span class="mfd-value">{this.landingWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'))}</span>
                <span class="mfd-label-unit mfd-unit-trailing">T</span>
              </div>
            </div>
            <div style="flex: 1; display: flex; flex-direction: row; margin-top: 25px;">
              <div style="width: 62.5%">
                <div style="display: grid; grid-template-columns: auto auto auto auto;">
                  <div class="mfd-fms-fuel-load-dest-grid-top-cell" />
                  <div class="mfd-fms-fuel-load-dest-grid-top-cell" />
                  <div class="mfd-label mfd-fms-fuel-load-dest-grid-top-cell">
                    {this.DestinationAlternateTimeHeader}
                  </div>
                  <div class="mfd-label mfd-fms-fuel-load-dest-grid-top-cell">EFOB</div>
                  <div class="mfd-label mfd-fms-fuel-load-dest-grid-middle-cell">DEST</div>
                  <div class="mfd-label bigger green mfd-fms-fuel-load-dest-grid-middle-cell">{this.destIcao}</div>
                  <div class="mfd-label bigger green mfd-fms-fuel-load-dest-grid-middle-cell">{this.destEta}</div>
                  <div class="mfd-label-value-container mfd-fms-fuel-load-dest-grid-efob-cell">
                    <span class={{ 'mfd-value': true, amber: this.destEfobBelowMin }}>{this.destEfob}</span>
                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
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
                    <span class={{ 'mfd-value': true, amber: this.altnEfobBelowMin }}>{this.altnEfob}</span>
                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                  </div>
                </div>
              </div>
              <div style="flex: 1; flex-direction: column; justify-content: center; align-items: center;">
                <div class="mfd-label" style="margin-bottom: 20px; text-align: center;">
                  MIN FUEL AT DEST
                </div>
                <div style="margin-bottom: 30px; display: flex; justify-content: center;">
                  <InputField<number>
                    dataEntryFormat={new WeightFormat()}
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
                      {this.extraFuelWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'))}
                    </span>
                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
                  </div>
                  <span class="mfd-value">{this.extraFuelTime.map((it) => new TimeHHMMFormat().format(it ?? 0))}</span>
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
