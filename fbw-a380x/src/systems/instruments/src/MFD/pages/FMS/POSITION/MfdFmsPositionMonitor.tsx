/* eslint-disable prettier/prettier */
import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { FmsPage } from '../../common/FmsPage';
import { Arinc429Register, coordinateToString, Fix } from '@flybywiresim/fbw-sdk';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Footer } from '../../common/Footer';
import { FixFormat, RnpFormat } from '../../common/DataEntryFormats';
import './MfdFmsPositionMonitor.scss';
import { distanceTo } from 'msfs-geo';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { FmsError, FmsErrorType } from '@fmgc/FmsError';
import { getEtaFromUtcOrPresent } from 'instruments/src/MFD/shared/utils';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { A32NX_Util } from '@shared/A32NX_Util';

interface MfdFmsPositionMonitorPageProps extends AbstractMfdPageProps {}

export class MfdFmsPositionMonitor extends FmsPage<MfdFmsPositionMonitorPageProps> {
  private readonly cptSide = Subject.create(false);

  private readonly fmsRnp = Subject.create<number | null>(null);

  private readonly rnpEnteredByPilot = Subject.create(false);

  private readonly fmsEpu = Subject.create('-.--');

  private readonly fmsAccuracy = Subject.create('');

  private readonly ir1LatitudeRegister = Arinc429Register.empty();

  private readonly ir1LongitudeRegister = Arinc429Register.empty();

  private readonly ir1Coordinates: Coordinates = { lat: 0, long: 0 };

  private readonly ir1Position = Subject.create('');

  private readonly ir1PositionDeviation = Subject.create('');

  private readonly ir2LatitudeRegister = Arinc429Register.empty();

  private readonly ir2LongitudeRegister = Arinc429Register.empty();

  private readonly ir2Coordinates: Coordinates = { lat: 0, long: 0 };

  private readonly ir2Position = Subject.create('');

  private readonly ir2PositionDeviation = Subject.create('');

  private readonly ir3LatitudeRegister = Arinc429Register.empty();

  private readonly ir3LongitudeRegister = Arinc429Register.empty();

  private readonly ir3Coordinates: Coordinates = { lat: 0, long: 0 };

  private readonly ir3Position = Subject.create('');

  private readonly ir3PositionDeviation = Subject.create('');

  private readonly fmPosition = Subject.create('');

  private readonly noPositionImplemented = Subject.create('--°--.--/---°--.--'); // TODO remove & replace with RADIO, MIX IRS & GPIRS position once implemented

  private readonly onSideFms = Subject.create('');

  private readonly offSideFms = Subject.create('');

  private readonly positionFrozen = Subject.create(false);

  private readonly positionFrozenLabel = this.positionFrozen.map((v) => (v ? 'UNFREEZE' : 'FREEZE'));

  private readonly positionFrozenText = Subject.create('');

  private readonly positionFrozenTimeText = Subject.create('');

  private readonly gpsCoordinates: Coordinates = { lat: 0, long: 0 };

  private readonly gpsPositionText = Subject.create('');

  private monitorWaypoint = Subject.create<Fix | null>(null);

  private readonly bearingToWaypoint = Subject.create('');

  private readonly distanceToWaypoint = Subject.create('');

  private readonly waypointEntered = this.monitorWaypoint.map((v) => v !== null);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    const side = this.props.mfd.uiService.captOrFo;

    const cptSide = side === 'CAPT';
    this.cptSide.set(cptSide);
    this.onSideFms.set(cptSide ? 'FMS1' : 'FMS2');
    this.offSideFms.set(cptSide ? 'FMS2' : 'FMS1');
    const sub = this.props.bus.getSubscriber<ClockEvents>();

    if (this.props.fmcService.master) {
      this.monitorWaypoint = cptSide
        ? this.props.fmcService.master.fmgc.data.positionMonitorFixLeft
        : this.props.fmcService.master.fmgc.data.positionMonitorFixRight;
    }
    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(1)
        .handle((_t) => {
          this.onNewData();
        }),
      this.waypointEntered,
      this.positionFrozenLabel,
    );
  }

  protected onNewData(): void {
    if (!this.props.fmcService.master) {
      return;
    }

    const navigation = this.props.fmcService.master.navigation;
    const rnp = navigation.getActiveRnp();
    this.fmsAccuracy.set(navigation.isAcurracyHigh() ? 'HIGH' : 'LO');
    this.fmsEpu.set(navigation.getEpe() != Infinity ? navigation.getEpe().toFixed(2) : '--.-');
    this.fmsRnp.set(rnp ?? null);
    this.rnpEnteredByPilot.set(navigation.isPilotRnp());
    const fmCoordinates = this.props.fmcService.master.navigation.getPpos();
    const fmPositionAvailable = fmCoordinates != null;
    if (!this.positionFrozen.get()) {
      this.fmPosition.set(
        fmPositionAvailable
          ? coordinateToString(this.props.fmcService.master.navigation.getPpos()!, false)
          : '--°--.--/---°--.--',
      );
      this.fillIrData(
        1,
        this.ir1LatitudeRegister,
        this.ir1LongitudeRegister,
        this.ir1Coordinates,
        fmCoordinates,
        this.ir1Position,
        this.ir1PositionDeviation,
      );
      this.fillIrData(
        2,
        this.ir2LatitudeRegister,
        this.ir2LongitudeRegister,
        this.ir2Coordinates,
        fmCoordinates,
        this.ir2Position,
        this.ir2PositionDeviation,
      );
      this.fillIrData(
        3,
        this.ir3LatitudeRegister,
        this.ir3LongitudeRegister,
        this.ir3Coordinates,
        fmCoordinates,
        this.ir3Position,
        this.ir3PositionDeviation,
      );

      // TODO replace with MMR signals once implemented
      this.gpsCoordinates.lat = SimVar.GetSimVarValue('GPS POSITION LAT', 'degree latitude');
      this.gpsCoordinates.long = SimVar.GetSimVarValue('GPS POSITION LON', 'degree longitude');
      this.gpsPositionText.set(coordinateToString(this.gpsCoordinates, false));
    }

    if (this.monitorWaypoint.get() && fmCoordinates) {
      const distanceToWaypointNm = distanceTo(fmCoordinates, this.monitorWaypoint.get()!.location);
      const distDigits = distanceToWaypointNm > 9999 ? 0 : 1;
      this.distanceToWaypoint.set(distanceToWaypointNm.toFixed(distDigits).padStart(6));
      this.bearingToWaypoint.set(
        A32NX_Util.trueToMagnetic(
          Avionics.Utils.computeGreatCircleHeading(fmCoordinates, this.monitorWaypoint.get()!.location),
        )
          .toFixed(0)
          .padStart(3, '0'),
      );
    } else {
      this.distanceToWaypoint.set('----.-');
      this.bearingToWaypoint.set('---');
    }
  }

  private fillIrData(
    irIndex: number,
    latitude: Arinc429Register,
    longitude: Arinc429Register,
    coordinates: Coordinates,
    fmPosition: Coordinates | null,
    irPositionSubject: Subject<string>,
    irFmPositionDeviationSubject: Subject<string>,
  ): void {
    latitude.setFromSimVar(`L:A32NX_ADIRS_IR_${irIndex}_LATITUDE`);
    longitude.setFromSimVar(`L:A32NX_ADIRS_IR_${irIndex}_LONGITUDE`);
    if (
      !latitude.isNormalOperation() ||
      latitude.isNoComputedData() ||
      !longitude.isNormalOperation() ||
      longitude.isNoComputedData()
    ) {
      irPositionSubject.set('--°--.--/---°--.--');
      irFmPositionDeviationSubject.set('-.-');
      return;
    }
    coordinates.lat = latitude.value;
    coordinates.long = longitude.value;

    if (fmPosition) {
      irPositionSubject.set(coordinateToString(coordinates, false));
      irFmPositionDeviationSubject.set(distanceTo(coordinates, fmPosition).toFixed(1));
    }
  }

  private togglePositonFrozen() {
    const frozen = !this.positionFrozen.get();
    this.positionFrozen.set(frozen);
    if (frozen) {
      this.positionFrozenText.set('POSITION FROZEN');
      this.positionFrozenTimeText.set('  AT ' + getEtaFromUtcOrPresent(0, false));
    } else {
      this.positionFrozenText.set('');
      this.positionFrozenTimeText.set('');
    }
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <div style={'height:10px'}></div>
          <div class="mfd-pos-top-row">
            <div class="mfd-label-value-container">
              <span class="mfd-label bigger mfd-spacing-right">ACCURACY</span>
              <span class="mfd-value bigger">{this.fmsAccuracy}</span>
            </div>
            <div class="mfd-label-value-container" style={'margin-right:113px;'}>
              <span class="mfd-label bigger mfd-spacing-right" style="width: 54px;">
                EPU
              </span>
              <span class="mfd-value bigger">{this.fmsEpu}</span>
              <span class="mfd-label-unit mfd-unit-trailing">NM</span>
            </div>
          </div>
          <div class="mfd-pos-top-row">
            <div class="mfd-label-value-container">
              <span class="mfd-value bigger mfd-spacing-right">GPS PRIMARY</span>
            </div>
            <div class="mfd-label-value-container" style={'margin-right:95px'}>
              <span class="mfd-label bigger mfd-spacing-right-small">RNP</span>
              <InputField<number>
                dataEntryFormat={new RnpFormat()}
                value={this.fmsRnp}
                onModified={(v) => this.props.fmcService.master?.navigation.setPilotRnp(v)}
                enteredByPilot={this.rnpEnteredByPilot}
                canBeCleared={Subject.create(true)}
                containerStyle="width: 140px;"
                alignText="center"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
          </div>
          <div class="fc mfd-pos-monitor-table">
            <div class="fr space-between">
              <div class="mfd-label-value-container">
                <span class="mfd-label bigger mfd-spacing-right"> {this.onSideFms}</span>
                <span class="mfd-value bigger">{this.fmPosition}</span>
              </div>
            </div>
            <div class="fr" style={'justify-content: flex-end; height:9px;'}>
              <span class="mfd-label bigger">{this.positionFrozenText}</span>
            </div>
            <div class="fr space-between">
              <div class="mfd-label-value-container">
                <span class="mfd-label bigger mfd-spacing-right"> RADIO</span>
                <span class="mfd-value bigger">{this.noPositionImplemented}</span>
              </div>
            </div>
            <div class="fr space-between">
              <div class="fc">
                <div class="mfd-label-value-container">
                  <span class="mfd-label bigger mfd-spacing-right">MIXIRS</span>
                  <span class="mfd-value bigger">{this.noPositionImplemented}</span>
                </div>
                <div class="mfd-label-value-container">
                  <span class="mfd-label bigger mfd-spacing-right"> GPIRS</span>
                  <span class="mfd-value bigger">{this.noPositionImplemented}</span>
                </div>
              </div>
              <div class="fc">
                <div span class="mfd-label bigger" style={'width:195px; height:22px;'}>
                  {this.positionFrozenTimeText}
                </div>
                <Button
                  label={Subject.create(
                    <div style="display: flex; flex-direction: row; justify-content: space-between;">
                      <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                        {this.positionFrozenLabel}
                        <br />
                        POSITION
                      </span>
                      <span style="display: flex; align-items: center; justify-content: center;">*</span>
                    </div>,
                  )}
                  onClick={() => this.togglePositonFrozen()}
                  selected={this.positionFrozen}
                  buttonStyle="width: 172px; margin-right:44px"
                />
              </div>
            </div>

            <div class="mfd-pos-monitor-table-line"></div>
            <div class="mfd-label-value-container">
              <span class="mfd-label bigger mfd-spacing-right"> {this.offSideFms}</span>
              <span class="mfd-value bigger">{this.fmPosition}</span>
            </div>
            <div class="mfd-pos-monitor-table-line"></div>
            <div class="fc" style="align-items: flex-end; margin-bottom: 10px; margin-top:17px; margin-right:7px">
              <span class="mfd-label bigger">DEVIATION FROM {this.onSideFms}</span>
            </div>
            <div class="fr space-between">
              <div class="mfd-label-value-container">
                <span class="mfd-label bigger mfd-spacing-right"> IRS1</span>
                <span class="mfd-value bigger">{this.ir1Position}</span>
              </div>
              <div class="mfd-label-value-container" style={'margin-right: 100px;'}>
                <span class="mfd-value bigger">{this.ir1PositionDeviation} </span>
                <span class="mfd-label-unit mfd-unit-trailing"> NM</span>
              </div>
            </div>
            <div class="fr space-between">
              <div class="mfd-label-value-container">
                <span class="mfd-label bigger mfd-spacing-right"> IRS2</span>
                <span class="mfd-value bigger">{this.ir2Position}</span>
              </div>
              <div class="mfd-label-value-container" style={'margin-right: 100px;'}>
                <span class="mfd-value bigger">{this.ir2PositionDeviation} </span>
                <span class="mfd-label-unit mfd-unit-trailing"> NM</span>
              </div>
            </div>
            <div class="fr space-between">
              <div class="mfd-label-value-container">
                <span class="mfd-label bigger mfd-spacing-right"> IRS3</span>
                <span class="mfd-value bigger">{this.ir3Position}</span>
              </div>
              <div class="mfd-label-value-container" style={'margin-right: 100px;'}>
                <span class="mfd-value bigger">{this.ir3PositionDeviation} </span>
                <span class="mfd-label-unit mfd-unit-trailing"> NM</span>
              </div>
            </div>
            <div class="mfd-pos-monitor-table-line"></div>
            <div class="mfd-label-value-container">
              <span class="mfd-label bigger mfd-spacing-right"> GPS1</span>
              <span class="mfd-value bigger">{this.gpsPositionText}</span>
            </div>
            <div class="mfd-label-value-container">
              <span class="mfd-label bigger mfd-spacing-right"> GPS2</span>
              <span class="mfd-value bigger">{this.gpsPositionText}</span>
            </div>
          </div>
          <div class="fr space-between" style={'margin:10px 15px 15px 5px;'}>
            <Button
              label="POSITION <br /> UPDATE"
              disabled={Subject.create(true)}
              onClick={() => {}}
              buttonStyle="width: 130px;"
            />
            <div>
              <div class="mfd-label-value-container">
                <span class="mfd-label mfd-spacing-right">BRG / DIST TO</span>
                <InputField<Fix, string>
                  dataEntryFormat={new FixFormat()}
                  readonlyValue={this.monitorWaypoint}
                  onModified={async (v) => {
                    if (v) {
                      if (this.props.fmcService.master) {
                        const wpt = await WaypointEntryUtils.getOrCreateWaypoint(this.props.fmcService.master, v, true);
                        if (!wpt) {
                          throw new FmsError(FmsErrorType.NotInDatabase);
                        }
                        this.monitorWaypoint.set(wpt);
                      } else {
                        this.monitorWaypoint.set(null);
                      }
                    } else {
                      this.monitorWaypoint.set(null);
                    }
                  }}
                  enteredByPilot={this.waypointEntered}
                  canBeCleared={Subject.create(true)}
                  alignText="center"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                />
              </div>
              <div class="mfd-label-value-container">
                <span class="mfd-value">{this.bearingToWaypoint}</span>
                <span class="mfd-label-unit mfd-unit-trailing">° </span>
                <span class="mfd-value">/{this.distanceToWaypoint}</span>
                <span class="mfd-label-unit mfd-unit-trailing">NM</span>
              </div>
            </div>
          </div>
          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
          <div class="fr space-between">
            <Button
              label="RETURN" // TODO should only be visible if accessed via the PERF page
              onClick={() => this.props.mfd.uiService.navigateTo('back')}
              buttonStyle="margin-right: 5px; width:150px;"
            />
            <div class="fr">
              <Button
                label="NAVAIDS"
                onClick={() => this.props.mfd.uiService.navigateTo('fms/position/navaids')}
                buttonStyle="margin-right: 5px; width:150px;"
              />
              <Button
                label="GPS"
                disabled={Subject.create(true)}
                onClick={() => this.props.mfd.uiService.navigateTo('fms/position/gps')}
                buttonStyle="margin-right: 5px; width:150px;"
              />
              <Button
                label="IRS"
                onClick={() => this.props.mfd.uiService.navigateTo('fms/position/irs')}
                buttonStyle="margin-right: 5px; width:150px;"
              />
            </div>
          </div>
          <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
        </div>
      </>
    );
  }
}
