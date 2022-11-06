import { ScrollUtils } from '../../graphics/layout/ScrollUtils';
import { SubscribableArray, SubscribableArrayEventType } from '../../sub/SubscribableArray';
import { FSComponent, NodeReference, VNode } from '../FSComponent';
import { FocusPosition, HardwareUiControl, HardwareUiControlProps } from './HardwareUiControl';

/**
 * Properties on the ControlList component.
 */
export interface HardwareControlListProps<T> extends HardwareUiControlProps {

  /** The data associated with this list component. */
  data: SubscribableArray<T>;

  /** A function that renders a single data item into the list. */
  renderItem: (data: T, index: number) => VNode;

  /** A callback called when an item in the list is selected. */
  onItemSelected?: (data: T | null, node: HardwareUiControl | null, index: number) => void;

  /** Indicates that the list should be ordered by a specified function. */
  orderBy?: (a: T, b: T) => number;

  /** The size, in pixels, of each item in the list. */
  itemSize?: number;

  /** The max number of items to display in the list. */
  numItems?: number;

  /** Whether or not to hide the list scrollbar. */
  hideScrollbar?: boolean;

  /** The CSS class to apply to this list container. */
  class?: string;

  /** An alternate HTML element to scroll to ensure the selected element is in view. */
  scrollContainer?: NodeReference<HTMLElement>

  /** Disables automatically ensuring that the container scrolls to the focused item. */
  disableContainerScroll?: boolean;
}

/**
 * A component that displays a collection of UiControls in a list format.
 */
export abstract class HardwareUiControlList<T,
  E extends Record<string, any> = Record<string, never>,
  P extends HardwareControlListProps<T> = HardwareControlListProps<T>> extends HardwareUiControl<E, P> {

  private readonly el = FSComponent.createRef<HTMLDivElement>();
  private readonly itemsContainer = FSComponent.createRef<HTMLDivElement>();

  private dataToControlMap: Map<T, HardwareUiControl<E>> | undefined;
  private controlToElementMap: Map<HardwareUiControl<E>, Element> | undefined;
  private controlToDataMap: Map<HardwareUiControl<E>, T> | undefined;
  private currentControlOrder: HardwareUiControl<E>[] | undefined;

  /**
   * Creates an instance of a ControlList.
   * @param props The props on the ControlList component.
   */
  constructor(props: P) {
    super(props);

    if (props.orderBy !== undefined) {
      this.dataToControlMap = new Map<T, HardwareUiControl<E, P>>();
      this.controlToElementMap = new Map<HardwareUiControl<E, P>, Element>();
      this.controlToDataMap = new Map<HardwareUiControl<E, P>, T>();
      this.currentControlOrder = [];
    }
  }

  /** @inheritdoc */
  public onAfterRender(node: VNode): void {
    super.onAfterRender(node);

    if (this.props.itemSize !== undefined && this.props.numItems !== undefined) {
      const listSizePx = (this.props.itemSize * this.props.numItems).toFixed(4);
      this.el.instance.style.height = listSizePx;
      this.itemsContainer.instance.style.height = listSizePx;
    }

    this.renderList();
    this.props.data.sub(this.onDataChanged.bind(this));
  }

  /**
   * A callback fired when the array subject data changes.
   * @param index The index of the change.
   * @param type The type of change.
   * @param data The item that was changed.
   */
  private onDataChanged(index: number, type: SubscribableArrayEventType, data: T | readonly T[] | undefined): void {
    switch (type) {
      case SubscribableArrayEventType.Added:
        this.onDataAdded(index, data);
        break;
      case SubscribableArrayEventType.Removed:
        this.onDataRemoved(index, data);
        break;
      case SubscribableArrayEventType.Cleared:
        this.onDataCleared();
        break;
    }
  }

  /**
   * An event called when data is added to the subscription.
   * @param index The index that the data was added at.
   * @param data The data that was added.
   */
  private onDataAdded(index: number, data: T | readonly T[] | undefined): void {
    if (data !== undefined) {
      const currentItemElement = this.itemsContainer.instance.children.item(index);

      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          const dataItem = data[i];
          const indexToAdd = index + i;

          this.addDataItem(dataItem, indexToAdd, currentItemElement);
        }
      } else {
        this.addDataItem(data, index, currentItemElement);
      }
    }

    this.updateOrder();
  }

  /**
   * Adds a data item to the control list and performs the required rendering and
   * ordering operations.
   * @param dataItem The data item to add to the list.
   * @param indexToAdd The index to add the item at.
   * @param currentItemElement The current DOM element that resides at the location to add to.
   */
  private addDataItem(dataItem: any, indexToAdd: number, currentItemElement: Element | null): void {
    const controlNode = this.props.renderItem(dataItem, indexToAdd);
    const control = controlNode.instance as HardwareUiControl;

    //Nefariously monkey-patch the onFocused handler to get notified when the item is focused,
    //regardless of the underlying implementation or overrides
    const originalOnFocused = (control as any).onFocused.bind(control);
    (control as any).onFocused = (source: HardwareUiControl): void => {
      this.onItemFocused();
      originalOnFocused && originalOnFocused(source);
    };

    const element = this.renderToDom(controlNode, indexToAdd, currentItemElement);
    this.register(controlNode.instance as HardwareUiControl<E, P>, indexToAdd);

    if (element !== null && controlNode.instance !== null) {
      this.addToOrderTracking(controlNode.instance as HardwareUiControl<E, P>, dataItem, element);
    }
  }

  /**
   * An event called when data is removed from the subscription.
   * @param index The index that the data was removed at.
   * @param data The data that was removed;
   */
  private onDataRemoved(index: number, data: T | readonly T[] | undefined): void {
    if (index >= 0 && index < this.length) {
      if (Array.isArray(data)) {
        for (let i = 0; i < data.length; i++) {
          const dataItem = data[i];
          this.removeDataItem(dataItem, index);
        }
      } else if (data !== undefined) {
        this.removeDataItem(data as T, index);
      }

      this.updateOrder();
    }
  }

  /**
   * Removes a data item from the control list.
   * @param data The data item to remove.
   * @param index The index of the data that was removed.
   */
  private removeDataItem(data: T, index: number): void {
    if (this.dataToControlMap !== undefined && this.registeredControls !== undefined) {
      const control = this.dataToControlMap.get(data);
      if (control !== undefined) {
        index = this.registeredControls.indexOf(control);
      }
    }

    let control: HardwareUiControl<E> | undefined;
    if (this.registeredControls !== undefined) {
      control = this.registeredControls[index];
    }

    this.unregister(index);
    this.removeDomNode(index);

    this.removeFromOrderTracking(data);
    control?.destroy();
  }

  /**
   * An event called when the data is cleared in the subscription.
   */
  private onDataCleared(): void {
    let controls: HardwareUiControl<E>[] | undefined;
    if (this.registeredControls !== undefined) {
      controls = [...this.registeredControls];
    }

    this.clearRegistered();
    this.itemsContainer.instance.innerHTML = '';

    this.clearOrderTracking();
    if (controls !== undefined) {
      for (let i = 0; i < controls.length; i++) {
        controls[i].destroy();
      }
    }

    if (this.props.onItemSelected) {
      this.props.onItemSelected(null, null, -1);
    }
  }

  /**
   * Adds a data item to element order tracking information.
   * @param control The index to add the data item at.
   * @param data The data to add tracking information for.
   * @param element The DOM element to associate with this data item.
   */
  private addToOrderTracking(control: HardwareUiControl<E, P>, data: T, element: Element): void {
    if (this.controlToElementMap !== undefined && this.dataToControlMap !== undefined && this.controlToDataMap !== undefined) {
      this.dataToControlMap.set(data, control);
      this.controlToElementMap.set(control, element);
      this.controlToDataMap.set(control, data);
    }
  }

  /**
   * Removes a data item from element order tracking information.
   * @param data The data item to remove order tracking information for.
   */
  private removeFromOrderTracking(data: T): void {
    if (this.controlToElementMap !== undefined && this.dataToControlMap !== undefined && this.controlToDataMap !== undefined) {
      const control = this.dataToControlMap.get(data);

      if (control !== undefined) {
        this.dataToControlMap.delete(data);
        this.controlToElementMap.delete(control);
        this.controlToDataMap.delete(control);
      }
    }
  }

  /**
   * Clears all data item element order tracking information.
   */
  private clearOrderTracking(): void {
    if (this.controlToElementMap !== undefined && this.dataToControlMap !== undefined && this.controlToDataMap !== undefined) {
      this.dataToControlMap.clear();
      this.controlToElementMap.clear();
      this.controlToDataMap.clear();
    }
  }

  /**
   * Updates the order of data items in the list by the props supplied
   * comparison function, if one exists.
   */
  public updateOrder(): void {
    if (this.controlToElementMap !== undefined && this.dataToControlMap !== undefined && this.controlToDataMap !== undefined) {
      const itemsContainer = this.itemsContainer.instance;

      if (this.registeredControls !== undefined) {
        const selectedControl = this.getChild(this.getFocusedIndex());
        this.registeredControls.sort(this.sortControls);

        if (!this.orderUnchanged()) {

          for (let i = 0; i < this.registeredControls.length; i++) {
            const element = this.controlToElementMap.get(this.registeredControls[i]);
            if (element !== undefined) {
              itemsContainer.appendChild(element);
            }
          }

          this.currentControlOrder = [...this.registeredControls];

          if (selectedControl !== undefined) {
            this.focusedIndex = this.registeredControls.indexOf(selectedControl);
            this.ensureIndexInView(this.focusedIndex);
          }
        }
      }
    }
  }

  /**
   * Checks whether or not the control order is the same as it was previously.
   * @returns True if the order is the same, false otherwise.
   */
  private orderUnchanged(): boolean {
    if (this.registeredControls !== undefined && this.currentControlOrder !== undefined) {
      if (this.registeredControls.length === this.currentControlOrder.length) {
        return this.registeredControls.every((control, i) => this.currentControlOrder && control === this.currentControlOrder[i]);
      }

      return false;
    }

    return true;
  }

  /**
   * Sorts the registered controls by the provided ordering comparison function.
   * @param a The first control to compare.
   * @param b The second control to compare.
   * @returns Negative if the first control is less than, zero if equal, positive if greater than.
   */
  private sortControls = (a: HardwareUiControl<E>, b: HardwareUiControl<E>): number => {
    if (this.controlToDataMap !== undefined && this.props.orderBy !== undefined) {
      const aData = this.controlToDataMap.get(a);
      const bData = this.controlToDataMap.get(b);

      if (aData !== undefined && bData !== undefined) {
        return this.props.orderBy(aData, bData);
      }
    }

    return 0;
  };

  /**
   * Removes a dom node from the collection at the specified index.
   * @param index The index to remove.
   */
  private removeDomNode(index: number): void {
    const child = this.itemsContainer.instance.childNodes.item(index);
    this.itemsContainer.instance.removeChild(child);
  }

  /**
   * Adds a list rendered dom node to the collection.
   * @param node Item to render and add.
   * @param index The index to add at.
   * @param el The element to add to.
   * @returns The created DOM element.
   */
  private renderToDom(node: VNode, index: number, el: Element | null): Element | null {
    if (el !== null) {
      node && el && FSComponent.renderBefore(node, el as any);

      return el.previousElementSibling;
    } else {
      el = this.itemsContainer.instance;
      node && el && FSComponent.render(node, el as any);

      return this.itemsContainer.instance.lastElementChild;
    }
  }

  /**
   * Scrolls to an item.
   * @param index is the index of the list item to scroll to.
   * @param focusPosition The focus position to apply to children of the item being scrolled to.
   */
  public scrollToIndex(index: number, focusPosition: FocusPosition = FocusPosition.First): void {
    const control = this.getChild(index);
    if (control !== undefined) {
      control.focus(focusPosition);
    }
  }

  /**
   * Ensures an indexed list item is in view.
   * @param index The index of the list item.
   */
  public ensureIndexInView(index: number): void {
    const el = this.getElement(index);
    const container = this.props.scrollContainer?.getOrDefault() ?? this.itemsContainer.getOrDefault();
    if (el && container && !this.props.disableContainerScroll) {
      ScrollUtils.ensureInView(el, container);
    }
  }

  /**
   * Gets an element at the specified data/control index.
   * @param index The data/control index to get the element for.
   * @returns The request HTML element.
   */
  private getElement(index: number): HTMLElement | null {
    return this.itemsContainer.instance.children[index] as HTMLElement ?? null;
  }

  /**
   * Gets the data object related to the selected DOM element.
   * @param index The index of the data to get.
   * @returns The selected item, if found.
   */
  public getData(index: number): T | null {
    const control = this.getChild(index);

    if (this.controlToDataMap !== undefined && control !== undefined) {
      return this.controlToDataMap.get(control) ?? null;
    }

    if (index > -1) {
      return this.props.data.get(index);
    }

    return null;
  }

  /**
   * Get the selected HTMLElement.
   * @returns The selected element, if found.
   */
  public getSelectedElement(): HTMLElement | null {
    return this.itemsContainer.instance.children[this.getSelectedIndex()] as HTMLElement ?? null;
  }

  /**
   * Gets the index of the currently selected element.
   * @returns Selected element index. Returns -1 if nothing found.
   */
  public getSelectedIndex(): number {
    if (this.length > 0) {
      return this.getFocusedIndex();
    }

    return -1;
  }

  /**
   * Gets the instance of the node at the specified index.
   * @param index The index to get the instance for.
   * @returns The node instance of specified type.
   */
  public getChildInstance<TControl extends HardwareUiControl<E>>(index: number): TControl | null {
    const child = this.getChild(index) as TControl;
    if (child !== undefined) {
      return child;
    }

    return null;
  }

  /** @inheritdoc */
  protected onBlurred(source: HardwareUiControl<E, P>): void {
    if (this.props.onItemSelected) {
      this.props.onItemSelected(null, null, -1);
    }

    super.onBlurred(source);
  }

  /**
   * Responds to when a list item is focused.
   */
  private onItemFocused(): void {
    const index = this.getFocusedIndex();
    this.ensureIndexInView(index);
    if (this.props.onItemSelected) {
      const control = this.getChild(index);
      if (control !== undefined && control.isFocused) {
        let data: T | undefined = this.props.data.get(index);
        if (this.controlToDataMap !== undefined) {
          data = this.controlToDataMap.get(control);
        }

        if (data !== undefined) {
          this.props.onItemSelected(data, control, index);
        }
      }
    }
  }

  /**
   * Renders the complete list of data items as control components.
   */
  private renderList(): void {
    this.itemsContainer.instance.textContent = '';
    this.onDataAdded(0, this.props.data.getArray());
  }

  /**
   * Renders the control list scroll bar.
   */
  protected abstract renderScrollbar(): VNode;

  /** @inheritdoc */
  public render(): VNode {
    return (
      <div class={`ui-control-list ${this.props.class ?? ''}`} ref={this.el}>
        <div ref={this.itemsContainer} class='ui-control-list-content'>
        </div>
        {!this.props.hideScrollbar && this.renderScrollbar()}
      </div>
    );
  }
}