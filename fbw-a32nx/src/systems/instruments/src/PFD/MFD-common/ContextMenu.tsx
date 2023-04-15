import { ComponentProps, DisplayComponent, FSComponent, SubscribableArray, VNode } from '@microsoft/msfs-sdk';
import './style.scss';

interface ContextMenuElementProps {
    title: string;
    disabled: boolean;
    onSelectCallback: () => void;
}

interface ContextMenuProps extends ComponentProps {
    values: SubscribableArray<ContextMenuElementProps>;
    idPrefix: string;
}
export class ContextMenu extends DisplayComponent<ContextMenuProps> {
    private contextMenuRef = FSComponent.createRef<HTMLDivElement>();

    public display(x: number, y: number) {
        this.contextMenuRef.instance.style.display = 'block';
        this.contextMenuRef.instance.style.left = `${x}px`;
        this.contextMenuRef.instance.style.top = `${y}px`;
    }

    public hideMenu() {
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
    }

    render(): VNode {
        return (
            <div ref={this.contextMenuRef} class="MFDContextMenu">
                {this.props.values.getArray().map((el, idx) => (
                    <span
                        class={`MFDContextMenuElement${el.disabled === true ? ' disabled' : ''}`}
                        id={`${this.props.idPrefix}_${idx}`}
                    >
                        {el.title}
                    </span>
                ))}
            </div>
        );
    }
}
