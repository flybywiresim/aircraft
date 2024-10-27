import { ClockEvents, FSComponent, Subject, VNode } from '@microsoft/msfs-sdk';
import { AbstractMfdPageProps } from 'instruments/src/MFD/MFD';
import { FmsPage } from '../../common/FmsPage';
import { Arinc429Register, coordinateToString } from '@flybywiresim/fbw-sdk';
import { Coordinates } from '@fmgc/flightplanning/data/geo';
import { Footer } from '../../common/Footer';
import { InputField } from '../../common/InputField';
import { RnpFormat } from '../../common/DataEntryFormats';
import './MfdFmsPositionMonitor.scss';

interface MfdFmsPositionMonitorPageProps extends AbstractMfdPageProps {}

export class MfdFmsPositionMonitor extends FmsPage<MfdFmsPositionMonitorPageProps> {
  private readonly fmsRnp = Subject.create<number | null>(null);

  private readonly rnpEnteredByPilot = Subject.create(false);

  private readonly fmsEpu = Subject.create('-.--');

  private readonly ir1LatitudeRegister = Arinc429Register.empty();

  private readonly ir1LongitudeRegister = Arinc429Register.empty();

  private readonly ir1Coordinates: Coordinates = { lat: 0, long: 0 };

  private readonly ir1Position = Subject.create('');

  private readonly ir2LatitudeRegister = Arinc429Register.empty();

  private readonly ir2LongitudeRegister = Arinc429Register.empty();

  private readonly ir2Coordinates: Coordinates = { lat: 0, long: 0 };

  private readonly ir2Position = Subject.create('');

  private readonly ir3LatitudeRegister = Arinc429Register.empty();

  private readonly ir3LongitudeRegister = Arinc429Register.empty();

  private readonly ir3Coordinates: Coordinates = { lat: 0, long: 0 };

  private readonly ir3Position = Subject.create('');

  private readonly fmPosition = Subject.create('');

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
    this.fmsEpu.set(navigation.getEpe() != Infinity ? navigation.getEpe().toFixed(1) : '--.-');
    this.fmsRnp.set(rnp);
    this.rnpEnteredByPilot.set(navigation.isRnpManual());
    this.fmPosition.set(
      coordinateToString(this.props.fmcService.master.navigation.getPpos() ?? { lat: 0, long: 0 }, false),
    );

    this.ir1LatitudeRegister.setFromSimVar('L:A32NX_ADIRS_IR_1_LATITUDE');
    this.ir1LongitudeRegister.setFromSimVar('L:A32NX_ADIRS_IR_1_LONGITUDE');
    this.ir1Position.set(
      this.computeIrPositionString(this.ir1LatitudeRegister, this.ir1LongitudeRegister, this.ir1Coordinates),
    );
    this.ir2LatitudeRegister.setFromSimVar('L:A32NX_ADIRS_IR_2_LATITUDE');
    this.ir2LongitudeRegister.setFromSimVar('L:A32NX_ADIRS_IR_2_LONGITUDE');
    this.ir2Position.set(
      this.computeIrPositionString(this.ir2LatitudeRegister, this.ir2LongitudeRegister, this.ir2Coordinates),
    );
    this.ir3LatitudeRegister.setFromSimVar('L:A32NX_ADIRS_IR_3_LATITUDE');
    this.ir3LongitudeRegister.setFromSimVar('L:A32NX_ADIRS_IR_3_LONGITUDE');
    this.ir3Position.set(
      this.computeIrPositionString(this.ir3LatitudeRegister, this.ir3LongitudeRegister, this.ir3Coordinates),
    );
  }

  private computeIrPositionString(
    latitude: Arinc429Register,
    longitude: Arinc429Register,
    coordinates: Coordinates,
  ): string {
    if (
      !latitude.isNormalOperation() ||
      latitude.isNoComputedData() ||
      !longitude.isNormalOperation() ||
      longitude.isNoComputedData()
    ) {
      return '--°--.--/---°--.-';
    }
    coordinates.lat = latitude.value;
    coordinates.long = longitude.value;

    return coordinateToString(coordinates, false);
  }

  render(): VNode {
    return (
      <>
        {super.render()}
        {/* begin page content */}
        <div class="mfd-page-container">
          <div class="pos-monitor-header">
            <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right">ACCURACY</span>
              <span class="mfd-value">HIGH</span>
            </div>
            <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right" style="width: 110px;">
                EPU
              </span>
              <span class="mfd-value">{this.fmsEpu}</span>
              <span class="mfd-label-unit mfd-unit-trailing">NM</span>
            </div>
          </div>
          <div class="pos-monitor-header">
            <div class="mfd-label-value-container">
              <span class="mfd-label mfd-spacing-right">GPS</span>
              <span class="mfd-value">PRIMARY</span>
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
                containerStyle="width: 150px;"
                errorHandler={(e) => this.props.fmcService.master?.showFmsErrorMessage(e)}
                hEventConsumer={this.props.mfd.hEventConsumer}
                interactionMode={this.props.mfd.interactionMode}
              />
            </div>
          </div>
          <Footer bus={this.props.bus} mfd={this.props.mfd} fmcService={this.props.fmcService} />;
        </div>
      </>
    );
  }
}
