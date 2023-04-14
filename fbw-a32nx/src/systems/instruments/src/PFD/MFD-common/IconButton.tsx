import { ComponentProps, DisplayComponent, FSComponent, VNode } from 'msfssdk';
import './style.scss';

interface IconButtonProps extends ComponentProps {
    containerStyle?: string;
    icon: 'double-up' | '' | null;
    onClick?: () => void;
}
export class IconButton extends DisplayComponent<IconButtonProps> {
    private spanRef = FSComponent.createRef<HTMLSpanElement>();

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.spanRef.instance.addEventListener('click', this.props.onClick);
    }

    render(): VNode {
        return (
            <span ref={this.spanRef} class="MFDIconButton" style={`${this.props.containerStyle}`}>
                {this.props.icon === 'double-up' && (
                    <svg width="35" height="35" xmlns="http://www.w3.org/17.500/svg">
                        <polygon points="0,17.5 17.5,0 35,17.5" style="fill:white;" />
                        <polygon points="0,35 17.5,17.5 35,35" style="fill:white;" />
                    </svg>
                )}
            </span>
        );
    }
}
