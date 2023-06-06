import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, VNode } from '@microsoft/msfs-sdk';
import { coordinateToString } from 'shared/GeoUtils';
import './style.scss';

type NumberInputTypes = 'genericInteger' | 'altitude' | 'mach' | 'weight' | 'percentage' | 'coordinateLat' | 'coordinateLon';

interface NumberInputFieldProps extends ComponentProps {
    type: NumberInputTypes;
    isMandatory: boolean;
    value: Subscribable<number>;
    submitCallback: (value?: string) => void;
    isValidating: Subscribable<boolean>;
    unitLeading?: Subscribable<string>;
    unitTrailing?: Subscribable<string>;
    containerStyle?: string;
}

// eslint-disable-next-line max-len
const emptyMandatoryCharacter = (selected: boolean) => `<svg width="16" height="23" viewBox="0 0 13 23"><polyline points="2,2 2,22 13,22 13,2 2,2" fill="none" stroke=${selected ? 'black' : '#e68000'} stroke-width="2" /></svg>`;

export class NumberInputField extends DisplayComponent<NumberInputFieldProps> {
    private topRef = FSComponent.createRef<HTMLDivElement>();

    private spanningDivRef = FSComponent.createRef<HTMLDivElement>();

    private textInputRef = FSComponent.createRef<HTMLSpanElement>();

    private caretRef = FSComponent.createRef<HTMLSpanElement>();

    private modifiedFieldValue = Subject.create<string>(undefined);

    private isFocused = Subject.create(false);

    private onNewValue() {
        // If currently editing, blur field
        // Reset modifiedFieldValue
        if (this.modifiedFieldValue.get() !== undefined) {
            this.textInputRef.getOrDefault().blur();
            this.modifiedFieldValue.set(undefined);
        } else {
            this.updateDisplayElement();
        }
    }

    private updateDisplayElement() {
        // If modifiedFieldValue.get() === undefined, render value
        if (this.modifiedFieldValue.get() === undefined) {
            if (this.props.value.get() === undefined) {
                this.populatePlaceholders();
            } else {
                const val = this.props.value.get();
                switch (this.props.type) {
                case 'genericInteger':
                    this.textInputRef.getOrDefault().innerText = val.toString();
                    break;
                case 'altitude':
                    this.textInputRef.getOrDefault().innerText = val.toString();
                    break;
                case 'mach':
                    this.textInputRef.getOrDefault().innerText = `.${val.toFixed(2).split('.')[1]}`;
                    break;
                case 'weight':
                    this.textInputRef.getOrDefault().innerText = val.toFixed(1);
                    break;
                case 'percentage':
                    this.textInputRef.getOrDefault().innerText = val.toFixed(1);
                    break;
                case 'coordinateLat':
                    this.textInputRef.getOrDefault().innerText = coordinateToString({ lat: val, lon: 0 }, false).split('/')[0];
                    break;
                case 'coordinateLon':
                    this.textInputRef.getOrDefault().innerText = coordinateToString({ lat: val, lon: 0 }, false).split('/')[1];
                    break;
                default:
                    break;
                }
            }
        } else { // Else, render modifiedFieldValue
            const numDigits = this.getNumDigits(this.props.type);
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
            if (this.modifiedFieldValue.get() === undefined) {
                this.modifiedFieldValue.set('0');
            } else if (this.modifiedFieldValue.get().length === 0) {
                // Do nothing
            } else {
                this.modifiedFieldValue.set(this.modifiedFieldValue.get().slice(0, -1));
            }
        }
    }

    // Use keypress for catching enter button
    private onKeyPress(ev: KeyboardEvent) {
        // Un-select the numbers
        this.textInputRef.getOrDefault().classList.remove('valueSelected');
        // ev.key is undefined, so we have to use the deprecated keyCode here
        const key = String.fromCharCode(ev.keyCode);

        let allowedCharMap = ['-'];
        if (['mach', 'percentage', 'weight'].includes(this.props.type)) {
            allowedCharMap = ['.'];
        } else if (['coordinateLat', 'coordinateLon'].includes(this.props.type)) {
            allowedCharMap = ['-', '.', 'N', 'S', 'E', 'W'];
        }

        if (Number.isInteger(parseInt(key)) === true || allowedCharMap.includes(key)) {
            if (this.modifiedFieldValue.get() === undefined) {
                this.modifiedFieldValue.set('');
            }
            this.modifiedFieldValue.set(`${this.modifiedFieldValue.get()}${key}`);
            this.caretRef.getOrDefault().style.display = 'inline';
        }

        if (ev.keyCode === KeyCode.KEY_ENTER) {
            this.caretRef.getOrDefault().style.display = 'none';
            this.textInputRef.getOrDefault().blur();
        }
    }

    private onFocus() {
        this.isFocused.set(true);
        this.textInputRef.getOrDefault().classList.add('valueSelected');
        this.modifiedFieldValue.set(undefined);
        this.spanningDivRef.getOrDefault().style.justifyContent = 'flex-start';
        this.updateDisplayElement();
    }

    private onBlur() {
        this.isFocused.set(false);
        this.textInputRef.getOrDefault().classList.remove('valueSelected');
        this.spanningDivRef.getOrDefault().style.justifyContent = 'center';
        this.caretRef.getOrDefault().style.display = 'none';
        this.updateDisplayElement();

        // If Enter is pressed immediately after selecting, reconstruct currently selected value
        if (this.modifiedFieldValue.get() === undefined) {
            this.props.submitCallback(this.props.value.get().toString());
        } else {
            this.props.submitCallback(this.modifiedFieldValue.get());
        }
    }

    private populatePlaceholders() {
        if (this.props.isMandatory === true) {
            switch (this.props.type) {
            case 'genericInteger':
                this.textInputRef.getOrDefault().innerHTML = emptyMandatoryCharacter(this.isFocused.get()).repeat(3);
                break;
            case 'altitude':
                this.textInputRef.getOrDefault().innerHTML = emptyMandatoryCharacter(this.isFocused.get()).repeat(4);
                break;
            case 'mach':
                this.textInputRef.getOrDefault().innerHTML = `<span style="color: #e68000">.</span>${emptyMandatoryCharacter(this.isFocused.get()).repeat(2)}`;
                break;
            case 'weight':
                // eslint-disable-next-line max-len
                this.textInputRef.getOrDefault().innerHTML = `${emptyMandatoryCharacter(this.isFocused.get()).repeat(3)}<span style="color: #e68000">.</span>${emptyMandatoryCharacter(this.isFocused.get())}`;
                break;
            case 'percentage':
                // eslint-disable-next-line max-len
                this.textInputRef.getOrDefault().innerHTML = `${emptyMandatoryCharacter(this.isFocused.get()).repeat(2)}<span style="color: #e68000">.</span>${emptyMandatoryCharacter(this.isFocused.get())}`;
                break;
            case 'coordinateLat':
                // eslint-disable-next-line max-len
                this.textInputRef.getOrDefault().innerHTML = `${emptyMandatoryCharacter(this.isFocused.get()).repeat(2)}<span style="color: #e68000">°</span>${emptyMandatoryCharacter(this.isFocused.get()).repeat(2)}<span style="color: #e68000">.</span>${emptyMandatoryCharacter(this.isFocused.get())}`;
                break;
            case 'coordinateLon':
                // eslint-disable-next-line max-len
                this.textInputRef.getOrDefault().innerHTML = `${emptyMandatoryCharacter(this.isFocused.get()).repeat(3)}<span style="color: #e68000">°</span>${emptyMandatoryCharacter(this.isFocused.get()).repeat(2)}<span style="color: #e68000">.</span>${emptyMandatoryCharacter(this.isFocused.get())}`;
                break;
            default:
                break;
            }
        } else {
            switch (this.props.type) {
            case 'genericInteger':
                this.textInputRef.getOrDefault().innerText = '---';
                break;
            case 'altitude':
                this.textInputRef.getOrDefault().innerText = '----';
                break;
            case 'mach':
                this.textInputRef.getOrDefault().innerText = '.--';
                break;
            case 'weight':
                this.textInputRef.getOrDefault().innerText = '---.-';
                break;
            case 'percentage':
                this.textInputRef.getOrDefault().innerText = '--.-';
                break;
            case 'coordinateLat':
                this.textInputRef.getOrDefault().innerText = '--°--.-';
                break;
            case 'coordinateLon':
                this.textInputRef.getOrDefault().innerText = '---°--.-';
                break;
            default:
                break;
            }
        }
    }

    private getNumDigits(type: NumberInputTypes): number {
        let numDigits: number = 0;
        switch (type) {
        case 'genericInteger':
            numDigits = 3;
            break;
        case 'altitude':
            numDigits = 4;
            break;
        case 'mach':
            numDigits = 3;
            break;
        case 'weight':
            numDigits = 5;
            break;
        case 'percentage':
            numDigits = 4;
            break;
        case 'coordinateLat':
            numDigits = 7;
            break;
        case 'coordinateLon':
            numDigits = 8;
            break;
        default:
            break;
        }

        return numDigits;
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        // Set field width
        const numDigits = this.getNumDigits(this.props.type);

        // Aspect ratio for font: 2:3 WxH
        this.spanningDivRef.instance.style.width = `${numDigits * 25.0 / 1.5}px`;
        // this.textInputRef.instance.style.width = `${numDigits * 25.0 / 1.5}px`;

        // Hide caret
        this.caretRef.instance.style.display = 'none';
        this.caretRef.instance.innerText = '';

        this.props.value.sub(() => this.onNewValue(), true);
        this.modifiedFieldValue.sub(() => this.updateDisplayElement());
        this.props.isValidating.sub((val) => {
            if (val === true) {
                this.textInputRef.getOrDefault().classList.add('validating');
            } else {
                this.textInputRef.getOrDefault().classList.remove('validating');
            }
        });

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
                <span class="MFDUnitLabel leadingUnit">{this.props.unitLeading}</span>
                <div ref={this.spanningDivRef} style="display: flex; flex-direction: row; justify-content: center;">
                    <span
                        ref={this.textInputRef}
                        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                        tabIndex={0}
                        class="MFDNumberInputTextInput"
                    >
                        .
                    </span>
                    <span ref={this.caretRef} class="MFDInputFieldCaret" />
                </div>
                <span class="MFDUnitLabel trailingUnit">{this.props.unitTrailing}</span>
            </div>
        );
    }
}
