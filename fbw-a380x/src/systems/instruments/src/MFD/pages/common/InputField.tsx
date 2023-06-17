import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscription, VNode } from '@microsoft/msfs-sdk';
import './style.scss';
import { DataEntryFormat } from 'instruments/src/MFD/pages/common/DataEntryFormats';

// eslint-disable-next-line max-len
export const emptyMandatoryCharacter = (selected: boolean) => `<svg width="16" height="23" viewBox="1 1 13 23"><polyline points="2,2 2,22 13,22 13,2 2,2" fill="none" stroke=${selected ? 'black' : '#e68000'} stroke-width="2" /></svg>`;

interface InputFieldProps<T> extends ComponentProps {
    dataEntryFormat: DataEntryFormat<T>;
    isMandatory: boolean;
    value: Subject<T>;
    /**
     * If defined, this component does not update the value prop, but rather calls this method.
     */
    onModified?: (newValue: T) => void;
    containerStyle?: string;
}

/**
     * Input field for text or numbers
     */
export class InputField<T> extends DisplayComponent<InputFieldProps<T>> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private spanningDivRef = FSComponent.createRef<HTMLDivElement>();

    private textInputRef = FSComponent.createRef<HTMLSpanElement>();

    private caretRef = FSComponent.createRef<HTMLSpanElement>();

    private leadingUnit = Subject.create<string>(undefined);

    private trailingUnit = Subject.create<string>(undefined);

    private modifiedFieldValue = Subject.create<string>(null);

    private isFocused = Subject.create(false);

    private isValidating = Subject.create(false);

    private onNewValue() {
        // If currently editing, blur field
        // Reset modifiedFieldValue
        if (this.modifiedFieldValue.get() !== null) {
            this.textInputRef.getOrDefault().blur();
            this.modifiedFieldValue.set(null);
        } else {
            this.updateDisplayElement();
        }
    }

    private updateDisplayElement() {
        // If modifiedFieldValue.get() === null, render props' value
        if (this.modifiedFieldValue.get() === null) {
            if (!this.props.value.get()) {
                this.populatePlaceholders();
            } else {
                const [formatted, leadingUnit, trailingUnit] = this.props.dataEntryFormat.format(this.props.value.get());
                this.textInputRef.getOrDefault().innerText = formatted;
                this.leadingUnit.set(leadingUnit);
                this.trailingUnit.set(trailingUnit);
            }
        } else { // Else, render modifiedFieldValue
            const numDigits = this.props.dataEntryFormat.maxDigits;
            if (this.modifiedFieldValue.get().length < numDigits || this.isFocused.get() === false) {
                this.textInputRef.getOrDefault().innerText = this.modifiedFieldValue.get();
                this.caretRef.getOrDefault().innerText = '';
            } else {
                this.textInputRef.getOrDefault().innerText = this.modifiedFieldValue.get().slice(0, numDigits - 1);
                this.caretRef.getOrDefault().innerText = this.modifiedFieldValue.get().slice(numDigits - 1, numDigits);
            }
        }
    }

    private onKeyDown(ev: KeyboardEvent) {
        if (ev.keyCode === KeyCode.KEY_BACK_SPACE) {
            if (this.modifiedFieldValue.get() === null) {
                this.modifiedFieldValue.set('0');
            } else if (this.modifiedFieldValue.get().length === 0) {
                // Do nothing
            } else {
                this.modifiedFieldValue.set(this.modifiedFieldValue.get().slice(0, -1));
            }
        }
    }

    private onKeyPress(ev: KeyboardEvent) {
        // Un-select the text
        this.textInputRef.getOrDefault().classList.remove('valueSelected');
        // ev.key is undefined, so we have to use the deprecated keyCode here
        const key = String.fromCharCode(ev.keyCode);

        if (ev.keyCode !== KeyCode.KEY_ENTER) {
            if (this.modifiedFieldValue.get() === null) {
                this.modifiedFieldValue.set('');
            }

            if (this.modifiedFieldValue.get()?.length < this.props.dataEntryFormat.maxDigits) {
                this.modifiedFieldValue.set(`${this.modifiedFieldValue.get()}${key}`);
                this.caretRef.getOrDefault().style.display = 'inline';
            }
        } else {
            // Enter was pressed
            this.caretRef.getOrDefault().style.display = 'none';
            this.textInputRef.getOrDefault().blur();
        }
    }

    private onFocus() {
        this.isFocused.set(true);
        this.textInputRef.getOrDefault().classList.add('valueSelected');
        if (this.props.isMandatory === true) {
            this.textInputRef.getOrDefault().classList.remove('mandatory');
        }
        this.modifiedFieldValue.set(null);
        this.spanningDivRef.getOrDefault().style.justifyContent = 'flex-start';
        this.updateDisplayElement();
    }

    private onBlur() {
        this.isFocused.set(false);
        this.textInputRef.getOrDefault().classList.remove('valueSelected');
        this.spanningDivRef.getOrDefault().style.justifyContent = 'flex-end';
        this.caretRef.getOrDefault().style.display = 'none';
        this.updateDisplayElement();

        if (!this.modifiedFieldValue.get() && this.props.value.get()) {
            // Enter is pressed after no modification
            this.validateAndUpdate(this.props.value.get().toString());
        } else {
            this.validateAndUpdate(this.modifiedFieldValue.get());
        }
    }

    private populatePlaceholders() {
        const [formatted, unitLeading, unitTrailing] = this.props.dataEntryFormat.format(null);
        this.leadingUnit.set(unitLeading);
        this.trailingUnit.set(unitTrailing);

        if (this.props.isMandatory === true) {
            this.textInputRef.getOrDefault().innerHTML = formatted.replace(/-/gi, emptyMandatoryCharacter(this.isFocused.get()));
        } else {
            this.textInputRef.getOrDefault().innerText = formatted;
        }
    }

    private async validateAndUpdate(input: string) {
        this.isValidating.set(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        this.modifiedFieldValue.set(null);
        const newValue = await this.props.dataEntryFormat.parse(input);

        if (this.props.onModified) {
            this.props.onModified(newValue);
        } else {
            this.props.value.set(newValue);
        }

        this.isValidating.set(false);
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        // Aspect ratio for font: 2:3 WxH
        this.spanningDivRef.instance.style.minWidth = `${Math.round(this.props.dataEntryFormat.maxDigits * 25.0 / 1.5)}px`;

        // Hide caret
        this.caretRef.instance.style.display = 'none';
        this.caretRef.instance.innerText = '';

        this.subs.push(this.props.value.sub(() => this.onNewValue(), true));
        this.subs.push(this.modifiedFieldValue.sub(() => this.updateDisplayElement()));
        this.subs.push(this.isValidating.sub((val) => {
            if (val === true) {
                this.textInputRef.getOrDefault().classList.add('validating');
            } else {
                this.textInputRef.getOrDefault().classList.remove('validating');
            }
        }));

        if (this.props.dataEntryFormat.reFormatTrigger) {
            this.subs.push(this.props.dataEntryFormat.reFormatTrigger.sub(() => this.updateDisplayElement()));
        }

        this.textInputRef.instance.addEventListener('keypress', (ev) => this.onKeyPress(ev));
        this.textInputRef.instance.addEventListener('keydown', (ev) => this.onKeyDown(ev));
        this.textInputRef.instance.addEventListener('focus', () => this.onFocus());
        this.textInputRef.instance.addEventListener('blur', () => this.onBlur());

        this.topRef.instance.addEventListener('click', () => {
            this.textInputRef.instance.focus();
        });
    }

    render(): VNode {
        return (
            <div ref={this.topRef} class="MFDNumberInputContainer" style={this.props.containerStyle}>
                <span class="MFDUnitLabel leadingUnit" style="align-self: center;">{this.leadingUnit}</span>
                <div ref={this.spanningDivRef} style="display: flex; flex-direction: row; justify-content: flex-end;">
                    <span
                        ref={this.textInputRef}
                        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                        tabIndex={0}
                        class={`MFDNumberInputTextInput${this.props.isMandatory ? ' mandatory' : ''}`}
                    >
                        .
                    </span>
                    <span ref={this.caretRef} class="MFDInputFieldCaret" />
                </div>
                <span class="MFDUnitLabel trailingUnit" style="align-self: center;">{this.trailingUnit}</span>
            </div>
        );
    }
}
