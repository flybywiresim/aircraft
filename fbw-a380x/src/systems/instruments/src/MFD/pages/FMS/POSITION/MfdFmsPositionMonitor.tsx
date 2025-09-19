import { ClockEvents, FSComponent, SimVarValueType, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { FmsPage } from '../../common/FmsPage';
import { Arinc429Register, coordinateToString, Fix, RegisteredSimVar } from '@flybywiresim/fbw-sdk';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Footer } from '../../common/Footer';
import { FixFormat, RnpFormat } from '../../common/DataEntryFormats';
import './MfdFmsPositionMonitor.scss';
import { distanceTo } from 'msfs-geo';
import { WaypointEntryUtils } from '@fmgc/flightplanning/WaypointEntryUtils';
import { FmsError, FmsErrorType } from '@fmgc/FmsError';
import {
  getEtaFromUtcOrPresent,
  noPositionAvailableText,
  showReturnButtonUriExtra,
} from 'instruments/src/MFD/shared/utils';
import { Button } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/Button';
import { InputField } from 'instruments/src/MsfsAvionicsCommon/UiWidgets/InputField';
import { A32NX_Util } from '@shared/A32NX_Util';

interface MfdFmsPositionMonitorPageProps extends AbstractMfdPageProps {}

export class MfdFmsPositionMonitor extends FmsPage<MfdFmsPositionMonitorPageProps> {
  static readonly noIrsPositionDeviationAvailText = '--.-';

  private readonly fmsRnp = Subject.create<number | null>(null);

  private readonly rnpEnteredByPilot = Subject.create(false);

  private readonly fmsAccuracyHigh = Subject.create(false);

  private readonly fmsEpe = Subject.create(Infinity);

  private readonly fmsEpeDisplay = this.fmsEpe.map((v) => (v === Infinity ? '-.--' : v.toFixed(2)).padEnd(5, '\xa0'));

  private readonly fmsEPeUnitVisibility = this.fmsEpe.map((v) => (v === Infinity ? 'hidden' : 'visible'));

  private readonly fmsAccuracy = this.fmsAccuracyHigh.map((v) => (v ? 'HIGH' : 'LOW'));

  private readonly ir1LatitudeRegister = Arinc429Register.empty();

  private readonly ir1LatitudeSimVar = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_IR_1_LATITUDE',
    SimVarValueType.Enum,
  );

  private readonly ir1LongitudeRegister = Arinc429Register.empty();

  private readonly ir1LongitudeSimVar = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_IR_1_LONGITUDE',
    SimVarValueType.Enum,
  );

  private readonly ir1Coordinates: Coordinates = { lat: 0, long: 0 };

  private readonly ir1Position = Subject.create(noPositionAvailableText);

  private readonly ir1PositionDeviation = Subject.create(MfdFmsPositionMonitor.noIrsPositionDeviationAvailText);

  private readonly ir1PositionDeviationUnitVisibility = this.ir1PositionDeviation.map((v) =>
    v === MfdFmsPositionMonitor.noIrsPositionDeviationAvailText ? 'hidden' : 'visible',
  );

  private readonly ir2LatitudeRegister = Arinc429Register.empty();

  private readonly ir2LatitudeSimVar = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_IR_2_LATITUDE',
    SimVarValueType.Enum,
  );

  private readonly ir2LongitudeRegister = Arinc429Register.empty();

  private readonly ir2LongitudeSimVar = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_IR_2_LONGITUDE',
    SimVarValueType.Enum,
  );

  private readonly ir2Coordinates: Coordinates = { lat: 0, long: 0 };

  private readonly ir2Position = Subject.create(noPositionAvailableText);

  private readonly ir2PositionDeviation = Subject.create(MfdFmsPositionMonitor.noIrsPositionDeviationAvailText);

  private readonly ir2PositionDeviationUnitVisibility = this.ir2PositionDeviation.map((v) =>
    v === MfdFmsPositionMonitor.noIrsPositionDeviationAvailText ? 'hidden' : 'visible',
  );

  private readonly ir3LatitudeRegister = Arinc429Register.empty();

  private readonly ir3LatitudeSimVar = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_IR_3_LATITUDE',
    SimVarValueType.Enum,
  );

  private readonly ir3LongitudeRegister = Arinc429Register.empty();

  private readonly ir3LongitudeSimVar = RegisteredSimVar.create<number>(
    'L:A32NX_ADIRS_IR_3_LONGITUDE',
    SimVarValueType.Enum,
  );

  private readonly ir3Coordinates: Coordinates = { lat: 0, long: 0 };

  private readonly ir3Position = Subject.create(noPositionAvailableText);

  private readonly ir3PositionDeviation = Subject.create(MfdFmsPositionMonitor.noIrsPositionDeviationAvailText);

  private readonly ir3PositionDeviationUnitVisibility = this.ir3PositionDeviation.map((v) =>
    v === MfdFmsPositionMonitor.noIrsPositionDeviationAvailText ? 'hidden' : 'visible',
  );

  private readonly position1 = Subject.create(noPositionAvailableText);

  private readonly position2 = this.position1; // TODO implement when more than 1 FMS

  private readonly radioPosition = Subject.create(noPositionAvailableText); // TODO implement when radio position is available from FMS

  private readonly positionFrozen = Subject.create(false);

  private readonly navPrimaryLost = Subject.create(false);

  private readonly navPrimaryText = this.navPrimaryLost.map((v) => (v ? 'NAV PRIMARY LOST' : 'NAV PRIMARY'));

  private readonly navPrimaryClass = this.navPrimaryLost.map(
    (v) => `mfd-value ${v ? 'amber' : ''} bigger mfd-spacing-right`,
  );

  private readonly accuracyClass = this.fmsAccuracyHigh.map(
    (v) => `mfd-value ${v ? '' : 'amber'} bigger mfd-spacing-right`,
  );

  private readonly accuracyVisibility = this.navPrimaryLost.map((v) => (v ? 'visible' : 'hidden'));

  private readonly positionFrozenLabel = this.positionFrozen.map((v) => (v ? 'UNFREEZE' : 'FREEZE'));

  private readonly positionFrozenText = this.positionFrozen.map((v) => (v ? 'POSITION FROZEN' : ''));

  private readonly positionFrozenAt = this.positionFrozen.map((v) => (v ? 'POS DATA FROZEN' : ''));

  private readonly positionFrozenTime = this.positionFrozen.map((v) =>
    v ? 'AT ' + getEtaFromUtcOrPresent(0, false) : '',
  );

  private readonly gnssCoordinates: Coordinates = { lat: 0, long: 0 };

  private readonly gnss1PositionText = Subject.create(noPositionAvailableText);

  private readonly gnss2PositionText = this.gnss1PositionText; // TODO implement when GNSS2 is added

  private readonly onSidePositionLabel = Subject.create(this.props.mfd.uiService.captOrFo === 'CAPT' ? 'POS1' : 'POS2');

  private readonly monitorWaypoint =
    this.props.fmcService.master?.fmgc.data.positionMonitorFix ?? Subject.create<Fix | null>(null);

  // TODO implement when FM position
  private readonly position1Mode = Subject.create('');
  private readonly position2Mode = Subject.create('');

  private readonly bearingToWaypoint = Subject.create<number | null>(null);

  private readonly distanceToWaypoint = Subject.create<number | null>(null);

  private readonly bearingToWaypointDisplay = this.bearingToWaypoint.map((v) =>
    v ? v.toFixed(0).padStart(3, '0') : '---',
  );

  private readonly distanceToWaypointDisplay = this.distanceToWaypoint.map((v) =>
    v ? v.toFixed(v > 9999 ? 0 : 1).padStart(6, '\xa0') : '----.-',
  );

  private readonly bearingUnit = this.bearingToWaypoint.map((v) => (v ? '°\xa0\xa0' : '\xa0\xa0\xa0'));

  private readonly distanceToWaypointUnit = this.bearingToWaypoint.map((v) => (v ? 'NM' : '\xa0\xa0'));

  private readonly waypointEntered = this.monitorWaypoint.map((v) => v !== null);

  private readonly positionSensorsVisible = Subject.create(false);

  private readonly positionSensorsVisibility = this.positionSensorsVisible.map(
    (v) => 'visibility:' + (v ? 'visible' : 'hidden'),
  );

  private readonly positionSensorsButtonLabel = this.positionSensorsVisible.map((v) => (v ? 'HIDE' : 'DISPLAY'));

  private sensorsDisplayedByPilot = false;

  private readonly irDeviationIdentifierVisible = this.positionSensorsVisible.map(
    (v) => 'visibility:' + (v ? 'hidden' : 'visible'),
  );

  private positionUpdateRequiredDueToFreeze = false;

  private readonly gpsDeselected = Subject.create(true);

  private readonly gpsDeselectedVisibility = this.gpsDeselected.map((v) => (v ? 'visible' : 'hidden'));

  private readonly returnButtonVisible = this.props.mfd.uiService.activeUri.get().extra === showReturnButtonUriExtra;

  private readonly irsMixCoordinates: Coordinates = { lat: 0, long: 0 };

  private readonly mixIrsPositionText = Subject.create(noPositionAvailableText);

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getSubscriber<ClockEvents>();
    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(2)
        .handle((_t) => {
          this.onNewData();
        }),
      this.waypointEntered,
      this.positionFrozenLabel,
      this.fmsAccuracy,
      this.fmsEpeDisplay,
      this.bearingToWaypointDisplay,
      this.distanceToWaypointDisplay,
      this.bearingUnit,
      this.distanceToWaypointUnit,
      this.positionFrozenText,
      this.positionFrozenAt,
      this.positionFrozenTime,
      this.navPrimaryClass,
      this.accuracyClass,
      this.navPrimaryText,
      this.accuracyVisibility,
      this.fmsEPeUnitVisibility,
      this.irDeviationIdentifierVisible,
      this.ir1PositionDeviationUnitVisibility,
      this.ir2PositionDeviationUnitVisibility,
      this.ir3PositionDeviationUnitVisibility,
      this.positionSensorsButtonLabel,
      this.positionSensorsVisibility,
      this.gpsDeselectedVisibility,
    );
  }

  protected onNewData(): void {
    if (!this.props.fmcService.master) {
      return;
    }

    const navigation = this.props.fmcService.master.navigation;
    const rnp = navigation.getActiveRnp();

    this.navPrimaryLost.set(!navigation.getGpsPrimary());
    this.fmsAccuracyHigh.set(navigation.isAccuracyHigh());
    this.fmsEpe.set(navigation.getEpe());
    this.fmsRnp.set(rnp ?? null);
    this.rnpEnteredByPilot.set(navigation.isPilotRnp());
    const fmCoordinates = this.props.fmcService.master.navigation.getPpos();
    const fmPositionAvailable = fmCoordinates != null;
    const updatePositionSensors =
      this.positionUpdateRequiredDueToFreeze || (this.positionSensorsVisible.get() && !this.positionFrozen.get());

    this.position1.set(fmPositionAvailable ? coordinateToString(fmCoordinates, false) : noPositionAvailableText);

    this.fillIrData(
      1,
      this.ir1LatitudeRegister,
      this.ir1LongitudeRegister,
      this.ir1Coordinates,
      fmCoordinates,
      this.ir1Position,
      this.ir1PositionDeviation,
      updatePositionSensors,
    );
    this.fillIrData(
      2,
      this.ir2LatitudeRegister,
      this.ir2LongitudeRegister,
      this.ir2Coordinates,
      fmCoordinates,
      this.ir2Position,
      this.ir2PositionDeviation,
      updatePositionSensors,
    );
    this.fillIrData(
      3,
      this.ir3LatitudeRegister,
      this.ir3LongitudeRegister,
      this.ir3Coordinates,
      fmCoordinates,
      this.ir3Position,
      this.ir3PositionDeviation,
      updatePositionSensors,
    );

    if (updatePositionSensors) {
      // TODO replace with MMR signals once implemented
      this.gnssCoordinates.lat = SimVar.GetSimVarValue('GPS POSITION LAT', 'degree latitude');
      this.gnssCoordinates.long = SimVar.GetSimVarValue('GPS POSITION LON', 'degree longitude');
      this.gnss1PositionText.set(coordinateToString(this.gnssCoordinates, false));

      let mixLatitude = 0;
      let mixLongitude = 0;
      let availableIrs = 0;
      if (!this.ir1LatitudeRegister.isInvalid() && !this.ir1LongitudeRegister.isInvalid()) {
        mixLatitude += this.ir1LatitudeRegister.value;
        mixLongitude += this.ir1LongitudeRegister.value;
        availableIrs += 1;
      }
      if (!this.ir2LatitudeRegister.isInvalid() && !this.ir2LongitudeRegister.isInvalid()) {
        mixLatitude += this.ir2LatitudeRegister.value;
        mixLongitude += this.ir2LongitudeRegister.value;
        availableIrs += 1;
      }
      if (!this.ir3LatitudeRegister.isInvalid() && !this.ir3LongitudeRegister.isInvalid()) {
        mixLatitude += this.ir3LatitudeRegister.value;
        mixLongitude += this.ir3LongitudeRegister.value;
        availableIrs += 1;
      }

      if (availableIrs > 0) {
        this.irsMixCoordinates.lat = mixLatitude / availableIrs;
        this.irsMixCoordinates.long = mixLongitude / availableIrs;
        this.mixIrsPositionText.set(coordinateToString(this.irsMixCoordinates, false));
      } else {
        this.mixIrsPositionText.set(noPositionAvailableText);
      }
    }

    const waypoint = this.monitorWaypoint.get();
    if (waypoint && fmCoordinates) {
      const distanceToWaypointNm = distanceTo(fmCoordinates, waypoint.location);
      this.distanceToWaypoint.set(distanceToWaypointNm);
      this.bearingToWaypoint.set(
        A32NX_Util.trueToMagnetic(Avionics.Utils.computeGreatCircleHeading(fmCoordinates, waypoint.location)),
      );
    } else {
      this.distanceToWaypoint.set(null);
      this.bearingToWaypoint.set(null);
    }

    this.positionUpdateRequiredDueToFreeze = false;
  }

  private fillIrData(
    irIndex: 1 | 2 | 3,
    latitude: Arinc429Register,
    longitude: Arinc429Register,
    coordinates: Coordinates,
    fmPosition: Coordinates | null,
    irPosition: Subject<string>,
    irFmPositionDeviation: Subject<string>,
    updatePosition?: boolean,
  ): void {
    latitude.set(
      irIndex === 1
        ? this.ir1LatitudeSimVar.get()
        : irIndex === 2
          ? this.ir2LatitudeSimVar.get()
          : this.ir3LatitudeSimVar.get(),
    );
    longitude.set(
      irIndex === 1
        ? this.ir1LongitudeSimVar.get()
        : irIndex === 2
          ? this.ir2LongitudeSimVar.get()
          : this.ir3LongitudeSimVar.get(),
    );
    if (latitude.isInvalid() || longitude.isInvalid()) {
      irPosition.set(noPositionAvailableText);
      irFmPositionDeviation.set(MfdFmsPositionMonitor.noIrsPositionDeviationAvailText);
      return;
    }
    coordinates.lat = latitude.value;
    coordinates.long = longitude.value;

    if (updatePosition) {
      irPosition.set(coordinateToString(coordinates, false));
    }

    if (fmPosition) {
      irFmPositionDeviation.set(distanceTo(coordinates, fmPosition).toFixed(1));
    } else {
      irFmPositionDeviation.set(MfdFmsPositionMonitor.noIrsPositionDeviationAvailText);
    }
  }

  private toggleSensorsVisibility() {
    this.positionSensorsVisible.set(!this.positionSensorsVisible.get());
    this.sensorsDisplayedByPilot = this.positionSensorsVisible.get();
    if (!this.sensorsDisplayedByPilot) {
      this.positionFrozen.set(false);
    }
  }

  private togglePositionFrozen(): void {
    this.positionFrozen.set(!this.positionFrozen.get());
    // Automatically toggle position sensors visibility when freezing position
    if (this.positionFrozen.get()) {
      const sensorsVisible = this.positionSensorsVisible.get();
      if (!sensorsVisible) {
        this.positionSensorsVisible.set(true);
        this.positionUpdateRequiredDueToFreeze = true;
      }
    } else {
      // Only hide position sensors if the pilot didn't explicitly request them to be shown before the position was frozen
      if (!this.sensorsDisplayedByPilot) {
        this.positionSensorsVisible.set(false);
      }
    }
  }

  render(): VNode {
    return (
      <>
        {/* TODO (top to bottom):
        Check SHOW POS DATA/FREEZE POSITION X & Y labels
        Frozen position data location.
        Bottom area
        */}
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <div class="mfd-pos-top-row">
            <div class="mfd-label-value-container" style={'margin-top:13px'}>
              <span class={this.navPrimaryClass}>{this.navPrimaryText}</span>
            </div>
            <div class="rnp-container">
              <div class="mfd-label-value-container">
                <span class="mfd-label bigger mfd-spacing-right">RNP</span>
                <InputField<number>
                  dataEntryFormat={new RnpFormat()}
                  value={this.fmsRnp}
                  onModified={(v) => this.props.fmcService.master?.navigation.setPilotRnp(v)}
                  enteredByPilot={this.rnpEnteredByPilot}
                  canBeCleared={Subject.create(true)}
                  containerStyle="width: 155px;"
                  alignText="center"
                  errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                  hEventConsumer={this.props.mfd.hEventConsumer}
                  interactionMode={this.props.mfd.interactionMode}
                  bigUnit={true}
                />
              </div>
            </div>
          </div>
          <div class="mfd-pos-top-row">
            <div class="mfd-label-value-container" style={{ visibility: this.accuracyVisibility }}>
              <span class="mfd-label bigger mfd-spacing-right">ACCURACY</span>
              <span class={this.accuracyClass}>{this.fmsAccuracy}</span>
            </div>
            <div class="mfd-label-value-container" style={'margin-right:95px'}>
              <span class="mfd-label bigger mfd-spacing" style="margin-right: 37px;">
                EPU
              </span>
              <span class="mfd-value bigger">{this.fmsEpeDisplay}</span>
              <span class="mfd-label-unit bigger mfd-unit-trailing" style={{ visibility: this.fmsEPeUnitVisibility }}>
                NM
              </span>
            </div>
          </div>

          <div class="mfd-pos-monitor-fm-pos-line" style={'margin-bottom: 14.5px;'}>
            <div class="mfd-label-value-container">
              <span class="mfd-label bigger mfd-spacing-right">&nbsp;POS1</span>
              <span class="mfd-value bigger mfd-spacing-right">{this.position1}</span>
            </div>
            <div class="mfd-label-value-container">
              <span class="mfd-value bigger">{this.position1Mode}</span>
            </div>
          </div>

          <div class="mfd-pos-monitor-fm-pos-line" style={' margin-bottom: 3px;'}>
            <div class="mfd-label-value-container">
              <span class="mfd-label bigger mfd-spacing-right">&nbsp;POS2</span>
              <span class="mfd-value bigger mfd-spacing-right">{this.position2}</span>
            </div>
            <div class="mfd-label-value-container">
              <span class="mfd-value bigger">{this.position2Mode}</span>
            </div>
          </div>

          <div class="mfd-pos-monitor-line big"> </div>

          <div class="fr">
            <div style={this.positionSensorsVisibility}>
              <div class="mfd-label-value-container pos-monitor-table-lateral-spacing pos-monitor-table-vertical-spacing">
                <span class="mfd-label bigger mfd-spacing-right">GNSS1</span>
                <span class="mfd-value bigger" style={'position: relative; top:5px;'}>
                  {this.gnss1PositionText}
                </span>
              </div>
              <div class="mfd-label-value-container pos-monitor-table-lateral-spacing" style={'padding-bottom:5px;'}>
                <span class="mfd-label bigger mfd-spacing-right">GNSS2</span>
                <span class="mfd-value bigger">{this.gnss2PositionText}</span>
              </div>

              <div class="mfd-pos-monitor-line short"></div>

              <div class="mfd-label-value-container pos-monitor-table-lateral-spacing pos-monitor-table-vertical-spacing">
                <span class="mfd-label bigger mfd-spacing-right">&nbsp;IRS1</span>
                <span class="mfd-value bigger">{this.ir1Position}</span>
              </div>

              <div class="mfd-label-value-container pos-monitor-table-lateral-spacing pos-monitor-table-vertical-spacing">
                <span class="mfd-label bigger mfd-spacing-right">&nbsp;IRS2</span>
                <span class="mfd-value bigger">{this.ir2Position}</span>
              </div>

              <div class="mfd-label-value-container pos-monitor-table-lateral-spacing" style={'padding-bottom:10px;'}>
                <span class="mfd-label bigger mfd-spacing-right">&nbsp;IRS3</span>
                <span class="mfd-value bigger">{this.ir3Position}</span>
              </div>

              <div class="mfd-pos-monitor-line short"> </div>

              <div class="mfd-label-value-container pos-monitor-table-lateral-spacing" style={'padding-bottom:10px'}>
                <span class="mfd-label bigger mfd-spacing-right">RADIO</span>
                <span class="mfd-value bigger">{this.radioPosition}</span>
              </div>

              <div class="mfd-label-value-container" style={'padding-left:3px'}>
                <span class="mfd-label bigger mfd-spacing-right">MIXIRS</span>
                <span class="mfd-value bigger">{this.mixIrsPositionText}</span>
              </div>
            </div>
            <div>
              <div class="mfd-pos-monitor-deviation-container">
                <span class="mfd-value bigger amber" style={{ visibility: this.gpsDeselectedVisibility }}>
                  GPS DESELECTED
                </span>
                <div class="fc" style="align-items: flex-end; margin-bottom: 10px; margin-top:17px; margin-right:7px">
                  <span class="mfd-label bigger">DEVIATION FROM {this.onSidePositionLabel}</span>
                </div>

                <div class="mfd-pos-monitor-irs-deviation-line">
                  <span
                    class="mfd-label bigger mfd-pos-monitor-irs-deviation-title"
                    style={this.irDeviationIdentifierVisible}
                  >
                    IRS1
                  </span>
                  <span class="mfd-value bigger">{this.ir1PositionDeviation}</span>
                  <span
                    class="mfd-label-unit bigger mfd-unit-trailing"
                    style={{ visibility: this.ir1PositionDeviationUnitVisibility }}
                  >
                    NM
                  </span>
                </div>

                <div class="mfd-pos-monitor-irs-deviation-line">
                  <span
                    class="mfd-label bigger mfd-pos-monitor-irs-deviation-title"
                    style={this.irDeviationIdentifierVisible}
                  >
                    IRS2
                  </span>
                  <span class="mfd-value bigger">{this.ir2PositionDeviation}</span>
                  <span
                    class="mfd-label-unit bigger mfd-unit-trailing"
                    style={{ visibility: this.ir2PositionDeviationUnitVisibility }}
                  >
                    NM
                  </span>
                </div>

                <div class="mfd-pos-monitor-irs-deviation-line">
                  <span
                    class="mfd-label bigger mfd-pos-monitor-irs-deviation-title"
                    style={this.irDeviationIdentifierVisible}
                  >
                    IRS3
                  </span>
                  <span class="mfd-value bigger">{this.ir3PositionDeviation}</span>
                  <span
                    class="mfd-label-unit bigger mfd-unit-trailing"
                    style={{ visibility: this.ir3PositionDeviationUnitVisibility }}
                  >
                    NM
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="fc">
            <div class="mfd-pos-monitor-frozen-pos-time-container">
              <span class="mfd-label bigger">{this.positionFrozenAt}</span>
              <span class="mfd-label bigger">{this.positionFrozenTime}</span>
            </div>

            <div class="fr space-between" style={'margin-bottom: 19px;'}>
              <Button
                label={Subject.create(
                  <div style="display: flex; flex-direction: row; justify-content: space-between;">
                    <span style="text-align: center; vertical-align: center; margin-right: 13px;">
                      {this.positionSensorsButtonLabel}
                      <br />
                      POS SENSORS
                    </span>
                  </div>,
                )}
                onClick={() => this.toggleSensorsVisibility()}
                selected={this.positionSensorsVisible}
                buttonStyle="width: 219px; margin-left: 95px; height:62px;"
              />

              <Button
                label={Subject.create(
                  <div style="display: flex; flex-direction: row; justify-content: space-between;">
                    <span style="text-align: center; vertical-align: center; margin-right: 10px;">
                      {this.positionFrozenLabel}
                      <br />
                      POS DATA
                    </span>
                    <span style="display: flex; align-items: center; justify-content: center;">*</span>
                  </div>,
                )}
                onClick={() => this.togglePositionFrozen()}
                selected={this.positionFrozen}
                buttonStyle="width: 231px; margin-right:41px; height:60px"
              />
            </div>
          </div>

          <div class="mfd-pos-monitor-line big"></div>

          <div class="fr space-between">
            <Button
              label="POSITION <br /> UPDATE"
              disabled={Subject.create(true)}
              onClick={() => {}}
              buttonStyle="width: 138px; height:59px; margin-top:18px;"
            />
            <div>
              <div class="mfd-label-value-container" style={'margin-right:20px; justify-content:flex-end;'}>
                <span class="mfd-label bigger mfd-spacing-right">BRG / DIST TO</span>
                <InputField<Fix, string, false>
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
              <div class="fr" style={'width: 430px;'}>
                <span class="mfd-value bigger">{this.bearingToWaypointDisplay}</span>
                <span class="mfd-label-unit bigger mfd-unit-trailing">{this.bearingUnit}</span>
                <span class="mfd-value bigger" style={'margin-left:10px'}>
                  /{this.distanceToWaypointDisplay}
                </span>
                <span class="mfd-label-unit bigger mfd-unit-trailing">{this.distanceToWaypointUnit}</span>
              </div>
            </div>
          </div>

          <div class="mfd-pos-monitor-line big" style={'margin-top:34px;'}></div>

          <div style="flex-grow: 1;" />
          {/* fill space vertically */}
          <div class="fr space-between">
            <Button
              label="RETURN"
              onClick={() => this.props.mfd.uiService.navigateTo('back')}
              buttonStyle="margin-right: 5px; width:150px;"
              visible={this.returnButtonVisible}
            />
            <div class="fr">
              <Button
                label="NAVAIDS"
                onClick={() => this.props.mfd.uiService.navigateTo('fms/position/navaids')}
                buttonStyle="margin-right: 5px; width:149px; height:43px;"
              />
              <Button
                label="GNSS"
                disabled={Subject.create(true)}
                onClick={() => this.props.mfd.uiService.navigateTo('fms/position/gnss')}
                buttonStyle="margin-right: 5px; width:133px; height:43px;"
              />
              <Button
                label="IRS"
                onClick={() => this.props.mfd.uiService.navigateTo('fms/position/irs')}
                buttonStyle="margin-right: 5px; width:136px; height:43px;"
              />
            </div>
          </div>
          <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />
        </div>
      </>
    );
  }
}
