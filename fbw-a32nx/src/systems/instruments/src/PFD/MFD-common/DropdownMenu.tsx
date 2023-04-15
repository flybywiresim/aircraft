import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, SubscribableArray, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

interface DropdownMenuProps extends ComponentProps {
    values: SubscribableArray<string>;
    selectedIndex: Subscribable<number>;
    idPrefix: string;
    onChangeCallback: (newSelectedIndex: number) => void;
    containerStyle?: string;
    alignLabels?: 'left' | 'center';
}
export class DropdownMenu extends DisplayComponent<DropdownMenuProps> {
    private label = Subject.create('NOT SET');

    private dropdownSelectorRef = FSComponent.createRef<HTMLDivElement>();

    private dropdownSelectorLabelRef = FSComponent.createRef<HTMLSpanElement>();

    private dropdownMenuRef = FSComponent.createRef<HTMLDivElement>();

    private dropdownIsOpened = Subject.create(false);

    constructor(props: DropdownMenuProps) {
        super(props);

        this.label.set(this.props.values.get(this.props.selectedIndex.get()));
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.props.values.sub((value) => {
            this.label.set(value[this.props.selectedIndex.get()]);
        });

        this.props.selectedIndex.sub((value) => {
            this.label.set(this.props.values.get(value));
        });

        this.dropdownSelectorRef.instance.addEventListener('click', () => {
            this.dropdownIsOpened.set(!this.dropdownIsOpened.get());
        });

        this.dropdownIsOpened.sub((val) => {
            this.dropdownMenuRef.instance.style.display = val ? 'block' : 'none';
            this.dropdownSelectorLabelRef.instance.classList.toggle('opened');
        });

        for (let i = 0; i < this.props.values.length; i++) {
            document.getElementById(`${this.props.idPrefix}_${i}`).addEventListener('click', () => {
                this.dropdownIsOpened.set(false);
                this.props.onChangeCallback(i);
            });
        }
    }

    render(): VNode {
        return (
            <div class="MFDDropdownContainer" style={this.props.containerStyle}>
                <div ref={this.dropdownSelectorRef} class="MFDDropdownOuter">
                    <div class="MFDDropdownInner" style={`justify-content: ${this.props.alignLabels === 'left' ? 'flex-start' : 'center'};`}>
                        <span ref={this.dropdownSelectorLabelRef} class="MFDDropdownLabel">
                            {this.label}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: center; align-items: center; width: 25px;">
                        <svg height="15" width="15">
                            <polygon points="0,0 15,0 7.5,15" style="fill: white" />
                        </svg>
                    </div>
                </div>
                <div ref={this.dropdownMenuRef} class="MFDDropdownMenu" style={`display: ${this.dropdownIsOpened.get() ? 'block' : 'none'}`}>
                    {this.props.values.getArray().map((el, idx) => (
                        <span
                            class="MFDDropdownMenuElement"
                            id={`${this.props.idPrefix}_${idx}`}
                            style={`text-align: ${this.props.alignLabels === 'left' ? 'flex-start' : 'center'};`}
                        >
                            {el}
                        </span>
                    ))}
                </div>
            </div>
        );
    }
}
