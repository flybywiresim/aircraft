import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, SubscribableArray, VNode } from 'msfssdk';
import './common.scss';

interface DropdownMenuProps extends ComponentProps {
    values: SubscribableArray<string>;
    selectedIndex: Subscribable<number>;
    idPrefix: string;
    onChangeCallback: (newSelectedIndex: number) => void;
    useNewStyle?: boolean;
}
export class DropdownMenu extends DisplayComponent<DropdownMenuProps> {
    private label = Subject.create<string>('NOT SET');

    private dropdownSelectorRef = FSComponent.createRef<HTMLDivElement>();

    private dropdownMenuRef = FSComponent.createRef<HTMLDivElement>();

    private toggleMenuVisibility() {
        if (this.dropdownMenuRef.instance.style.display === 'block') {
            this.dropdownMenuRef.instance.style.display = 'none';
        } else {
            this.dropdownMenuRef.instance.style.display = 'block';
        }
    }

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

        this.dropdownSelectorRef.instance.addEventListener('click', () => this.toggleMenuVisibility());
        this.dropdownMenuRef.instance.style.display = 'none';

        for (let i = 0; i < this.props.values.length; i++) {
            document.getElementById(`${this.props.idPrefix}_${i}`).addEventListener('click', () => {
                this.toggleMenuVisibility();
                this.props.onChangeCallback(i);
            });
        }
    }

    render(): VNode {
        return (
            <div class="MFDDropdownContainer">
                <div ref={this.dropdownSelectorRef} class="MFDDropdownOuter">
                    <div class={`MFDDropdownInner${this.props.useNewStyle ? 'V2' : ''}`}>
                        <span class={`MFDDropdownLabel${this.props.useNewStyle ? 'V2' : ''}`}>
                            {this.label}
                        </span>
                    </div>
                    <div style="display: flex; justify-content: center; align-items: center; width: 25px;">
                        <svg height="15" width="15">
                            <polygon points="0,0 15,0 7.5,15" style="fill: white" />
                        </svg>
                    </div>
                </div>
                <div ref={this.dropdownMenuRef} class="MFDDropdownMenu">
                    {this.props.values.getArray().map((el, idx) => <span class="MFDDropdownMenuElement" id={`${this.props.idPrefix}_${idx}`}>{el}</span>)}
                </div>
            </div>
        );
    }
}
