import { DisplayComponent, FSComponent, VNode } from 'msfssdk';
import './common.scss';

interface IconButtonProps {
    containerStyle?: string;
    icon: 'double-up' | '' | null;
}
export class IconButton extends DisplayComponent<IconButtonProps> {
    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <span class="MFDIconButton" style={`${this.props.containerStyle}`}>
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
