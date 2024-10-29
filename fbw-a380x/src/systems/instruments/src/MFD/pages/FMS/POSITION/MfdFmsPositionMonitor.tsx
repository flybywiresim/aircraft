/* eslint-disable prettier/prettier */
import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { FmsPage } from '../../common/FmsPage';
import { Arinc429Register, coordinateToString } from '@flybywiresim/fbw-sdk';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Footer } from '../../common/Footer';
import { InputField } from '../../common/InputField';
import { RnpFormat } from '../../common/DataEntryFormats';
import './MfdFmsPositionMonitor.scss';
import { distanceTo } from 'msfs-geo';
import { Button } from '../../common/Button';

interface MfdFmsPositionMonitorPageProps extends AbstractMfdPageProps {}

export class MfdFmsPositionMonitor extends FmsPage<MfdFmsPositionMonitorPageProps> {
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

  private readonly positionFrozen = Subject.create(false);

  private readonly positionFrozenLabel = this.positionFrozen.map(v => v? 'UNFREEZE POSITION *' : 'FREEZE POSITION *');

  private readonly positionFrozenText = Subject.create('');

  private readonly gpsCoordinates: Coordinates = {lat : 0, long: 0}

  private readonly gpsPositionText = Subject.create('');

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);
    const sub = this.props.bus.getSubscriber<ClockEvents>();
    this.subs.push(
      sub
        .on('realTime')
        .atFrequency(1)
        .handle((_t) => {
          this.onNewData();
        }),
    );
  }

  protected onNewData(): void {
    if (!this.props.fmcService.master) {
      return;
    }

    const navigation = this.props.fmcService.master.navigation;
    const rnp = navigation.getRnp();
    this.fmsAccuracy.set(navigation.isAcurracyHigh() ? 'HIGH' : 'LO');
    this.fmsEpu.set(navigation.getEpe() != Infinity ? navigation.getEpe().toFixed(2) : '--.-');
    this.fmsRnp.set(rnp);
    this.rnpEnteredByPilot.set(navigation.isRnpManual());

    if (!this.positionFrozen.get()) {
      const fmCoordinates = this.props.fmcService.master.navigation.getPpos();
      const fmPositionAvailable = fmCoordinates != null
      this.fmPosition.set(
        fmPositionAvailable? 
        coordinateToString(this.props.fmcService.master.navigation.getPpos()!, false) : '--°--.--/---°--.-',
      );
      this.fillIrData(1, this.ir1LatitudeRegister, this.ir1LongitudeRegister, this.ir1Coordinates, fmCoordinates, this.ir1Position, this.ir1PositionDeviation);
      this.fillIrData(2, this.ir2LatitudeRegister, this.ir2LongitudeRegister, this.ir2Coordinates, fmCoordinates, this.ir2Position, this.ir2PositionDeviation);
      this.fillIrData(3, this.ir3LatitudeRegister, this.ir3LongitudeRegister, this.ir3Coordinates, fmCoordinates, this.ir3Position, this.ir3PositionDeviation);

      // TODO replace with MMR signals once implemented
      this.gpsCoordinates.lat = SimVar.GetSimVarValue('GPS POSITION LAT', 'degree latitude');
      this.gpsCoordinates.long = SimVar.GetSimVarValue('GPS POSITION LON', 'degree longitude');
      this.gpsPositionText.set(coordinateToString(this.gpsCoordinates, false));
    }
  }

  private fillIrData(
    irIndex : number,
    latitude: Arinc429Register,
    longitude: Arinc429Register,
    coordinates: Coordinates,
    fmPosition : Coordinates | null,
    irPositionSubject : Subject<string>,
    irFmPositionDeviationSubject : Subject<string>
  ): void {

    latitude.setFromSimVar(`L:A32NX_ADIRS_IR_${irIndex}_LATITUDE`);
    longitude.setFromSimVar(`L:A32NX_ADIRS_IR_${irIndex}_LONGITUDE`)
    if (
      !latitude.isNormalOperation() ||
      latitude.isNoComputedData() ||
      !longitude.isNormalOperation() ||
      longitude.isNoComputedData()
    ) {
      irPositionSubject.set('--°--.--/---°--.-');
      irFmPositionDeviationSubject.set('-.-')
    }
    coordinates.lat = latitude.value;
    coordinates.long = longitude.value;

    if(fmPosition) {
    irPositionSubject.set(coordinateToString(coordinates, false));
     irFmPositionDeviationSubject.set(distanceTo(coordinates, fmPosition).toFixed(1))
    }
  }

  private setPositionFrozen() {
    const frozen = this.positionFrozen.get();
    this.positionFrozenText.set(frozen? "POSITION FROZEN <br /> AT " + this.getUtcFormatString() : "");
    this.positionFrozen.set(!frozen);
  }

  private getUtcFormatString() : string {
    const utcTime = SimVar.GetGlobalVarValue('ZULU TIME', 'seconds');
    const date = new Date(utcTime * 1000);
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <div class="mfd-pos-monitor-header"></div>
          <div class="mfd-pos-top-row">
            <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right">ACCURACY</span>
              <span class="mfd-value">{this.fmsAccuracy}</span>
            </div>
            <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right" style="width: 95px;">
                EPU
              </span>
              <span class="mfd-value">{this.fmsEpu}</span>
              <span class="mfd-label-unit mfd-unit-trailing">NM</span>
            </div>
          </div>
          <div class="mfd-pos-top-row">
            <div class="mfd-label-value-container">
              <span class="mfd-value mfd-spacing-right">GPS PRIMARY</span>
            </div>
            <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right">RNP</span>
              <InputField<number>
                dataEntryFormat={new RnpFormat()}
                value={this.fmsRnp}
                onModified={(v) => this.props.fmcService.master?.navigation.setRnp(v ? v : null)}
                enteredByPilot={this.rnpEnteredByPilot}
                canBeCleared={Subject.create(true)}
                alignText="flex-end"
                containerStyle="width: 170px;"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
          </div>
          <div class="fc mfd-pos-monitor-table">
          <div class="mfd-pos-space-between-row ">
          <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right">  FMS1</span>
              <span class="mfd-value">{this.fmPosition}</span>
            </div>
          </div>
          <div class="mfd-pos-space-between-row ">
          <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right"> RADIO</span>
              <span class="mfd-value">{this.fmPosition}</span>
            </div>
          </div>
          <div class="mfd-pos-space-between-row ">
          <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right">MIXIRS</span>
              <span class="mfd-value">{this.fmPosition}</span>
            </div>
            <div span class="mfd-label">{this.positionFrozenText}</div>
            </div>
            <div class="mfd-pos-space-between-row ">
            <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right"> GPIRS</span>
              <span class="mfd-value">{this.fmPosition}</span>
            </div>
            <Button
                label="FREEZE <br /> POSITION *"
                onClick={() => this.setPositionFrozen()}
                buttonStyle="width: 170px;"
              />
          </div>
          <div class="mfd-pos-monitor-table-line"></div>
          <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right">  FMS2</span>
              <span class="mfd-value">{this.fmPosition}</span>
            </div>
          <div class ="mfd-pos-monitor-table-line"></div>
          <div class="fc" style="align-items: flex-end; margin-top: 15px;">
            <span class="mfd-label">
              DEVIATION FROM FMS1
            </span>
          </div>
          <div class="mfd-pos-space-between-row ">
            <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right">  IRS1</span>
              <span class="mfd-value">{this.ir1Position}</span>
            </div>
            <div class="mfd-label-value-container" style={"margin-right: 65px;"}>
            <span class="mfd-value">{this.ir1PositionDeviation}</span>
            <span class="mfd-label-unit mfd-unit-trailing">NM</span>
            </div>
            </div>
            <div class="mfd-pos-space-between-row ">
          <div class="mfd-label-value-container">
          <span class="mfd-label mfd-spacing-right">  IRS2</span>
          <span class="mfd-value">{this.ir2Position}</span>
          </div>
          <div class="mfd-label-value-container" style={"margin-right: 65px;"}>
          <span class="mfd-value">{this.ir2PositionDeviation}</span>
          <span class="mfd-label-unit mfd-unit-trailing">NM</span>
          </div>
            </div>
            <div class="mfd-pos-space-between-row ">
          <div class="mfd-label-value-container">
          <span class="mfd-label mfd-spacing-right">  IRS3</span>
          <span class="mfd-value">{this.ir3Position}</span>
          </div>
          <div class="mfd-label-value-container" style={"margin-right: 65px;"}>
          <span class="mfd-value">{this.ir3PositionDeviation}</span>
          <span class="mfd-label-unit mfd-unit-trailing">NM</span>
          </div>
            </div>
            <div class="mfd-pos-monitor-table-line"></div>
            <div class ="fc">
            <div class="mfd-label-value-container">
            <span class="mfd-label mfd-spacing-right">  GPS1</span>
            <span class="mfd-value">{this.gpsPositionText}</span>
            </div>
            </div>
            <div class ="fc">
            <div class="mfd-label-value-container">
            <span class="mfd-label mfd-spacing-right">  GPS2</span>
            <span class="mfd-value">{this.gpsPositionText}</span>
            </div>
            </div>
          </div>
          <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />;
        </div>
      </>
    );
  }
}
