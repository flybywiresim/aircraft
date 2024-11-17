import {
  ComponentProps,
  DisplayComponent,
  FSComponent,
  Subject,
  Subscribable,
  Subscription,
  VNode,
} from '@microsoft/msfs-sdk';
import './style.scss';

export interface ContextMenuElement {
  name: string;
  disabled: boolean | Subscribable<boolean>;
  onPressed: () => void;
}

interface ContextMenuProps extends ComponentProps {
  values: Subscribable<ContextMenuElement[]>;
  idPrefix: string;
  opened: Subject<boolean>;
}

/*
 * Context menu, which can be opened e.g. by clicking on F-PLN waypoints
 */
export class ContextMenu extends DisplayComponent<ContextMenuProps> {
  // Make sure to collect all subscriptions here, otherwise page navigation doesn't work.
  private subs = [] as Subscription[];

  private contextMenuRef = FSComponent.createRef<HTMLDivElement>();

  private renderedMenuItems: ContextMenuElement[] = [];

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

    if (!this.props.idPrefix) {
      console.error('ContextMenu: No idPrefix set.');
    }

    this.contextMenuRef.instance.style.display = 'none';

    this.subs.push(
      this.props.values.sub((items) => {
        // Delete click handler, delete contextMenuRef children, render contextMenuRef children,
        this.renderedMenuItems?.forEach((val, i) => {
          document
            .getElementById(`${this.props.idPrefix}_${i}`)
            ?.removeEventListener('click', this.onItemClick.bind(this, val));
        });

        // Delete contextMenuRef's children
        while (this.contextMenuRef.instance.firstChild) {
          this.contextMenuRef.instance.removeChild(this.contextMenuRef.instance.firstChild);
        }

        this.renderedMenuItems = items;

        // Render contextMenuRef's children
        const itemNodes: VNode = (
          <div>
            {items?.map<VNode>(
              (el, idx) => (
                <span
                  class={`mfd-context-menu-element${el.disabled === true ? ' disabled' : ''}`}
                  id={`${this.props.idPrefix}_${idx}`}
                >
                  {el.name}
                </span>
              ),
              this,
            )}
          </div>
        );
        FSComponent.render(itemNodes, this.contextMenuRef.instance);

        // Add click event listener
        items?.forEach((val, i) => {
          document
            .getElementById(`${this.props.idPrefix}_${i}`)
            ?.addEventListener('click', this.onItemClick.bind(this, val));
        });
      }, true),
    );

    // Close dropdown menu if clicked outside
    document.getElementById('MFD_CONTENT')?.addEventListener('click', this.onCloseHandler);
  }

  private onItemClick(val: ContextMenuElement) {
    if (!val.disabled) {
      this.hideMenu();
      val.onPressed();
    }
  }

  private onClose() {
    if (Date.now() - this.openedAt > 100 && this.props.opened.get() === true) {
      this.hideMenu();
    }
  }

  private onCloseHandler = this.onClose.bind(this);

  render(): VNode {
    return <div ref={this.contextMenuRef} class="mfd-context-menu" />;
  }
}
