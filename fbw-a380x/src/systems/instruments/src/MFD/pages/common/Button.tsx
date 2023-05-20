import { ComponentProps, DisplayComponent, FSComponent, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

interface ButtonProps extends ComponentProps {
    disabled?: Subscribable<boolean>;
    containerStyle?: string;
    onClick: () => void;
}
export class Button extends DisplayComponent<ButtonProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private buttonRef = FSComponent.createRef<HTMLSpanElement>();

    clickHandler(): void {
        if (this.props.disabled !== undefined && this.props.disabled.get() === false) {
            this.props.onClick();
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.buttonRef.instance.addEventListener('click', () => this.clickHandler());
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <span
                ref={this.buttonRef}
                class={`MFDButton${(this.props.disabled !== undefined && this.props.disabled.get() === true) ? ' disabled' : ''}`}
                style={`align-items: center; ${(this.props.disabled !== undefined && this.props.disabled.get() === true) ? 'color: grey; ' : ''} ${this.props.containerStyle}`}
            >
                {this.props.children}
            </span>
        );
    }
}
