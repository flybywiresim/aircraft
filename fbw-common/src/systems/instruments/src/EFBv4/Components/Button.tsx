import { DisplayComponent, FSComponent, VNode, ComponentProps } from '@microsoft/msfs-sdk';

interface ButtonProps extends ComponentProps {
    onClick: (any) => any,
    class?: string,
}

export class Button extends DisplayComponent<ButtonProps> {
    private readonly root = FSComponent.createRef<HTMLSpanElement>();

    onAfterRender() {
        this.root.instance.addEventListener('click', this.props.onClick);
    }

    render(): VNode {
        return (
            <div ref={this.root} class={this.props.class}>
                {this.props.children}
            </div>
        );
    }
}
