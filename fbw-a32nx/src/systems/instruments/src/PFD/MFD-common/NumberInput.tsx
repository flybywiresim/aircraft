import { ComponentProps, DisplayComponent, FSComponent, Subscribable, VNode } from 'msfssdk';
import './common.scss';

interface NumberInputProps extends ComponentProps {
    value: Subscribable<number | undefined>;
    emptyValueString: string;
    unitLeading?: Subscribable<string | undefined>;
    unitTrailing?: Subscribable<string | undefined>;
    containerStyle?: string;
}
export class NumberInput extends DisplayComponent<NumberInputProps> {
    private textInputRef = FSComponent.createRef<HTMLInputElement>();

    private setInputFilter(textbox: Element, inputFilter: (value: string) => boolean): void {
        ['input', 'keydown', 'keyup', 'mousedown', 'mouseup', 'select', 'contextmenu', 'drop', 'focusout'].forEach((event) => {
            textbox.addEventListener(event, function (this: (HTMLInputElement | HTMLTextAreaElement) & { oldValue: string; oldSelectionStart: number | null, oldSelectionEnd: number | null }) {
                if (inputFilter(this.value)) {
                    this.oldValue = this.value;
                    this.oldSelectionStart = this.selectionStart;
                    this.oldSelectionEnd = this.selectionEnd;
                } else if (Object.prototype.hasOwnProperty.call(this, 'oldValue')) {
                    this.value = this.oldValue;

                    if (this.oldSelectionStart !== null
                && this.oldSelectionEnd !== null) {
                        this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
                    }
                } else {
                    this.value = '';
                }
            });
        });
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.setInputFilter(this.textInputRef.instance, (value) => /^\d*\.?\d*$/.test(value));
    }

    render(): VNode {
        return (
            <div class="MFDNumberInputContainer" style={this.props.containerStyle}>
                <span class="MFDUnitLabel leadingUnit">{this.props.unitLeading}</span>
                <input ref={this.textInputRef} type="text" class="MFDNumberInputTextInput" maxlength="4" placeholder={this.props.emptyValueString} size="4" pattern="[0-9]+" />
                <span class="MFDUnitLabel trailingUnit">{this.props.unitTrailing}</span>
            </div>
        );
    }
}
