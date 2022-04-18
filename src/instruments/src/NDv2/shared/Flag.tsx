import { DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';

export interface FlagProps {
    x: number,
    y: number,
    class: string,
    shown: Subscribable<boolean>,
}

export class Flag extends DisplayComponent<FlagProps> {
    private readonly flagRef = FSComponent.createRef<SVGTextElement>();

    onAfterRender(node: VNode) {
        super.onAfterRender(node);

        this.props.shown.sub((shown) => {
            this.flagRef.instance.style.visibility = shown ? 'visible' : 'hidden';
        }, true);
    }

    render(): VNode | null {
        return (
            <text
                x={this.props.x}
                y={this.props.y}
                ref={this.flagRef}
                class={`${this.props.class} shadow MiddleAlign`}
            >
                {this.props.children}
            </text>
        );
    }
}
