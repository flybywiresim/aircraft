import { ConsumerSubject, EventBus, FSComponent, MappedSubject, SubscribableUtils, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent as DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { splitDecimals, GaugeComponent, GaugeMarkerComponent } from 'instruments/src/MsfsAvionicsCommon/gauges';
import { SDSimvars } from '../../../SDSimvarPublisher';
import { Arinc429LocalVarConsumerSubject, FmsData } from '@flybywiresim/fbw-sdk';

export interface CruisePressureProps {
  readonly bus: EventBus;
}

export class CruisePressure extends DestroyableComponent<CruisePressureProps> {
  private readonly sub = this.props.bus.getSubscriber<SDSimvars & FmsData>();

  private readonly landingElev1 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmLandingElevation_1'));
  private readonly landingElev2 = Arinc429LocalVarConsumerSubject.create(this.sub.on('fmLandingElevation_2'));

  private readonly cabinAltitudeIsAuto = ConsumerSubject.create(this.sub.on('cabinAltitudeIsAuto'), true);
  private readonly cabinVerticalSpeedIsAuto = ConsumerSubject.create(this.sub.on('cabinVerticalSpeedIsAuto'), true);
  private readonly manualControlActive = MappedSubject.create(
    ([alt, vs]) => !alt || !vs,
    this.cabinAltitudeIsAuto,
    this.cabinVerticalSpeedIsAuto,
  );

  private readonly cabAltAutoTextClass = this.cabinAltitudeIsAuto.map((auto) => `${auto ? '' : 'Hide'} F24 Green LS1`);
  private readonly cabVsAutoTextClass = this.cabinVerticalSpeedIsAuto.map(
    (auto) => `${auto ? '' : 'Hide'} F24 Green LS1`,
  );

  private readonly manCabinAltitude = ConsumerSubject.create(this.sub.on('manCabinAltitude'), 0);
  private readonly manCabinDeltaPressure = ConsumerSubject.create(this.sub.on('manCabinDeltaPressure'), 0);
  private readonly manCabinVerticalSpeed = ConsumerSubject.create(this.sub.on('manCabinVerticalSpeed'), 0);

  private readonly cpcsDiscreteWord = [
    Arinc429LocalVarConsumerSubject.create(this.sub.on('cpcsBxDiscreteWord_1')),
    Arinc429LocalVarConsumerSubject.create(this.sub.on('cpcsBxDiscreteWord_2')),
    Arinc429LocalVarConsumerSubject.create(this.sub.on('cpcsBxDiscreteWord_3')),
    Arinc429LocalVarConsumerSubject.create(this.sub.on('cpcsBxDiscreteWord_4')),
  ];

  private readonly cpcsIndexToUse = MappedSubject.create(
    (cpcsDw) => {
      const index = cpcsDw.findIndex((v) => v.isNormalOperation());
      return index !== -1 ? index + 1 : 0;
    },
    ...this.cpcsDiscreteWord,
  );

  private readonly cabinAltitude = Arinc429LocalVarConsumerSubject.create(this.sub.on('pressCabinAltitude_1'));

  private readonly cabinDeltaPressure = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('pressCabinDeltaPressure_1'),
  );

  private readonly cabinVerticalSpeed = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('pressCabinVerticalSpeed_1'),
  );

  private readonly vsGaugeX = 555;
  private readonly vsGaugeY = 465;
  private readonly vsGaugeRadius = 50;

  private readonly landingElevClass = MappedSubject.create(
    ([manual, fms1, fms2]) => (!manual && (fms1.isNormalOperation() || fms2.isNormalOperation()) ? 'Show' : 'Hide'),
    this.manualControlActive,
    this.landingElev1,
    this.landingElev2,
  );
  private readonly landingElevValue = MappedSubject.create(
    ([le1, le2]) => {
      const le = le1.isNormalOperation() ? le1.value : le2.isNormalOperation() ? le2.value : null;

      return le !== null ? (Math.round(le / 50) * 50).toFixed(0) : '--';
    },
    this.landingElev1,
    this.landingElev2,
  );

  private readonly cabinAltitudeValue = MappedSubject.create(
    ([auto, man]) => (auto.isNormalOperation() ? auto.value : man),
    this.cabinAltitude,
    this.manCabinAltitude,
  );
  private readonly cabAltText = this.cabinAltitudeValue.map((cabinAlt) =>
    (Math.round(cabinAlt / 50) * 50 > 0 ? Math.round(cabinAlt / 50) * 50 : 0).toFixed(0),
  );

  private readonly deltaPressValue = MappedSubject.create(
    ([auto, man]) => (auto.isNormalOperation() ? auto.value : man),
    this.cabinDeltaPressure,
    this.manCabinDeltaPressure,
  );
  private readonly deltaPressSplit = [
    this.deltaPressValue.map((v) => splitDecimals(v)[0]),
    this.deltaPressValue.map((v) => splitDecimals(v)[1]),
  ];

  private readonly cabinVerticalSpeedValue = MappedSubject.create(
    ([auto, man]) => (auto.isNormalOperation() ? auto.value : man),
    this.cabinVerticalSpeed,
    this.manCabinVerticalSpeed,
  );

  private readonly cabinVsGaugeValue = this.cabinVerticalSpeedValue.map((cabinVs) =>
    Math.abs(cabinVs / 1000) <= 2.25 ? cabinVs / 1000 : 2.25,
  );

  private readonly cabinVsText = MappedSubject.create(
    ([cabinVs, manualMode]) =>
      (manualMode ? Math.round(cabinVs / 50) * 50 : Math.abs(Math.round(cabinVs / 50) * 50)).toFixed(0),
    this.cabinVerticalSpeedValue,
    this.manualControlActive,
  );

  private readonly cabinVsArrowClass = MappedSubject.create(
    ([cabinVs, manualMode]) => ((cabinVs * 60 <= -25 || cabinVs * 60 >= 25) && !manualMode ? '' : 'Hide'),
    this.cabinVerticalSpeedValue,
    this.manualControlActive,
  );
  private readonly cabinVsArrowTransform = MappedSubject.create(
    ([cabinVs]) => (cabinVs * 60 <= -25 ? 'translate(130, 870) scale(1, -1)' : 'translate(130, 77) scale(1, 1)'),
    this.cabinVerticalSpeedValue,
  );

  private readonly cabAltTextClass = MappedSubject.create(
    ([elev1, elev2, cabAlt]) => {
      const ldgElev = elev1.isNormalOperation() ? elev1.value : elev2.isNormalOperation() ? elev2.value : 0;
      return cabAlt > 9550 && ldgElev < 9550 ? 'F29 Red EndAlign' : 'F29 Green EndAlign';
    },
    this.landingElev1,
    this.landingElev2,
    this.cabinAltitudeValue,
  );

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.cpcsIndexToUse.sub((i) => {
        this.cabinAltitude.setConsumer(this.sub.on(`pressCabinAltitude_${i}`));
        this.cabinDeltaPressure.setConsumer(this.sub.on(`pressCabinDeltaPressure_${i}`));
        this.cabinVerticalSpeed.setConsumer(this.sub.on(`pressCabinVerticalSpeed_${i}`));
      }, true),
    );

    this.subscriptions.push(
      this.landingElev1,
      this.landingElev2,
      this.cabinAltitudeIsAuto,
      this.cabinAltitudeIsAuto,
      this.manualControlActive,
      this.cabAltAutoTextClass,
      this.cabVsAutoTextClass,
      this.manCabinAltitude,
      this.manCabinDeltaPressure,
      this.manCabinVerticalSpeed,
      ...this.cpcsDiscreteWord,
      this.cpcsIndexToUse,
      this.cabinAltitude,
      this.cabinDeltaPressure,
      this.cabinVerticalSpeed,
      this.landingElevClass,
      this.landingElevValue,
      this.cabinAltitudeValue,
      this.cabAltText,
      this.deltaPressValue,
      ...this.deltaPressSplit,
      this.cabinVerticalSpeedValue,
      this.cabinVsGaugeValue,
      this.cabinVsText,
      this.cabinVsArrowClass,
      this.cabinVsArrowTransform,
      this.cabAltTextClass,
    );
  }

  render() {
    return (
      <>
        <g id="LandingElevation" class={this.landingElevClass}>
          <text class="F26 MiddleAlign White LS1" x="470" y="355">
            LDG ELEVN
          </text>

          <text id="LandingElevation" class={`F29 EndAlign Green`} x="653" y="359">
            {this.landingElevValue}
          </text>
          <text class="F22 Cyan" x="658" y="359">
            FT
          </text>
        </g>

        {/* Vertical speed gauge */}
        {/* FIXME add grey arc + VS target donut */}
        <g id="VsIndicator">
          <GaugeComponent
            x={this.vsGaugeX}
            y={this.vsGaugeY}
            radius={this.vsGaugeRadius}
            startAngle={160}
            endAngle={20}
            visible={this.manualControlActive}
            class="Gauge"
          >
            <GaugeMarkerComponent
              value={SubscribableUtils.toSubscribable(2, true)}
              x={this.vsGaugeX}
              y={this.vsGaugeY}
              min={-2}
              max={2}
              radius={this.vsGaugeRadius}
              startAngle={180}
              endAngle={0}
              class="GaugeText"
              showValue
              textNudgeX={-5}
              textNudgeY={25}
            />
            <GaugeMarkerComponent
              value={SubscribableUtils.toSubscribable(1, true)}
              x={this.vsGaugeX}
              y={this.vsGaugeY}
              min={-2}
              max={2}
              radius={this.vsGaugeRadius}
              startAngle={180}
              endAngle={0}
              class="GaugeText"
            />
            <GaugeMarkerComponent
              value={SubscribableUtils.toSubscribable(0, true)}
              x={this.vsGaugeX}
              y={this.vsGaugeY}
              min={-2}
              max={2}
              radius={this.vsGaugeRadius}
              startAngle={180}
              endAngle={0}
              class="GaugeText"
              showValue
              textNudgeX={10}
              textNudgeY={10}
            />
            <GaugeMarkerComponent
              value={SubscribableUtils.toSubscribable(-1, true)}
              x={this.vsGaugeX}
              y={this.vsGaugeY}
              min={-2}
              max={2}
              radius={this.vsGaugeRadius}
              startAngle={180}
              endAngle={0}
              class="GaugeText"
            />
            <GaugeMarkerComponent
              value={SubscribableUtils.toSubscribable(-2, true)}
              x={this.vsGaugeX}
              y={this.vsGaugeY}
              min={-2}
              max={2}
              radius={this.vsGaugeRadius}
              startAngle={180}
              endAngle={0}
              class="GaugeText"
              showValue
              textNudgeX={-5}
              textNudgeY={-10}
            />
            <GaugeMarkerComponent
              value={this.cabinVsGaugeValue}
              x={this.vsGaugeX}
              y={this.vsGaugeY}
              min={-2}
              max={2}
              radius={this.vsGaugeRadius}
              startAngle={180}
              endAngle={0}
              class="GaugeIndicator"
              indicator
            />
          </GaugeComponent>
        </g>

        <text class="F26 White LS1" x="175" y="425">
          DELTA P
        </text>
        <text class="F29 Green EndAlign" x="332" y="425">
          {this.deltaPressSplit[0]}
        </text>
        <text class="F29 Green EndAlign" x="348" y="425">
          .
        </text>
        <text class="F29 Green" x="350" y="425">
          {this.deltaPressSplit[1]}
        </text>
        <text class="F22 Cyan" x="374" y="425">
          PSI
        </text>

        <text class={this.cabVsAutoTextClass} x="522" y="450">
          AUTO
        </text>
        <text class="F24 White LS2" x="606" y="450">
          CAB V/S
        </text>
        <text id="CabinVerticalSpeed" class="F29 Green EndAlign" x="660" y="484">
          {this.cabinVsText}
        </text>
        <text class="F22 Cyan" x="664" y="484">
          FT/MIN
        </text>

        <text class={this.cabAltAutoTextClass} x="520" y="585">
          AUTO
        </text>
        <text class="F24 White LS2" x="605" y="585">
          CAB ALT
        </text>
        <text id="CabinAltitude" class={this.cabAltTextClass} x="652" y="616">
          {this.cabAltText}
        </text>
        <text class="F22 Cyan" x="661" y="616">
          FT
        </text>

        <g id="vsArrow" class={this.cabinVsArrowClass} transform={this.cabinVsArrowTransform}>
          <path d="M433,405 h7 L446,395" class="Green SW2 NoFill" strokeLinejoin="miter" />
          <polygon points="452,388 447,396 457,396" transform="rotate(38,452,388)" class="Green SW2 NoFill" />
        </g>
      </>
    );
  }
}

export default CruisePressure;
