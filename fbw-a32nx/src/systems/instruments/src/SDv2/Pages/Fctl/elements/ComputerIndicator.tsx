import { EventBus, FSComponent, MappedSubject, Subscribable, VNode } from '@microsoft/msfs-sdk';

import { DestroyableComponent } from '@flybywiresim/msfs-avionics-common';
import { ComponentPositionProps } from '../../../common/ComponentPositionProps';
import { Arinc429LocalVarConsumerSubject } from '@flybywiresim/fbw-sdk';
import { SvgGroup } from '../../../common/SvgGroup';
import { FcdcChoiceEvents } from '../../../providers/FcdcChoiceProvider';

interface ElacSecProps extends ComponentPositionProps {
  num: number;
  bus: EventBus;
}

export class SecComputerIndicator extends DestroyableComponent<ElacSecProps> {
  private readonly sub = this.props.bus.getSubscriber<FcdcChoiceEvents>();

  private readonly fcdcDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcdc_discrete_word_040'),
  );

  private readonly fcdcWordValid = this.fcdcDiscreteWord1.map((word) => word.isNormalOperation());

  private readonly computerFailed = this.fcdcDiscreteWord1.map((word) =>
    word.bitValue(this.props.num === 3 ? 29 : 24 + this.props.num),
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.fcdcDiscreteWord1, this.fcdcWordValid, this.computerFailed);
  }

  destroy(): void {
    super.destroy();
  }

  render() {
    return (
      <ElacSecShape
        x={this.props.x}
        y={this.props.y}
        num={this.props.num}
        infoAvailable={this.fcdcWordValid}
        computerFailed={this.computerFailed}
      />
    );
  }
}

export class ElacComputerIndicator extends DestroyableComponent<ElacSecProps> {
  private readonly sub = this.props.bus.getSubscriber<FcdcChoiceEvents>();

  private readonly fcdcDiscreteWord1 = Arinc429LocalVarConsumerSubject.create(
    this.sub.on('a32nx_fcdc_discrete_word_040'),
  );

  private readonly fcdcWordValid = this.fcdcDiscreteWord1.map((word) => word.isNormalOperation());

  private readonly computerFailed = this.fcdcDiscreteWord1.map((word) => word.bitValue(22 + this.props.num));

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.fcdcDiscreteWord1, this.fcdcWordValid, this.computerFailed);
  }

  destroy(): void {
    super.destroy();
  }

  render() {
    return (
      <ElacSecShape
        x={this.props.x}
        y={this.props.y}
        num={this.props.num}
        infoAvailable={this.fcdcWordValid}
        computerFailed={this.computerFailed}
      />
    );
  }
}

interface ElacSecShapeProps extends ComponentPositionProps {
  num: number;
  infoAvailable: Subscribable<boolean>;
  computerFailed: Subscribable<boolean>;
}

class ElacSecShape extends DestroyableComponent<ElacSecShapeProps> {
  private readonly lineColorClass = MappedSubject.create(
    ([infoAvailable, computerFailed]) => (!computerFailed || !infoAvailable ? 'Grey' : 'Amber'),
    this.props.infoAvailable,
    this.props.computerFailed,
  );

  private readonly textColorClass = MappedSubject.create(
    ([infoAvailable, computerFailed]) => (!computerFailed && infoAvailable ? 'Green' : 'Amber'),
    this.props.infoAvailable,
    this.props.computerFailed,
  );

  onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    this.subscriptions.push(this.lineColorClass, this.textColorClass);
  }

  destroy(): void {
    super.destroy();
  }

  render() {
    return (
      <SvgGroup x={this.props.x} y={this.props.y}>
        <path
          class={this.lineColorClass.map((color) => `SW2 ${color} LineRound NoFill`)}
          d="M0 0 l97,0 l0,-33 l-10,0"
        />
        <text x={76} y={-7} class={this.textColorClass.map((color) => `F25 ${color}`)}>
          {this.props.infoAvailable.map((avail) => (avail ? this.props.num : 'X'))}
        </text>
      </SvgGroup>
    );
  }
}
