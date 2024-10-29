import { FSComponent, MappedSubject, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';

import './MfdFmsInit.scss';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { Footer } from 'instruments/src/MFD/pages/common/Footer';
import { InputField } from 'instruments/src/MFD/pages/common/InputField';
import {
  AirportFormat,
  CostIndexFormat,
  CrzTempFormat,
  FlightLevelFormat,
  LongAlphanumericFormat,
  TripWindFormat,
  TropoFormat,
} from 'instruments/src/MFD/pages/common/DataEntryFormats';
import { Button, ButtonMenuItem } from 'instruments/src/MFD/pages/common/Button';
import { maxCertifiedAlt } from '@shared/PerformanceConstants';
import { FmsPage } from 'instruments/src/MFD/pages/common/FmsPage';
import { NXDataStore } from '@flybywiresim/fbw-sdk';
import { ISimbriefData } from '../../../../../../../../fbw-common/src/systems/instruments/src/EFB/Apis/Simbrief/simbriefInterface';
import { SimBriefUplinkAdapter } from '@fmgc/flightplanning/uplink/SimBriefUplinkAdapter';
import { FmgcFlightPhase } from '@shared/flightphase';
import { NXFictionalMessages } from 'instruments/src/MFD/shared/NXSystemMessages';
import { A380AltitudeUtils } from '@shared/OperatingAltitudes';
import { AtsuStatusCodes } from '@datalink/common';
import { FmsRouterMessages } from '@datalink/router';

interface MfdFmsInitProps extends AbstractMfdPageProps {}

export class MfdFmsInit extends FmsPage<MfdFmsInitProps> {
  private simBriefOfp: ISimbriefData | null = null;

  private cpnyFplnButtonLabel: Subscribable<VNode> = this.props.fmcService.master
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
    : Subject.create(<></>);

  private cpnyFplnButtonMenuItems: Subscribable<ButtonMenuItem[]> = this.props.fmcService.master
    ? this.props.fmcService.master.fmgc.data.cpnyFplnAvailable.map((it) =>
        it
          ? [
              { label: 'INSERT*', action: () => this.insertCpnyFpln() },
              {
                label: 'CLEAR*',
                action: () => {
                  this.props.fmcService.master?.flightPlanService.uplinkDelete();
                  this.props.fmcService.master?.fmgc.data.cpnyFplnAvailable.set(false);
                },
              },
            ]
          : [],
      )
    : Subject.create([]);

  private fromIcao = Subject.create<string | null>(null);

  private toIcao = Subject.create<string | null>(null);

  private cityPairDisabled = MappedSubject.create(
    ([fp, tmpy]) => fp > FmgcFlightPhase.Preflight || tmpy,
    this.activeFlightPhase,
    this.tmpyActive,
  );

  private altnIcao = Subject.create<string | null>(null);

  private altnDisabled = MappedSubject.create(([toIcao, fromIcao]) => !toIcao || !fromIcao, this.fromIcao, this.toIcao);

  private cpnyRte = Subject.create<string | null>(null); // FIXME not found

  private altnRte = Subject.create<string | null>(null); // FIXME not found

  private crzFl = Subject.create<number | null>(null);

  private costIndex = Subject.create<number | null>(null);

  private costIndexDisabled = MappedSubject.create(
    ([toIcao, fromIcao, flightPhase]) => !toIcao || !fromIcao || flightPhase >= FmgcFlightPhase.Descent,
    this.fromIcao,
    this.toIcao,
    this.activeFlightPhase,
  );

  private tripWindDisabled = MappedSubject.create(
    ([toIcao, fromIcao]) => !toIcao || !fromIcao,
    this.fromIcao,
    this.toIcao,
  );

  private cpnyRteMandatory = MappedSubject.create(
    ([toIcao, fromIcao]) => !toIcao || !fromIcao,
    this.fromIcao,
    this.toIcao,
  );

  private departureButtonDisabled = MappedSubject.create(
    ([toIcao, fromIcao, phase]) => !toIcao || !fromIcao || phase !== FmgcFlightPhase.Preflight,
    this.fromIcao,
    this.toIcao,
    this.activeFlightPhase,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

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
      });

    this.props.fmcService.master?.fmgc.data.atcCallsign.sub((c) => {
      if (c) {
        this.connectToNetworks(c);
      } else {
        this.disconnectFromNetworks();
      }
    });
  }

  protected onNewData() {
    if (!this.props.fmcService.master || !this.loadedFlightPlan) {
      return;
    }

    this.props.fmcService.master.fmgc.data.cpnyFplnAvailable.set(
      this.props.fmcService.master.flightPlanService.hasUplink &&
        this.props.fmcService.master.flightPlanService.uplink.legCount > 0,
    );

    // Update internal subjects for display purposes or input fields
    if (this.loadedFlightPlan.originAirport) {
      this.fromIcao.set(this.loadedFlightPlan.originAirport.ident);
    }

    if (this.loadedFlightPlan.destinationAirport) {
      this.toIcao.set(this.loadedFlightPlan.destinationAirport.ident);
    }

    if (this.loadedFlightPlan.alternateDestinationAirport) {
      this.altnIcao.set(this.loadedFlightPlan.alternateDestinationAirport.ident);
    } else {
      this.altnIcao.set(this.loadedFlightPlan.originAirport && this.loadedFlightPlan.destinationAirport ? 'NONE' : '');
    }

    if (this.loadedFlightPlan.performanceData.cruiseFlightLevel) {
      this.crzFl.set(this.loadedFlightPlan.performanceData.cruiseFlightLevel);
      this.props.fmcService.master.fmgc.data.cruiseTemperatureIsaTemp.set(
        A380AltitudeUtils.getIsaTemp(this.loadedFlightPlan.performanceData.cruiseFlightLevel * 100),
      );
    }

    if (this.loadedFlightPlan.performanceData.costIndex) {
      this.costIndex.set(this.loadedFlightPlan.performanceData.costIndex);
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

  private async cpnyFplnRequest() {
    if (!this.props.fmcService.master) {
      return;
    }

    const navigraphUsername = NXDataStore.get('NAVIGRAPH_USERNAME', '');
    const overrideSimBriefUserID = NXDataStore.get('CONFIG_OVERRIDE_SIMBRIEF_USERID', '');

    if (!navigraphUsername && !overrideSimBriefUserID) {
      this.props.fmcService.master.addMessageToQueue(NXFictionalMessages.noNavigraphUser, undefined, undefined);
      throw new Error('No Navigraph username provided');
    }

    this.simBriefOfp = await SimBriefUplinkAdapter.downloadOfpForUserID(navigraphUsername, overrideSimBriefUserID);

    SimBriefUplinkAdapter.uplinkFlightPlanFromSimbrief(
      this.props.fmcService.master,
      this.props.fmcService.master.flightPlanService,
      this.simBriefOfp,
      { doUplinkProcedures: false },
    );
  }

  private async cityPairModified() {
    const fromIcao = this.fromIcao.get();
    const toIcao = this.toIcao.get();
    const cityPairIsDifferent =
      fromIcao !== this.props.fmcService.master?.flightPlanService.active.originAirport?.ident ||
      toIcao !== this.props.fmcService.master.flightPlanService.active.destinationAirport?.ident;
    if (fromIcao && toIcao && cityPairIsDifferent) {
      await this.props.fmcService.master?.flightPlanService.newCityPair(
        fromIcao,
        toIcao,
        this.altnIcao.get() ?? undefined,
      );
      this.props.fmcService.master?.acInterface.updateOansAirports();
    }
  }

  private async insertCpnyFpln() {
    if (!this.props.fmcService.master) {
      return;
    }

    this.props.fmcService.master.flightPlanService.uplinkInsert();
    this.props.fmcService.master?.acInterface.updateOansAirports();
    this.props.fmcService.master.fmgc.data.atcCallsign.set(this.simBriefOfp?.callsign ?? '----------');

    // Don't insert weights for now, something seems broken here
    /* this.props.fmService.fmgc.data.blockFuel.set(this.simBriefOfp.units === 'kgs' ? this.simBriefOfp.fuel.planRamp : Units.poundToKilogram(this.simBriefOfp.fuel.planRamp));
        this.props.fmService.fmgc.data.zeroFuelWeight.set(this.simBriefOfp.units === 'kgs'
            ? Number(this.simBriefOfp.weights.estZeroFuelWeight)
            : Units.poundToKilogram(Number(this.simBriefOfp.weights.estZeroFuelWeight)));
        this.props.fmService.fmgc.data.taxiFuelPilotEntry.set(this.simBriefOfp.units === 'kgs' ? this.simBriefOfp.fuel.taxi : Units.poundToKilogram(this.simBriefOfp.fuel.taxi));
        this.props.fmService.fmgc.data.alternateFuelPilotEntry.set(this.simBriefOfp.units === 'kgs' ? this.simBriefOfp.alternate.burn : Units.poundToKilogram(this.simBriefOfp.alternate.burn));
        this.props.fmService.fmgc.data.finalFuelWeightPilotEntry.set(this.simBriefOfp.units === 'kgs' ? this.simBriefOfp.fuel.reserve : Units.poundToKilogram(this.simBriefOfp.fuel.reserve));
        */

    this.props.fmcService.master.fmgc.data.paxNumber.set(Number(this.simBriefOfp?.weights?.passengerCount ?? null));
    this.props.fmcService.master.fmgc.data.tropopausePilotEntry.set(
      this.simBriefOfp?.averageTropopause ? Number(this.simBriefOfp.averageTropopause) : null,
    );

    if (this.simBriefOfp?.cruiseAltitude) {
      this.props.fmcService.master.acInterface.setCruiseFl(this.simBriefOfp.cruiseAltitude / 100);
    }

    this.props.fmcService.master.fmgc.data.cpnyFplnAvailable.set(false);
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
                mandatory={Subject.create(true)}
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
                  this.props.fmcService.master?.fmgc.data.cpnyFplnAvailable.get() ? {} : this.cpnyFplnRequest()
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
                mandatory={Subject.create(true)}
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
                mandatory={Subject.create(true)}
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
                    await this.props.fmcService.master?.flightPlanService.setAlternate(v);
                    this.props.fmcService.master?.acInterface.updateOansAirports();
                  }
                }}
                mandatory={Subject.create(true)}
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
                mandatory={Subject.create(false)}
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
                  v ? this.props.fmcService.master?.acInterface.setCruiseFl(v) : false
                }
                mandatory={Subject.create(true)}
                disabled={this.altnDisabled}
                canBeCleared={Subject.create(false)}
                value={this.crzFl}
                containerStyle="margin-right: 25px;"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <div class="mfd-label init-input-field" style="width: auto;">
                CRZ TEMP
              </div>
              <InputField<number>
                dataEntryFormat={new CrzTempFormat()}
                dataHandlerDuringValidation={async (v) => {
                  this.props.fmcService.master?.fmgc.data.cruiseTemperaturePilotEntry.set(v);
                }}
                mandatory={Subject.create(false)}
                enteredByPilot={this.props.fmcService.master.fmgc.data.cruiseTemperatureIsPilotEntered}
                disabled={this.crzFl.map((it) => it === null)}
                value={this.props.fmcService.master.fmgc.data.cruiseTemperature}
                containerStyle="width: 110px; justify-content: flex-end;"
                alignText="center"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>

            <div class="mfd-fms-init-line" style="margin-top: 10px;">
              <div class="mfd-label init-input-field">CI</div>
              <InputField<number>
                dataEntryFormat={new CostIndexFormat()}
                dataHandlerDuringValidation={async (v) => {
                  this.loadedFlightPlan?.setPerformanceData('costIndex', v);
                }}
                mandatory={Subject.create(true)}
                disabled={this.costIndexDisabled}
                value={this.costIndex}
                containerStyle="width: 70px; margin-right: 90px; justify-content: center;"
                alignText="center"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <div class="mfd-label init-input-field" style="width: auto;">
                TROPO
              </div>
              <InputField<number>
                dataEntryFormat={new TropoFormat()}
                dataHandlerDuringValidation={async (v) =>
                  this.props.fmcService.master?.fmgc.data.tropopausePilotEntry.set(v)
                }
                mandatory={Subject.create(false)}
                enteredByPilot={this.props.fmcService.master.fmgc.data.tropopauseIsPilotEntered}
                value={this.props.fmcService.master.fmgc.data.tropopause}
                onModified={() => {}}
                alignText="flex-end"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
            <div class="mfd-fms-init-line trip-wind">
              <div class="mfd-label init-input-field" style="margin-top: 90px;">
                TRIP WIND
              </div>
              <InputField<number>
                dataEntryFormat={new TripWindFormat()}
                mandatory={Subject.create(false)}
                disabled={this.tripWindDisabled} // TODO
                value={this.props.fmcService.master.fmgc.data.tripWind}
                containerStyle="width: 125px; margin-right: 80px; margin-top: 90px;"
                alignText="center"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
              <Button
                disabled={Subject.create(true)}
                label="WIND"
                onClick={() => console.log('WIND')}
                buttonStyle="margin-right: 10px; margin-top: 90px;"
              />
              <div style="flex-grow: 1" />
              <Button
                disabled={Subject.create(true)}
                label="CPNY WIND<br />REQUEST"
                onClick={() => console.log('CPNY WIND REQUEST')}
                buttonStyle="margin-right: 10px; justify-self: flex-end; width: 175px;"
              />
            </div>
            <Button
              label="IRS"
              onClick={() => this.props.mfd.uiService.navigateTo('fms/position/irs')}
              buttonStyle="width: 160px; margin-left: 150px; margin-bottom: 10px;"
            />
            <div
              style={`display: ${this.props.mfd.uiService.activeUri.get().category === 'active' ? 'flex' : 'none'}; flex-direction: row;`}
            >
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
              onClick={() => this.props.mfd.uiService.navigateTo('fms/position/navaids')}
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
            {/* end page content */}
          </div>
          <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
        </>
      )
    );
  }
}
