import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

export type ButtonMenuItem = {
    label: string;
    action(): void;
};

export interface ButtonProps extends ComponentProps {
    label: string | Subject<VNode>;
    menuItems?: Subscribable<ButtonMenuItem[]>; // When defining menu items, idPrefix has to be set
    idPrefix?: string;
    disabled?: Subject<boolean>;
    buttonStyle?: string;
    onClick: () => void;
}

/*
 * Button for MFD pages. If menuItems is set, a dropdown menu will be displayed when button is clicked
 */
export class Button extends DisplayComponent<ButtonProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private buttonRef = FSComponent.createRef<HTMLSpanElement>();

    private dropdownMenuRef = FSComponent.createRef<HTMLDivElement>();

    private dropdownIsOpened = Subject.create(false);

    private renderedMenuItems: ButtonMenuItem[];

    clickHandler(): void {
        if (this.props.disabled.get() === false) {
            this.props.onClick();
        }
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        if (!this.props.disabled) {
            this.props.disabled = Subject.create(false);
        }
        if (typeof this.props.label === 'string') {
            this.props.label = Subject.create(<span>{this.props.label}</span>);
        }
        if (!this.props.menuItems) {
            this.props.menuItems = Subject.create<ButtonMenuItem[]>([]);
        } else if (!this.props.idPrefix) {
            console.error('Button: menuItems set without idPrefix.');
        }
        if (!this.props.idPrefix) {
            this.props.idPrefix = '';
        }

        this.buttonRef.instance.addEventListener('click', () => this.clickHandler());

        this.subs.push(this.props.disabled.sub((val) => {
            if (val === true) {
                this.buttonRef.getOrDefault().classList.add('disabled');
            } else {
                this.buttonRef.getOrDefault().classList.remove('disabled');
            }
        }, true));

        // Menu handling
        this.subs.push(this.props.menuItems.sub((items) => {
            // Delete click handler, delete dropdownMenuRef children, render dropdownMenuRef children,
            this.renderedMenuItems?.forEach((val, i) => {
                document.getElementById(`${this.props.idPrefix}_${i}`).removeEventListener('click', () => {
                    val.action();
                    this.dropdownIsOpened.set(false);
                });
            });

            // Delete dropdownMenuRef's children
            while (this.dropdownMenuRef.instance.firstChild) {
                this.dropdownMenuRef.instance.removeChild(this.dropdownMenuRef.instance.firstChild);
            }

            this.renderedMenuItems = items;

            // Render dropdownMenuRef's children
            const itemNodes: VNode = (
                <div>
                    {items?.map<VNode>((el, idx) => (
                        <span
                            id={`${this.props.idPrefix}_${idx}`}
                            class="MFDDropdownMenuElement"
                            style={'text-align: \'left\'; padding: 5px 16px;'}
                        >
                            {el.label}
                        </span>
                    ), this)}
                </div>
            );
            FSComponent.render(itemNodes, this.dropdownMenuRef.instance);

            // Add click event listener
            items?.forEach((val, i) => {
                document.getElementById(`${this.props.idPrefix}_${i}`).addEventListener('click', () => {
                    val.action();
                    this.dropdownIsOpened.set(false);
                });
            });
        }, true));

        this.subs.push(this.props.label?.sub((val) => {
            while (this.buttonRef.instance.firstChild) {
                this.buttonRef.instance.removeChild(this.buttonRef.instance.firstChild);
            }
            FSComponent.render(val, this.buttonRef.instance);
        }, true));

        // Close dropdown menu if clicked outside
        document.getElementById('MFD_CONTENT').addEventListener('click', (e) => {
            if (!this.topRef.getOrDefault().contains(e.target as Node) && this.dropdownIsOpened.get() === true) {
                this.dropdownIsOpened.set(false);
            }
        });

        this.buttonRef.instance.addEventListener('click', () => {
            if (this.props.menuItems.get().length > 0) {
                this.dropdownIsOpened.set(!this.dropdownIsOpened.get());
            }
        });

        this.subs.push(this.dropdownIsOpened.sub((val) => {
            this.dropdownMenuRef.instance.style.display = val ? 'block' : 'none';
            this.buttonRef.instance.classList.toggle('opened');

            // Check if menu leaves screen at the bottom, reposition if needed
            const boundingRect = this.dropdownMenuRef.instance.getBoundingClientRect();
            const overflowsVertically = (boundingRect.top + boundingRect.height) > 1024;

            if (overflowsVertically === true) {
                this.dropdownMenuRef.instance.style.top = `${Math.round(-boundingRect.height)}px`;
            }
        }));
    }

    public destroy(): void {
        // Destroy all subscriptions to remove all references to this instance.
        this.subs.forEach((x) => x.destroy());

        super.destroy();
    }

    render(): VNode {
        return (
            <div class="MFDDropdownContainer" ref={this.topRef}>
                <span
                    ref={this.buttonRef}
                    class="MFDButton"
                    style={`align-items: center; ${this.props.buttonStyle}`}
                />
                <div ref={this.dropdownMenuRef} class="MFDDropdownMenu" style={`display: ${this.dropdownIsOpened.get() ? 'block' : 'none'}`} />
            </div>
        );
    }
}
