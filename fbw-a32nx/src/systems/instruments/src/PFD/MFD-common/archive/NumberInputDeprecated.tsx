import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';
import './common.scss';

interface NumberInputFieldProps extends ComponentProps {
    value: Subscribable<number | undefined>;
    emptyValueString: string;
    unitLeading?: Subscribable<string | undefined>;
    unitTrailing?: Subscribable<string | undefined>;
    containerStyle?: string;
}
export class NumberInputField extends DisplayComponent<NumberInputFieldProps> {
    onAfterRender(node: VNode): void {
        super.onAfterRender(node);
    }

    render(): VNode {
        return (
            <div class="MFDTextInput" style={this.props.containerStyle}>
                <span class="MFDUnitLabel leadingUnit" style={`display: ${this.props.unitLeading ? 'inline' : 'none'}`}>{this.props.unitLeading}</span>
                <span class="MFDCyanValue">{(this.props.value.get() === undefined) ? this.props.emptyValueString : this.props.value}</span>
                <span class="MFDUnitLabel trailingUnit" style={`display: ${this.props.unitTrailing ? 'inline' : 'none'}`}>{this.props.unitTrailing}</span>
            </div>
        );
    }
}
