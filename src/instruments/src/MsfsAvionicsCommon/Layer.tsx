import { FSComponent, DisplayComponent, VNode, Subscribable, MappedSubject } from 'msfssdk';

export class Layer extends DisplayComponent<{ x: number | Subscribable<number>, y: number | Subscribable<number> }> {
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
            <g transform={value}>
                {this.props.children}
            </g>
        );
    }
}
