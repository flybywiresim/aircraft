import { ArraySubject, FSComponent, MappedSubject, MappedSubscribable, Subject, VNode } from '@microsoft/msfs-sdk';

import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import {
  AirportFormat,
  CostIndexFormat,
  CrzTempFormat,
  FlightLevelFormat,
  LongAlphanumericFormat,
  TripWindFormat,
  TropoFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button, ButtonMenuItem } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { maxCertifiedAlt } from '@shared/PerformanceConstants';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { FmgcFlightPhase } from '@shared/flightphase';
import { A380AltitudeUtils } from '@shared/OperatingAltitudes';
import { AtsuStatusCodes } from '@datalink/common';
import { FmsRouterMessages } from '@datalink/router';
import { DropdownMenu } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/DropdownMenu';
import { showReturnButtonUriExtra } from '../../shared/utils';

import './MfdFmsInit.scss';
import { FlightPlanChangeNotifier } from '@fmgc/flightplanning/sync/FlightPlanChangeNotifier';
import { CostIndexMode } from '@fmgc/flightplanning/plans/performance/FlightPlanPerformanceData';
import { FlightPlanIndex } from '@fmgc/flightplanning/FlightPlanManager';

interface MfdFmsInitProps extends AbstractMfdPageProps {}

export class MfdFmsInit extends FmsPage<MfdFmsInitProps> {
  private readonly flightPlanChangeNotifier = new FlightPlanChangeNotifier(this.props.bus);

  private readonly cpnyFplnButtonLabel = this.props.fmcService.master
    ? this.props.fmcService.master.fmgc.data.cpnyFplnAvailable.map((it) => {
        if (!it) {
          return (
            <span>
              CPNY F-PLN
              <br />
              REQUEST
            </span>
          );
        }
        return (
          <span>
            RECEIVED
            <br />
            CPNY F-PLN
          </span>
        );
      })
    : MappedSubject.create(() => <></>);

  private readonly cpnyFplnButtonMenuItems: MappedSubscribable<ButtonMenuItem[]> = this.props.fmcService.master
    ? this.props.fmcService.master.fmgc.data.cpnyFplnAvailable.map((it) =>
        it
          ? [
              {
                label: 'INSERT*',
                action: () => this.props.fmcService.master?.insertCpnyFpln(this.loadedFlightPlanIndex.get()),
              },
              {
                label: 'CLEAR*',
                action: () => {
                  this.props.fmcService.master?.flightPlanInterface.uplinkDelete();
                  this.props.fmcService.master?.fmgc.data.cpnyFplnAvailable.set(false);
                },
              },
            ]
          : [],
      )
    : MappedSubject.create(() => []);

  private readonly mandatoryAndActiveFpln = this.loadedFlightPlanIndex.map(
    (it) => it === FlightPlanIndex.Active || it === FlightPlanIndex.Temporary,
  );

  private readonly visibilityConsideringFlightPlanIndex = this.loadedFlightPlanIndex.map((it) =>
    it === FlightPlanIndex.Active || it === FlightPlanIndex.Temporary ? 'inherit' : 'hidden',
  );

  private readonly fromIcao = Subject.create<string | null>(null);

  private readonly toIcao = Subject.create<string | null>(null);

  private readonly cityPairDisabled = MappedSubject.create(
    ([fp, tmpy, fromIcao, toIcao]) => (fp > FmgcFlightPhase.Preflight && (!fromIcao || !toIcao)) || tmpy,
    this.activeFlightPhase,
    this.tmpyActive,
    this.fromIcao,
    this.toIcao,
  );

  private readonly altnIcao = Subject.create<string | null>(null);

  private readonly altnDisabled = MappedSubject.create(
    ([toIcao, fromIcao]) => !toIcao || !fromIcao,
    this.fromIcao,
    this.toIcao,
  );

  private readonly cpnyRte = Subject.create<string | null>(null); // FIXME not found

  private readonly altnRte = Subject.create<string | null>(null); // FIXME not found

  private readonly crzFl = Subject.create<number | null>(null);

  private readonly crzFlIsMandatory = Subject.create(true);

  private readonly costIndex = Subject.create<number | null>(null);

  private readonly costIndexMode = Subject.create<CostIndexMode>(CostIndexMode.ECON);

  private readonly costIndexModeLabels = ArraySubject.create(['LRC', 'ECON']);

  private readonly costIndexDisabled = MappedSubject.create(
    ([toIcao, fromIcao, flightPhase, ciMode]) =>
      !toIcao || !fromIcao || flightPhase >= FmgcFlightPhase.Descent || ciMode === CostIndexMode.LRC,
    this.fromIcao,
    this.toIcao,
    this.activeFlightPhase,
    this.costIndexMode,
  );

  private readonly tropopause = Subject.create<number | null>(null);
  private readonly tropopauseIsPilotEntered = Subject.create<boolean>(false);

  private readonly tripWind = Subject.create<number | null>(null);

  private readonly tripWindDisabled = MappedSubject.create(
    ([toIcao, fromIcao]) => !toIcao || !fromIcao,
    this.fromIcao,
    this.toIcao,
  );

  private readonly cpnyRteMandatory = MappedSubject.create(
    ([toIcao, fromIcao, mandatoryAndActive]) => (!toIcao || !fromIcao) && mandatoryAndActive,
    this.fromIcao,
    this.toIcao,
    this.mandatoryAndActiveFpln,
  );

  private readonly departureButtonDisabled = MappedSubject.create(
    ([toIcao, fromIcao, phase]) => !toIcao || !fromIcao || phase !== FmgcFlightPhase.Preflight,
    this.fromIcao,
    this.toIcao,
    this.activeFlightPhase,
  );

  private readonly cruiseTemperature = Subject.create<number | null>(null);
  private readonly cruiseTemperatureIsPilotEntered = Subject.create<boolean>(false);

  private readonly crzTempDisabled = this.crzFl.map((it) => it === null);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subs.push(
      this.props.bus
        .getSubscriber<FmsRouterMessages>()
        .on('routerManagementResponse')
        .handle((data) => {
          this.routerResponseCallbacks.every((callback, index) => {
            if (callback(data.status, data.requestId)) {
              this.routerResponseCallbacks.splice(index, 1);
              return false;
            }
            return true;
          });
        }),
    );

    if (this.props.fmcService.master) {
      this.subs.push(
        this.props.fmcService.master.fmgc.data.atcCallsign.sub((c) => {
          if (c) {
            this.connectToNetworks(c);
            this.props.fmcService.master?.updateFlightNumber(c, this.loadedFlightPlanIndex.get(), () => {});
          } else {
            this.disconnectFromNetworks();
          }
          this.props.fmcService.master?.acInterface.updateFmsData();
        }),
      );
    }

    this.subs.push(
      this.flightPlanChangeNotifier.flightPlanChanged.sub(() => {
        if (
          this.loadedFlightPlan &&
          this.props.fmcService.master?.flightPlanInterface.has(this.loadedFlightPlanIndex.get())
        ) {
          this.subs.push(
            this.loadedFlightPlan.performanceData.tropopause.pipe(this.tropopause),
            this.loadedFlightPlan.performanceData.tropopauseIsPilotEntered.pipe(this.tropopauseIsPilotEntered),
            this.loadedFlightPlan.performanceData.costIndexMode!.pipe(this.costIndexMode),
          );
        }
      }, true),
    );

    this.subs.push(
      this.eoActive.sub((v) => {
        this.costIndexModeLabels.set(v ? ['EO-LRC', 'EO-ECON'] : ['LRC', 'ECON']);
      }, true),
    );

    this.subs.push(
      this.cpnyFplnButtonLabel,
      this.cpnyFplnButtonMenuItems,
      this.mandatoryAndActiveFpln,
      this.visibilityConsideringFlightPlanIndex,
      this.cityPairDisabled,
      this.altnDisabled,
      this.costIndexDisabled,
      this.tripWindDisabled,
      this.cpnyRteMandatory,
      this.departureButtonDisabled,
    );
  }

  protected onNewData() {
    if (!this.props.fmcService.master || !this.loadedFlightPlan) {
      return;
    }

    // Update internal subjects for display purposes or input fields
    if (this.loadedFlightPlan.originAirport) {
      this.fromIcao.set(this.loadedFlightPlan.originAirport.ident);
    }

    if (this.loadedFlightPlan.destinationAirport) {
      this.toIcao.set(this.loadedFlightPlan.destinationAirport.ident);
    }

    if (this.loadedAlternateFlightPlan?.destinationAirport) {
      this.altnIcao.set(this.loadedAlternateFlightPlan.destinationAirport.ident);
    } else {
      this.altnIcao.set(this.loadedFlightPlan.originAirport && this.loadedFlightPlan.destinationAirport ? 'NONE' : '');
    }

    this.crzFlIsMandatory.set(
      this.props.fmcService.master.fmgc.getFlightPhase() < FmgcFlightPhase.Descent &&
        (this.loadedFlightPlanIndex.get() === FlightPlanIndex.Active ||
          this.loadedFlightPlanIndex.get() === FlightPlanIndex.Temporary),
    );
    const cruiseLevel = this.loadedFlightPlan.performanceData.cruiseFlightLevel.get();
    if (
      cruiseLevel &&
      this.loadedFlightPlan.performanceData.cruiseTemperatureIsaTemp?.get() &&
      this.loadedFlightPlan.performanceData.cruiseTemperatureIsaTemp.get()! -
        A380AltitudeUtils.getIsaTemp(cruiseLevel * 100) >
        0.5
    ) {
      this.props.fmcService.master.flightPlanInterface.setPerformanceData(
        'cruiseTemperatureIsaTemp',
        A380AltitudeUtils.getIsaTemp(cruiseLevel * 100),
        this.loadedFlightPlanIndex.get(),
      );
    }

    // Set some empty fields with pre-defined values
    if (this.fromIcao.get() && this.toIcao.get()) {
      if (!this.cpnyRte.get()) {
        this.cpnyRte.set('NONE');
      }

      if (!this.altnRte.get()) {
        this.altnRte.set('NONE');
      }
    }
  }

  protected onFlightPlanChanged(): void {
    super.onFlightPlanChanged();
    if (!this.loadedFlightPlan) {
      return;
    }

    this.subs.push(
      this.loadedFlightPlan.performanceData.pilotTripWind.pipe(this.tripWind),
      this.loadedFlightPlan.performanceData.cruiseTemperature.pipe(this.cruiseTemperature),
      this.loadedFlightPlan.performanceData.cruiseTemperatureIsPilotEntered.pipe(this.cruiseTemperatureIsPilotEntered),
      this.loadedFlightPlan.performanceData.cruiseFlightLevel.pipe(this.crzFl),
      this.loadedFlightPlan.performanceData.costIndex.pipe(this.costIndex),
    );
  }

  private async cityPairModified() {
    const fromIcao = this.fromIcao.get();
    const toIcao = this.toIcao.get();
    const cityPairIsDifferent =
      fromIcao !== this.props.fmcService.master?.flightPlanInterface.active.originAirport?.ident ||
      toIcao !== this.props.fmcService.master.flightPlanInterface.active.destinationAirport?.ident;
    if (fromIcao && toIcao && cityPairIsDifferent) {
      await this.props.fmcService.master?.flightPlanInterface.newCityPair(
        fromIcao,
        toIcao,
        this.altnIcao.get() ?? undefined,
      );
      this.props.fmcService.master?.acInterface.updateFmsData();
    }
  }

  private requestId = 0;

  private routerResponseCallbacks: ((code: AtsuStatusCodes, requestId: number) => boolean)[] = [];

  private async connectToNetworks(callsign: string): Promise<AtsuStatusCodes> {
    const publisher = this.props.bus.getPublisher<FmsRouterMessages>();
    return new Promise<AtsuStatusCodes>((resolve, _reject) => {
      const disconnectRequestId = this.requestId++;
      publisher.pub('routerDisconnect', disconnectRequestId, true, false);
      this.routerResponseCallbacks.push((_code: AtsuStatusCodes, id: number) => {
        if (id === disconnectRequestId) {
          const connectRequestId = this.requestId++;
          publisher.pub('routerConnect', { callsign, requestId: connectRequestId }, true, false);
          this.routerResponseCallbacks.push((code: AtsuStatusCodes, id: number) => {
            if (id === connectRequestId) resolve(code);
            return id === connectRequestId;
          });
        }
        return id === disconnectRequestId;
      });
    });
  }

  private async disconnectFromNetworks(): Promise<AtsuStatusCodes> {
    const publisher = this.props.bus.getPublisher<FmsRouterMessages>();
    return new Promise<AtsuStatusCodes>((resolve, _reject) => {
      const disconnectRequestId = this.requestId++;
      publisher.pub('routerDisconnect', disconnectRequestId, true, false);
      this.routerResponseCallbacks.push((code: AtsuStatusCodes, id: number) => {
        if (id === disconnectRequestId) resolve(code);
        return id === disconnectRequestId;
      });
    });
  }

  public destroy(): void {
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
            <div class="mfd-fms-init-line">
              <div class="mfd-label init-input-field">FLT NBR</div>
              <InputField<string>
                dataEntryFormat={new LongAlphanumericFormat()}
                mandatory={this.mandatoryAndActiveFpln}
                value={this.props.fmcService.master.fmgc.data.atcCallsign}
                containerStyle="width: 200px; margin-right: 5px;"
                alignText="center"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <Button
                label="ACFT STATUS"
                onClick={() => this.props.mfd.uiService.navigateTo('fms/data/status')}
                buttonStyle="margin-right: 10px; width: 200px;"
              />
              <div style="flex-grow: 1" />
              <Button
                label={this.cpnyFplnButtonLabel}
                disabled={this.props.fmcService.master.fmgc.data.cpnyFplnUplinkInProgress}
                onClick={() =>
                  this.props.fmcService.master?.fmgc.data.cpnyFplnAvailable.get()
                    ? {}
                    : this.props.fmcService.master?.cpnyFplnRequest(this.loadedFlightPlanIndex.get())
                }
                buttonStyle="width: 175px;"
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_fplnreq`}
                menuItems={this.cpnyFplnButtonMenuItems}
                showArrow={false}
              />
            </div>
            <div class="mfd-fms-init-line second-line">
              <div class="mfd-label init-input-field">FROM</div>
              <InputField<string>
                dataEntryFormat={new AirportFormat()}
                dataHandlerDuringValidation={async (v) => {
                  this.fromIcao.set(v);
                  this.cityPairModified();
                }}
                mandatory={this.mandatoryAndActiveFpln}
                canBeCleared={Subject.create(false)}
                value={this.fromIcao}
                alignText="center"
                disabled={this.cityPairDisabled}
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <div class="mfd-label init-space-lr">TO</div>
              <InputField<string>
                dataEntryFormat={new AirportFormat()}
                dataHandlerDuringValidation={async (v) => {
                  this.toIcao.set(v);
                  this.cityPairModified();
                }}
                mandatory={this.mandatoryAndActiveFpln}
                canBeCleared={Subject.create(false)}
                value={this.toIcao}
                alignText="center"
                disabled={this.cityPairDisabled}
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <div class="mfd-label init-space-lr">ALTN</div>
              <InputField<string>
                dataEntryFormat={new AirportFormat()}
                dataHandlerDuringValidation={async (v) => {
                  this.altnIcao.set(v);
                  if (v) {
                    await this.props.fmcService.master?.flightPlanInterface.setAlternate(
                      v,
                      this.loadedFlightPlanIndex.get(),
                    );
                    this.props.fmcService.master?.acInterface.updateFmsData();
                  }
                }}
                mandatory={this.mandatoryAndActiveFpln}
                disabled={this.altnDisabled}
                value={this.altnIcao}
                alignText="center"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
            <div class="mfd-fms-init-line">
              <div class="mfd-label init-input-field">CPNY RTE</div>
              <InputField<string>
                dataEntryFormat={new LongAlphanumericFormat()}
                mandatory={this.cpnyRteMandatory}
                canBeCleared={Subject.create(false)}
                value={this.cpnyRte}
                containerStyle="width: 200px; margin-right: 5px;"
                alignText="center"
                disabled={Subject.create(true)} // TODO
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <Button
                disabled={Subject.create(true)}
                label="RTE SEL"
                onClick={() => console.log('RTE SEL')}
                buttonStyle="margin-right: 10px; width: 200px;"
              />
            </div>
            <div class="mfd-fms-init-line altn-rte">
              <div class="mfd-label init-input-field">ALTN RTE</div>
              <InputField<string>
                dataEntryFormat={new LongAlphanumericFormat()}
                disabled={Subject.create(true)} // TODO
                canBeCleared={Subject.create(false)}
                value={this.altnRte}
                containerStyle="width: 200px; margin-right: 5px;"
                alignText="center"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <Button
                label="ALTN RTE SEL"
                disabled={Subject.create(true /* this.altnDisabled */)}
                onClick={() => console.log('ALTN RTE SEL')}
                buttonStyle="margin-right: 10px; width: 200px;"
              />
            </div>
            <div class="mfd-fms-init-line">
              <div class="mfd-label init-input-field">CRZ FL</div>
              <InputField<number>
                dataEntryFormat={new FlightLevelFormat(Subject.create(0), Subject.create(maxCertifiedAlt / 100))}
                dataHandlerDuringValidation={async (v) =>
                  v ? this.props.fmcService.master?.acInterface.setCruiseFl(v, this.loadedFlightPlanIndex.get()) : false
                }
                mandatory={this.crzFlIsMandatory}
                disabled={this.altnDisabled}
                canBeCleared={Subject.create(false)}
                value={this.crzFl}
                containerStyle="margin-right: 100px;"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <div class="mfd-label init-input-field" style="width: auto;">
                CRZ TEMP
              </div>
              <InputField<number, number, false>
                dataEntryFormat={new CrzTempFormat()}
                dataHandlerDuringValidation={async (v) => {
                  this.props.fmcService.master?.flightPlanInterface.setPerformanceData(
                    'cruiseTemperaturePilotEntry',
                    v,
                    this.loadedFlightPlanIndex.get(),
                  );
                }}
                enteredByPilot={this.cruiseTemperatureIsPilotEntered}
                disabled={this.crzTempDisabled}
                readonlyValue={this.cruiseTemperature}
                containerStyle="width: 110px; justify-content: flex-end;"
                alignText="center"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>

            <div class="mfd-fms-init-line" style="margin-top: 10px;">
              <div class="mfd-label init-input-field">MODE</div>
              <DropdownMenu
                values={this.costIndexModeLabels}
                selectedIndex={this.costIndexMode}
                onModified={(v) =>
                  this.props.fmcService.master?.flightPlanInterface.setPerformanceData(
                    'costIndexMode',
                    v,
                    this.loadedFlightPlanIndex.get(),
                  )
                }
                idPrefix={`${this.props.mfd.uiService.captOrFo}_MFD_initCostIndexModeDropdown`}
                freeTextAllowed={false}
                containerStyle="width: 175px; margin-right: 65px; "
                numberOfDigitsForInputField={7}
                alignLabels="center"
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <div class="mfd-label init-input-field" style="width: auto;">
                TROPO
              </div>
              <InputField<number, number, false>
                dataEntryFormat={new TropoFormat()}
                dataHandlerDuringValidation={async (v) =>
                  this.props.fmcService.master?.flightPlanInterface.setPerformanceData(
                    'tropopause',
                    v,
                    this.loadedFlightPlanIndex.get(),
                  )
                }
                enteredByPilot={this.tropopauseIsPilotEntered}
                readonlyValue={this.tropopause}
                onModified={() => {}}
                alignText="flex-end"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
            <div class="mfd-fms-init-line trip-wind">
              <div class="fc" style="align-self: flex-start; margin-top: 15px;">
                <div class="mfd-label init-input-field">CI</div>
                <div class="mfd-label init-input-field" style="margin-top: 27px;">
                  TRIP WIND
                </div>
              </div>
              <div class="fc" style="align-self: flex-start; margin-top: 5px;">
                <InputField<number>
                  dataEntryFormat={new CostIndexFormat()}
                  dataHandlerDuringValidation={async (v) => {
                    this.props.fmcService.master?.flightPlanInterface?.setPerformanceData(
                      'costIndex',
                      v,
                      this.loadedFlightPlanIndex.get(),
                    );
                  }}
                  mandatory={this.mandatoryAndActiveFpln}
                  disabled={this.costIndexDisabled}
                  value={this.costIndex}
                  containerStyle="width: 70px; margin-right: 90px; justify-content: center;"
                  alignText="center"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
                <InputField<number, number, false>
                  dataEntryFormat={new TripWindFormat()}
                  dataHandlerDuringValidation={async (v) =>
                    this.props.fmcService.master?.flightPlanInterface.setPerformanceData(
                      'pilotTripWind',
                      v,
                      this.loadedFlightPlanIndex.get(),
                    )
                  }
                  disabled={this.tripWindDisabled}
                  readonlyValue={this.tripWind}
                  containerStyle="width: 125px; margin-right: 80px; margin-top: 10px;"
                  alignText="center"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <Button
                disabled={Subject.create(true)}
                label="WIND"
                onClick={() => console.log('WIND')}
                buttonStyle="margin-right: 10px; margin-top: 52px;"
              />
              <div style="flex-grow: 1" />
              <Button
                disabled={Subject.create(true)}
                label="CPNY WIND<br />REQUEST"
                onClick={() => console.log('CPNY WIND REQUEST')}
                buttonStyle="margin-right: 10px; justify-self: flex-end; width: 175px;"
              />
            </div>
            <div style={{ visibility: this.visibilityConsideringFlightPlanIndex }}>
              <Button
                label="IRS"
                onClick={() => this.props.mfd.uiService.navigateTo('fms/position/irs')}
                buttonStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;"
              />
              <div class="fr">
                <Button
                  label="DEPARTURE"
                  disabled={this.departureButtonDisabled}
                  onClick={() =>
                    this.props.mfd.uiService.navigateTo(
                      `fms/${this.props.mfd.uiService.activeUri.get().category}/f-pln-departure`,
                    )
                  }
                  buttonStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;"
                />
                <Button
                  disabled={Subject.create(true)}
                  label="RTE SUMMARY"
                  onClick={() => this.props.mfd.uiService.navigateTo('fms/data/route')}
                  buttonStyle="margin-left: 50px; margin-bottom: 10px;"
                />
              </div>
              <Button
                label="NAVAIDS"
                onClick={() => this.props.mfd.uiService.navigateTo(`fms/position/navaids/${showReturnButtonUriExtra}`)}
                buttonStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;"
              />
              <Button
                label="FUEL&LOAD"
                onClick={() =>
                  this.props.mfd.uiService.navigateTo(
                    `fms/${this.props.mfd.uiService.activeUri.get().category}/fuel-load`,
                  )
                }
                buttonStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;"
              />
              <div style="display: flex; flex-direction: row;">
                <Button
                  label="T.O. PERF"
                  onClick={() =>
                    this.props.mfd.uiService.navigateTo(
                      `fms/${this.props.mfd.uiService.activeUri.get().category}/perf/to`,
                    )
                  }
                  buttonStyle="width: 160px; margin-left: 150px; margin-bottom: 10px; height: 40px;"
                />
                <div style="flex-grow: 1" />
                <Button
                  disabled={Subject.create(true)}
                  label="CPNY T.O.<br />REQUEST"
                  onClick={() => console.log('CPNY T.O. REQUEST')}
                  buttonStyle="margin-right: 10px; justify-self: flex-end; width: 175px;"
                />
              </div>
            </div>
            {/* end page content */}
          </div>
          <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
        </>
      )
    );
  }
}
