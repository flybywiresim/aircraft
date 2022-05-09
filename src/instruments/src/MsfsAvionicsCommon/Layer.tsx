import { FSComponent, DisplayComponent, VNode, Subscribable, MappedSubject } from 'msfssdk';

export interface LayerProps {
    x: number | Subscribable<number>;
    y: number | Subscribable<number>;
    visible?: Subscribable<boolean>;
}

export class Layer extends DisplayComponent<LayerProps> {
    render(): VNode | null {
        const { x, y } = this.props;

        let value;
        if (typeof x !== 'number' && typeof y !== 'number') {
            value = MappedSubject.create(([x, y]) => `translate(${x}, ${y})`, x, y);
        } else if (typeof x !== 'number' || typeof y !== 'number') {
            throw new Error('Both attributes of Layer must be of the same type (number or Subscribable)');
        } else {
            value = `translate(${x}, ${y})`;
        }

        return (
            <g transform={value} visibility={this.props.visible?.map((v) => (v ? 'visible' : 'hidden')) ?? 'visible'}>
                {this.props.children}
            </g>
        );
    }
}
