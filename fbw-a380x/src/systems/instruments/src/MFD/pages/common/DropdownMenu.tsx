import { ComponentProps, DisplayComponent, FSComponent, Subject, SubscribableArray, Subscription, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

interface DropdownMenuProps extends ComponentProps {
    values: SubscribableArray<string>;
    selectedIndex: Subject<number>;
    idPrefix: string;
    /**
     *
     * If defined, this component does not update the selectedIndex prop, but rather calls this method.
     */
    onModified?: (newSelectedIndex: number) => void;
    containerStyle?: string;
    alignLabels?: 'left' | 'center';
}

export class DropdownMenu extends DisplayComponent<DropdownMenuProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private label = Subject.create('NOT SET');

    private topRef = FSComponent.createRef<HTMLDivElement>();

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

        this.props.values.getArray().forEach((val, i) => {
            document.getElementById(`${this.props.idPrefix}_${i}`).addEventListener('click', () => {
                if (this.props.onModified) {
                    this.props.onModified(i);
                } else {
                    this.props.selectedIndex.set(i);
                }
                this.dropdownIsOpened.set(false);
            });
        });

        this.subs.push(this.props.values.sub((value, type, item, array) => {
            this.label.set(array[this.props.selectedIndex.get()]);
        }));

        this.subs.push(this.props.selectedIndex.sub((value) => {
            this.label.set(this.props.values.get(value));
        }));

        this.dropdownSelectorRef.instance.addEventListener('click', () => {
            this.dropdownIsOpened.set(!this.dropdownIsOpened.get());
        });

        // Close dropdown menu if clicked outside
        document.getElementById('MFD_CONTENT').addEventListener('click', (e) => {
            if (!this.topRef.getOrDefault().contains(e.target as Node) && this.dropdownIsOpened.get() === true) {
                this.dropdownIsOpened.set(false);
            }
        });

        this.subs.push(this.dropdownIsOpened.sub((val) => {
            this.dropdownMenuRef.instance.style.display = val ? 'block' : 'none';
            this.dropdownSelectorLabelRef.instance.classList.toggle('opened');
        }));

        // TODO add mouse wheel and key events
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <div class="MFDDropdownContainer" ref={this.topRef} style={this.props.containerStyle}>
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
                            id={`${this.props.idPrefix}_${idx}`}
                            class="MFDDropdownMenuElement"
                            style={`text-align: ${this.props.alignLabels === 'left' ? 'flex-start' : 'center'};`}
                        >
                            {el}
                        </span>
                    ), this)}
                </div>
            </div>
        );
    }
}
