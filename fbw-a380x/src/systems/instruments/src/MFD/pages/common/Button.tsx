import { ComponentProps, DisplayComponent, FSComponent, Subject, Subscribable, Subscription, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

type ButtonMenuItem = {
    label: string;
    action(): void;
};

interface ButtonProps extends ComponentProps {
    menuItems?: ButtonMenuItem[];
    idPrefix?: string;
    disabled?: Subscribable<boolean>;
    buttonStyle?: string;
    onClick: () => void;
}
export class Button extends DisplayComponent<ButtonProps> {
    // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
    private subs = [] as Subscription[];

    private topRef = FSComponent.createRef<HTMLDivElement>();

    private buttonRef = FSComponent.createRef<HTMLSpanElement>();

    private dropdownMenuRef = FSComponent.createRef<HTMLDivElement>();

    private dropdownIsOpened = Subject.create(false);

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
        if (!this.props.idPrefix) {
            this.props.idPrefix = '';
        }
        if (!this.props.menuItems) {
            this.props.menuItems = [] as ButtonMenuItem[];
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
        this.props.menuItems.forEach((val, i) => {
            document.getElementById(`${this.props.idPrefix}_${i}`).addEventListener('click', () => {
                val.action();
                this.dropdownIsOpened.set(false);
            });
        });

        // Close dropdown menu if clicked outside
        document.getElementById('MFD_CONTENT').addEventListener('click', (e) => {
            if (!this.topRef.getOrDefault().contains(e.target as Node) && this.dropdownIsOpened.get() === true) {
                this.dropdownIsOpened.set(false);
            }
        });

        this.buttonRef.instance.addEventListener('click', () => {
            if (this.props.menuItems.length > 0) {
                this.dropdownIsOpened.set(!this.dropdownIsOpened.get());
            }
        });

        this.subs.push(this.dropdownIsOpened.sub((val) => {
            this.dropdownMenuRef.instance.style.display = val ? 'block' : 'none';
            this.buttonRef.instance.classList.toggle('opened');
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
                >
                    {this.props.children}
                </span>
                <div ref={this.dropdownMenuRef} class="MFDDropdownMenu" style={`display: ${this.dropdownIsOpened.get() ? 'block' : 'none'}`}>
                    {this.props.menuItems && this.props.menuItems.map((el, idx) => (
                        <span
                            id={`${this.props.idPrefix}_${idx}`}
                            class="MFDDropdownMenuElement"
                            style={'text-align: \'left\'; padding: 5px 16px;'}
                        >
                            {el.label}
                        </span>
                    ), this)}
                </div>
            </div>
        );
    }
}
