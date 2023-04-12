import { DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';
import './common.scss';

interface ButtonProps {
    disabled?: Subscribable<boolean>;
    containerStyle?: string;
    onClick?: () => void;
}
export class Button extends DisplayComponent<ButtonProps> {
    private spanRef = FSComponent.createRef<HTMLSpanElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        if (this.props.disabled !== undefined && this.props.disabled.get() === true) {
            this.spanRef.instance.addEventListener('click', this.props.onClick);
        }
    }

    render(): VNode {
        return (
            <span
                ref={this.spanRef}
                class={`MFDButton${(this.props.disabled !== undefined && this.props.disabled.get() === true) ? ' disabled' : ''}`}
                style={`align-items: center; ${(this.props.disabled !== undefined && this.props.disabled.get() === true) ? 'color: grey; ' : ''} ${this.props.containerStyle}`}
            >
                {this.props.children}
            </span>
        );
    }
}
