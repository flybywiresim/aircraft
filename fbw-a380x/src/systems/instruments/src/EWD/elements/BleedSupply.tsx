import { Arinc429Word } from '@flybywiresim/fbw-sdk';
import { ConsumerSubject, DisplayComponent, EventBus, FSComponent, MappedSubject } from '@microsoft/msfs-sdk';
import { Arinc429Values } from 'instruments/src/EWD/shared/ArincValueProvider';
import { EwdSimvars } from 'instruments/src/EWD/shared/EwdSimvarPublisher';

interface BleedSupplyProps {
  bus: EventBus;
  x: number;
  y: number;
}

export class BleedSupply extends DisplayComponent<BleedSupplyProps> {
  private readonly sub = this.props.bus.getSubscriber<EwdSimvars>();
  private readonly subArinc = this.props.bus.getSubscriber<Arinc429Values>();

  private readonly cpiomBAgsDiscrete = ConsumerSubject.create(
    this.subArinc.on('cpiomBAgsDiscrete').whenChanged(),
    Arinc429Word.empty(),
  );

  private readonly nai1 = ConsumerSubject.create(this.sub.on('eng_anti_ice_1').whenChanged(), false);
  private readonly nai2 = ConsumerSubject.create(this.sub.on('eng_anti_ice_2').whenChanged(), false);
  private readonly nai3 = ConsumerSubject.create(this.sub.on('eng_anti_ice_3').whenChanged(), false);
  private readonly nai4 = ConsumerSubject.create(this.sub.on('eng_anti_ice_4').whenChanged(), false);

  private readonly wai = ConsumerSubject.create(this.sub.on('wing_anti_ice').whenChanged(), false);

  private readonly bleedText = MappedSubject.create(
    ([cpiomB, nai1, nai2, nai3, nai4, wai]) => {
      const text = [];
      if (cpiomB.getBitValueOr(13, false) || cpiomB.getBitValueOr(14, false)) {
        text.push('PACKS');
      }

      if (nai1 || nai2 || nai3 || nai4) {
        text.push('NAI');
      }

      if (wai) {
        text.push('WAI');
      }
      return text.join('/');
    },
    this.cpiomBAgsDiscrete,
    this.nai1,
    this.nai2,
    this.nai3,
    this.nai4,
    this.wai,
  );

  render() {
    return (
      <text x={this.props.x} y={this.props.y} class="Green F26 End">
        {this.bleedText}
      </text>
    );
  }
}
