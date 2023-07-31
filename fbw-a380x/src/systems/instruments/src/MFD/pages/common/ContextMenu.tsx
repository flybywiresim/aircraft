import { ComponentProps, DisplayComponent, FSComponent, Subject, SubscribableArray, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

export interface ContextMenuElementProps {
    title: string;
    disabled: boolean;
    onSelectCallback: () => void;
}

interface ContextMenuProps extends ComponentProps {
    values: SubscribableArray<ContextMenuElementProps>;
    idPrefix: string;
    opened: Subject<boolean>;
}

/*
 * Context menu, which can be opened e.g. by clicking on F-PLN waypoints
 */
export class ContextMenu extends DisplayComponent<ContextMenuProps> {
    private contextMenuRef = FSComponent.createRef<HTMLDivElement>();

    private openedAt: number = 0;

    public display(x: number, y: number) {
        this.props.opened.set(true);
        this.openedAt = Date.now();
        this.contextMenuRef.instance.style.display = 'block';
        this.contextMenuRef.instance.style.left = `${x}px`;
        this.contextMenuRef.instance.style.top = `${y}px`;
    }

    public hideMenu() {
        this.props.opened.set(false);
        this.contextMenuRef.instance.style.display = 'none';
    }

    onAfterRender(node: VNode): void {
        super.onAfterRender(node);

        this.contextMenuRef.instance.style.display = 'none';

        this.props.values.getArray().forEach((el, idx) => {
            if (el.disabled === false) {
                document.getElementById(`${this.props.idPrefix}_${idx}`).addEventListener('click', () => {
                    this.hideMenu();
                    el.onSelectCallback();
                });
            }
        });

        // Close dropdown menu if clicked outside
        document.getElementById('MFD_CONTENT').addEventListener('click', () => {
            if ((Date.now() - this.openedAt) > 100 && this.props.opened.get() === true) {
                this.hideMenu();
            }
        });
    }

    render(): VNode {
        return (
            <div ref={this.contextMenuRef} class="mfd-context-menu">
                {this.props.values.getArray().map((el, idx) => (
                    <span
                        class={`mfd-context-menu-element${el.disabled === true ? ' disabled' : ''}`}
                        id={`${this.props.idPrefix}_${idx}`}
                    >
                        {el.title}
                    </span>
                ))}
            </div>
        );
    }
}
