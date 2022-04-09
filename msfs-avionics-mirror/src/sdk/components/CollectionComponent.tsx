import { FSComponent, DisplayComponent, ComponentProps, VNode } from './FSComponent';

/** The value retured when we add a item to the collection. */
export type CollectionComponentItemRef = string;

/** Convenience shortcut for the valid item types. */
type CollectionComponentItem = HTMLElement | SVGElement | DisplayComponent<any> | string | number | null;

/**
 * The props for a CollectionComponent.
 */
export interface CollectionComponentProps extends ComponentProps {
  /** The element ID to use. */
  id: string;
}

/**
 * A component that lets you add and remove children.
 */
export class CollectionComponent<P extends CollectionComponentProps> extends DisplayComponent<P> {
  private items = new Array<CollectionComponentItem>();
  private itemCounter = 0;

  /**
   * Add a new child element.
   * @param node A VNode to add to the container.
   * @returns An identifier for the added element.
   */
  public addItem(node: VNode): CollectionComponentItemRef {
    const id = `${this.props.id}_${this.itemCounter++}`;
    FSComponent.render(<div id={id}>{node}</div>, document.getElementById(this.props.id));
    return id;
  }

  /**
   * Remove a child element.
   * @param id The ID of the child to remove.
   */
  public removeItem(id: CollectionComponentItemRef): void {
    FSComponent.remove(document.getElementById(id));
  }

  /**
   * Insert a child before an element.
   * @param node The node to insert
   * @param before The element to insert before.
   * @returns An identifier for the added element.
   */
  public insertBefore(node: VNode, before: CollectionComponentItemRef,): CollectionComponentItemRef {
    const id = `${this.props.id}_${this.itemCounter++}`;
    FSComponent.renderBefore(<div id={id}>{node}</div>, document.getElementById(before));
    return id;
  }

  /**
   * Insert a child after an element.
   * @param node The node to insert
   * @param after The element to insert after.
   * @returns An identifier for the added element.
   */
  public insertAfter(node: VNode, after: CollectionComponentItemRef,): CollectionComponentItemRef {
    const id = `${this.props.id}_${this.itemCounter++}`;
    FSComponent.renderAfter(<div id={id}>{node}</div>, document.getElementById(after));
    return id;
  }

  /**
   * Render the element.
   * @returns A VNode.
   */
  public render(): VNode {
    return (
      <div id={this.props.id}></div>
    );
  }
}