import { FSComponent, DisplayComponent, VNode, Subscribable, MappedSubject, ComponentProps } from '@microsoft/msfs-sdk';

export interface LayerProps extends ComponentProps {
  x: number | Subscribable<number>;
  y: number | Subscribable<number>;
  visible?: Subscribable<boolean>;
}

export class Layer extends DisplayComponent<LayerProps> {
  render(): VNode | null {
    const { x, y } = this.props;
    const ref = this.props.ref ?? FSComponent.createRef();

    let value: Subscribable<string> | string;
    if (typeof x !== 'number' && typeof y !== 'number') {
      value = MappedSubject.create(([x, y]) => `translate(${x}, ${y})`, x, y);
    } else if (typeof x !== 'number' || typeof y !== 'number') {
      throw new Error('Both attributes of Layer must be of the same type (number or Subscribable)');
    } else {
      value = `translate(${x}, ${y})`;
    }

    return (
      <g
        ref={ref}
        transform={value}
        visibility={this.props.visible?.map((v) => (v ? 'inherit' : 'hidden')) ?? 'inherit'}
      >
        {this.props.children}
      </g>
    );
  }
}
