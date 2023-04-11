import { DisplayComponent, FSComponent, VNode } from 'msfssdk';
import './common.scss';

interface ButtonProps {
    containerStyle?: string;
}
export class Button extends DisplayComponent<ButtonProps> {
    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <span class="MFDButton" style={`align-items: center; ${this.props.containerStyle}`}>
                {this.props.children}
            </span>
        );
    }
}
