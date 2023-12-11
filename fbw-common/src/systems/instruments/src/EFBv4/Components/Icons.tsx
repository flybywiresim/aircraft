import { DisplayComponent, FSComponent, VNode, ComponentProps } from '@microsoft/msfs-sdk';

interface IconProps extends ComponentProps {
    icon: string,
    class?: string,
    size?: number,
}

export class Icon extends DisplayComponent<IconProps> {
    private readonly class = this.props.class ? `${this.props.class} ` : '';

    render(): VNode {
        return (
            <i class={`${this.props.class}bi-${this.props.icon} text-[${this.props.size}px] text-inherit}`} />
        );
    }
}
