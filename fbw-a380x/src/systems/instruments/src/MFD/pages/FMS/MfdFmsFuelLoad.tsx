import { ArraySubject, ClockEvents, FSComponent, MappedSubject, Subject, VNode } from '@microsoft/msfs-sdk';

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
import { CostIndexMode } from '../../FMC/fmgc';

interface MfdFmsFuelLoadProps extends AbstractMfdPageProps {}

export class MfdFmsFuelLoad extends FmsPage<MfdFmsFuelLoadProps> {
  private readonly grossWeight = Subject.create<number | null>(null);
  private readonly grossWeightText = this.grossWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'));

  private readonly centerOfGravity = Subject.create<number | null>(null);
  private readonly centerOfGravityText = this.centerOfGravity.map((it) => (it ? it.toFixed(1) : '--.-'));

  private readonly fuelOnBoard = Subject.create<number | null>(null);
  private readonly fuelOnBoardText = this.fuelOnBoard.map((it) => (it ? it.toFixed(1) : '---.-'));

  private readonly fuelPlanningIsDisabled = Subject.create<boolean>(true);

  private readonly destinationAlternateTimeHeader = this.activeFlightPhase.map((v) =>
    v === FmgcFlightPhase.Preflight ? 'TIME' : 'UTC',
  );

  private readonly tripFuelWeight = Subject.create<number | null>(null);
  private readonly tripFuelWeightText = this.tripFuelWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'));

  private readonly tripFuelTime = Subject.create('--:--');

  private readonly costIndex = Subject.create<number | null>(null);

  private readonly costIndexModeLabels = ArraySubject.create(['LRC', 'ECON']);

  private readonly takeoffWeight = Subject.create<number | null>(null);

  private readonly landingWeight = Subject.create<number | null>(null);

  private readonly destIcao = Subject.create<string | null>(null);

  private readonly destIcaoDisplay = this.destIcao.map((v) => (v ? v : 'NONE'));

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

  private readonly flightPhaseAtLeastTakeoff = this.activeFlightPhase.map((it) => it >= FmgcFlightPhase.Takeoff);

  private readonly alternateFuelDisabled = Subject.create(true);

  private readonly costIndexModeDisabled = MappedSubject.create(
    ([flightPhase, dest]) => flightPhase >= FmgcFlightPhase.Descent || !dest,
    this.activeFlightPhase,
    this.destIcao,
  );

  private readonly costIndexDisabled = MappedSubject.create(
    ([ciModeDisabled, ciMode]) => ciModeDisabled || ciMode === CostIndexMode.LRC,
    this.costIndexModeDisabled,
    this.props.fmcService.master?.fmgc.data.costIndexMode,
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

    if (this.loadedFlightPlan.destinationAirport) {
      this.destIcao.set(this.loadedFlightPlan.destinationAirport.ident);
      const destPred = this.props.fmcService.master.guidanceController.vnavDriver.getDestinationPrediction();

      // TODO Should display ETA if EET present
      this.destEta.set(
        getEtaFromUtcOrPresent(destPred?.secondsFromPresent, this.activeFlightPhase.get() == FmgcFlightPhase.Preflight),
      );
      const destEfob = this.props.fmcService.master.fmgc.getDestEFOB(true);
      this.destEfob.set(destEfob !== null ? destEfob.toFixed(1) : '---.-');
    } else {
      this.destIcao.set(null);
      this.destEta.set('--:--');
      this.destEfob.set('---.-');
    }

    if (this.loadedFlightPlan.alternateDestinationAirport) {
      this.altnIcao.set(this.loadedFlightPlan.alternateDestinationAirport.ident);
      this.altnEta.set('--:--');
      this.altnEfob.set(this.props.fmcService.master.fmgc.getAltEFOB());
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
          if (!this.props.fmcService.master) {
            return;
          }

          this.alternateFuelDisabled.set(!this.props.fmcService.master.fmgc.data.alternateExists.get());
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
            const cg: number = SimVar.GetSimVarValue('L:A32NX_AIRFRAME_GW_CG_PERCENT_MAC', 'number');
            this.centerOfGravity.set(cg);

            // FOB only displayed after engine start. Value received from FQMS, or falls back to FOB stored at engine start + fuel used by FADEC
            this.fuelOnBoard.set(this.props.fmcService.master.fmgc.getFOB());
          }

          const destPred = this.props.fmcService.master.guidanceController.vnavDriver.getDestinationPrediction();
          const tripFuel = this.props.fmcService.master.getTripFuel();
          this.tripFuelWeight.set(tripFuel);
          this.tripFuelTime.set(getEtaFromUtcOrPresent(destPred?.secondsFromPresent, true));
          this.extraFuelWeight.set(this.props.fmcService.master.getExtraFuel());
          if (this.activeFlightPhase.get() === FmgcFlightPhase.Preflight) {
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
      this.eoActive.sub((v) => {
        this.costIndexModeLabels.set(v ? ['EO-LRC', 'EO-ECON'] : ['LRC', 'ECON']);
      }, true),
    );

    this.subs.push(
      this.grossWeightText,
      this.centerOfGravityText,
      this.fuelOnBoardText,
      this.destinationAlternateTimeHeader,
      this.tripFuelWeightText,
      this.altnEfobText,
      this.extraFuelWeightText,
      this.extraFuelTimeText,
      this.flightPhaseAtLeastTakeoff,
      this.costIndexDisabled,
      this.costIndexModeDisabled,
    );
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
                <span class="mfd-value">{this.grossWeightText}</span>
                <span class="mfd-label-unit mfd-unit-trailing">T</span>
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">CG</span>
                <span class="mfd-value">{this.centerOfGravityText}</span>
                <span class="mfd-label-unit mfd-unit-trailing">%</span>
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">FOB</span>
                <span class="mfd-value">{this.fuelOnBoardText}</span>
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
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
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
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
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
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
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
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxTaxiFuel))}
                    dataHandlerDuringValidation={async (v) => {
                      this.props.fmcService.master?.fmgc.data.taxiFuelPilotEntry.set(v);
                    }}
                    enteredByPilot={this.props.fmcService.master.fmgc.data.taxiFuelIsPilotEntered}
                    readonlyValue={this.props.fmcService.master.fmgc.data.taxiFuel}
                    disabled={this.flightPhaseAtLeastTakeoff}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div />

                <div class="mfd-label mfd-spacing-right middleGrid">TRIP</div>
                <div class="mfd-label-value-container" style="justify-content: flex-end; margin-bottom: 20px;">
                  <span class="mfd-value">{this.tripFuelWeightText}</span>
                  <span class="mfd-label-unit mfd-unit-trailing">T</span>
                </div>
                <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                  <span class="mfd-value">{this.tripFuelTime}</span>
                </div>

                <div class="mfd-label mfd-spacing-right middleGrid">RTE RSV</div>
                <div style="margin-bottom: 20px;">
                  <InputField<number, number, false>
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
                    readonlyValue={this.props.fmcService.master.fmgc.data.routeReserveFuelWeight}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div style="margin-bottom: 20px; margin-left: 5px">
                  <InputField<number, number, false>
                    disabled={this.flightPhaseAtLeastTakeoff}
                    dataEntryFormat={new PercentageFormat(Subject.create(0), Subject.create(maxRteRsvFuelPerc))}
                    dataHandlerDuringValidation={async (v) => {
                      this.props.fmcService.master?.fmgc.data.routeReserveFuelWeightPilotEntry.set(null);
                      this.props.fmcService.master?.fmgc.data.routeReserveFuelPercentagePilotEntry.set(v);
                    }}
                    enteredByPilot={this.props.fmcService.master.fmgc.data.routeReserveFuelPercentageIsPilotEntered}
                    readonlyValue={this.props.fmcService.master.fmgc.data.routeReserveFuelPercentage}
                    alignText="center"
                    containerStyle="width: 120px;"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>

                <div class="mfd-label mfd-spacing-right middleGrid">ALTN</div>
                <div style="margin-bottom: 20px;">
                  <InputField<number, number, false>
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxAltnFuel))}
                    dataHandlerDuringValidation={async (v) =>
                      this.props.fmcService.master?.fmgc.data.alternateFuelPilotEntry.set(v)
                    }
                    disabled={this.alternateFuelDisabled}
                    enteredByPilot={this.props.fmcService.master.fmgc.data.alternateFuelIsPilotEntered}
                    readonlyValue={this.props.fmcService.master.fmgc.data.alternateFuel}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div style="display: flex; justify-content: center; margin-bottom: 20px;">
                  <span class="mfd-value">--:--</span>
                </div>

                <div class="mfd-label mfd-spacing-right middleGrid">FINAL</div>
                <div style="margin-bottom: 20px;">
                  <InputField<number, number, false>
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxFinalFuel))}
                    dataHandlerDuringValidation={async (v) => {
                      this.props.fmcService.master?.fmgc.data.finalFuelWeightPilotEntry.set(v);
                      this.props.fmcService.master?.fmgc.data.finalFuelTimePilotEntry.set(v ? v / 200 : null); // assuming 200kg fuel burn per minute FIXME
                    }}
                    enteredByPilot={this.props.fmcService.master.fmgc.data.finalFuelIsPilotEntered}
                    readonlyValue={this.props.fmcService.master.fmgc.data.finalFuelWeight}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div style="margin-bottom: 20px; margin-left: 5px;">
                  <InputField<number, number, false>
                    dataEntryFormat={new TimeHHMMFormat()}
                    dataHandlerDuringValidation={async (v) => {
                      this.props.fmcService.master?.fmgc.data.finalFuelTimePilotEntry.set(v);
                      this.props.fmcService.master?.fmgc.data.finalFuelWeightPilotEntry.set(v ? v * 200 : null); // assuming 200kg fuel burn per minute FIXME
                    }}
                    enteredByPilot={this.props.fmcService.master.fmgc.data.finalFuelIsPilotEntered}
                    readonlyValue={this.props.fmcService.master.fmgc.data.finalFuelTime}
                    alignText="center"
                    containerStyle="width: 120px;"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
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
                        this.props.fmcService.master?.fmgc.data.paxNumber.set(v);
                        this.props.fmcService.master?.acInterface.updatePaxNumber(v);
                      }
                    }}
                    value={this.props.fmcService.master.fmgc.data.paxNumber}
                    mandatory={Subject.create(true)}
                    alignText="center"
                    containerStyle="width: 75px;"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div class="mfd-label mfd-spacing-right middleGridSmall">MODE</div>
                <div style="margin-bottom: 10px;">
                  <DropdownMenu
                    disabled={this.costIndexModeDisabled}
                    values={this.costIndexModeLabels}
                    selectedIndex={this.props.fmcService.master.fmgc.data.costIndexMode}
                    idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_initCostIndexModeDropdown`}
                    freeTextAllowed={false}
                    containerStyle="width: 175px; margin-right: 65px; "
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
                      this.loadedFlightPlan?.setPerformanceData('costIndex', v);
                    }}
                    value={this.costIndex}
                    mandatory={Subject.create(true)}
                    disabled={this.costIndexDisabled}
                    alignText="center"
                    containerStyle="width: 75px;"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div class="mfd-label mfd-spacing-right middleGridSmall">JTSN GW</div>
                <div style="margin-bottom: 10px;">
                  <InputField<number>
                    dataEntryFormat={new WeightFormat(Subject.create(0), Subject.create(maxJtsnGw))}
                    value={this.props.fmcService.master.fmgc.data.jettisonGrossWeight}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div class="mfd-label mfd-spacing-right middleGridSmall">TOW</div>
                <div class="mfd-label-value-container" style="justify-content: center; margin-bottom: 10px;">
                  <span class="mfd-value">
                    {this.takeoffWeight.map((it) => (it ? (it / 1000).toFixed(1) : '---.-'))}
                  </span>
                  <span class="mfd-label-unit mfd-unit-trailing">T</span>
                </div>
                <div class="mfd-label mfd-spacing-right middleGridSmall">LW</div>
                <div class="mfd-label-value-container" style="justify-content: center; margin-bottom: 10px;">
                  <span class="mfd-value">
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
                  <div class="mfd-label bigger green mfd-fms-fuel-load-dest-grid-middle-cell">
                    {this.destIcaoDisplay}
                  </div>
                  <div class="mfd-label bigger green mfd-fms-fuel-load-dest-grid-middle-cell">{this.destEta}</div>
                  <div class="mfd-label-value-container mfd-fms-fuel-load-dest-grid-efob-cell">
                    <span class={{ 'mfd-value': true, amber: this.props.fmcService.master.fmgc.data.destEfobBelowMin }}>
                      {this.destEfob}
                    </span>
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
                    <span class="mfd-value">{this.altnEfobText}</span>
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
                    dataEntryFormat={new WeightFormat()}
                    dataHandlerDuringValidation={async (v) =>
                      this.props.fmcService.master?.fmgc.data.minimumFuelAtDestinationPilotEntry.set(v)
                    }
                    enteredByPilot={this.props.fmcService.master.fmgc.data.minimumFuelAtDestinationIsPilotEntered}
                    readonlyValue={this.props.fmcService.master.fmgc.data.minimumFuelAtDestination}
                    alignText="flex-end"
                    containerStyle="width: 150px;"
                    errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e.type, e.details)}
                    hEventConsumer={this.props.mfd.hEventConsumer}
                    interactionMode={this.props.mfd.interactionMode}
                  />
                </div>
                <div class="mfd-label" style="margin-bottom: 5px; text-align: center;">
                  EXTRA
                </div>
                <div style="display: flex; flex-direction: row; justify-content: center; align-items: center;">
                  <div class="mfd-label-value-container" style="margin-right: 20px;">
                    <span class="mfd-value">{this.extraFuelWeightText}</span>
                    <span class="mfd-label-unit mfd-unit-trailing">T</span>
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
