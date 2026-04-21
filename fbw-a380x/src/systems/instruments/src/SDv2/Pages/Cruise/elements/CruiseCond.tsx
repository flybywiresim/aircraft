import { ConsumerSubject, EventBus, FSComponent, MappedSubject, VNode } from '@microsoft/msfs-sdk';
import { DestroyableComponent } from 'instruments/src/MsfsAvionicsCommon/DestroyableComponent';
import { SDSimvars } from '../../../SDSimvarPublisher';

export interface CruiseCondProps {
  readonly bus: EventBus;
}

export class CruiseCond extends DestroyableComponent<CruiseCondProps> {
  private readonly sub = this.props.bus.getSubscriber<SDSimvars>();

  private readonly cockpitCabinTemp = ConsumerSubject.create(this.sub.on('cockpitCabinTemp'), 0);
  private readonly cockpitCabinTempFormatted = this.cockpitCabinTemp.map((v) => v.toFixed(0));

  private readonly fwdCargoTemp = ConsumerSubject.create(this.sub.on('fwdCargoTemp'), 0);
  private readonly fwdCargoTempFormatted = this.cockpitCabinTemp.map((v) => v.toFixed(0));

  private readonly aftCargoTemp = ConsumerSubject.create(this.sub.on('aftCargoTemp'), 0);
  private readonly aftCargoTempFormatted = this.cockpitCabinTemp.map((v) => v.toFixed(0));

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      this.cockpitCabinTemp,
      this.cockpitCabinTempFormatted,
      this.fwdCargoTemp,
      this.fwdCargoTempFormatted,
      this.aftCargoTemp,
      this.aftCargoTempFormatted,
    );
  }

  render() {
    return (
      <>
        <text class="F22 Cyan" x="19" y="506">
          °C
        </text>
        <text id="CockpitTemp" class="F29 Green EndAlign" x="109" y="528">
          {this.cockpitCabinTempFormatted}
        </text>

        <CabinTemperatures bus={this.props.bus} />

        {/* Cargo Temps */}
        <text id="fwdCargoTemp" class="F29 Green EndAlign" x="178" y="595">
          {this.fwdCargoTempFormatted}
        </text>
        <text id="AftCargoTemp" class="F29 Green EndAlign" x="378" y="595">
          {this.aftCargoTempFormatted}
        </text>
      </>
    );
  }
}

export class CabinTemperatures extends DestroyableComponent<CruiseCondProps> {
  private readonly sub = this.props.bus.getSubscriber<SDSimvars>();

  private readonly mainDeckTemp: ConsumerSubject<number>[] = [
    ConsumerSubject.create(this.sub.on('condMainDeckTemp_1'), 0),
    ConsumerSubject.create(this.sub.on('condMainDeckTemp_2'), 0),
    ConsumerSubject.create(this.sub.on('condMainDeckTemp_3'), 0),
    ConsumerSubject.create(this.sub.on('condMainDeckTemp_4'), 0),
    ConsumerSubject.create(this.sub.on('condMainDeckTemp_5'), 0),
    ConsumerSubject.create(this.sub.on('condMainDeckTemp_6'), 0),
    ConsumerSubject.create(this.sub.on('condMainDeckTemp_7'), 0),
    ConsumerSubject.create(this.sub.on('condMainDeckTemp_8'), 0),
  ];

  private readonly upperDeckTemp: ConsumerSubject<number>[] = [
    ConsumerSubject.create(this.sub.on('condUpperDeckTemp_1'), 0),
    ConsumerSubject.create(this.sub.on('condUpperDeckTemp_2'), 0),
    ConsumerSubject.create(this.sub.on('condUpperDeckTemp_3'), 0),
    ConsumerSubject.create(this.sub.on('condUpperDeckTemp_4'), 0),
    ConsumerSubject.create(this.sub.on('condUpperDeckTemp_5'), 0),
    ConsumerSubject.create(this.sub.on('condUpperDeckTemp_6'), 0),
    ConsumerSubject.create(this.sub.on('condUpperDeckTemp_7'), 0),
  ];

  private readonly minMaxMainDeckTemp = MappedSubject.create(
    (temps) => {
      return [Math.min(...temps), Math.max(...temps)];
    },
    ...this.mainDeckTemp,
  );
  private readonly minMainDeckTemp = this.minMaxMainDeckTemp.map((v) => v[0].toFixed(0));
  private readonly maxMainDeckTemp = this.minMaxMainDeckTemp.map((v) => v[1].toFixed(0));

  private readonly minMaxUpperDeckTemp = MappedSubject.create(
    (temps) => {
      return [Math.min(...temps), Math.max(...temps)];
    },
    ...this.upperDeckTemp,
  );
  private readonly minUpperDeckTemp = this.minMaxUpperDeckTemp.map((v) => v[0].toFixed(0));
  private readonly maxUpperDeckTemp = this.minMaxUpperDeckTemp.map((v) => v[1].toFixed(0));

  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(
      ...this.mainDeckTemp,
      ...this.upperDeckTemp,
      this.minMaxMainDeckTemp,
      this.minMainDeckTemp,
      this.maxMainDeckTemp,
      this.minMaxUpperDeckTemp,
      this.minUpperDeckTemp,
      this.maxUpperDeckTemp,
    );
  }

  render() {
    return (
      <>
        <text id="ForwardUpperTemp" class="F29 Green EndAlign" x="210" y="506">
          {this.minUpperDeckTemp}
        </text>
        <text class="F24 White LS2" x="239" y="506">
          TO
        </text>
        <text id="AftUpperTemp" class="F29 Green EndAlign" x="340" y="506">
          {this.maxUpperDeckTemp}
        </text>

        <text id="ForwardLowerTemp" class="F29 Green EndAlign" x="210" y="552">
          {this.minMainDeckTemp}
        </text>
        <text class="F24 White LS2" x="239" y="552">
          TO
        </text>
        <text id="AftLowerTemp" class="F29 Green EndAlign" x="340" y="552">
          {this.maxMainDeckTemp}
        </text>
      </>
    );
  }
}

export default CruiseCond;
